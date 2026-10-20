const cron = require('node-cron');
const Document = require('../models/Document');
const User = require('../models/User');
const ReminderLog = require('../models/ReminderLog');
const Notification = require('../models/Notification');
const smsService = require('./sms/smsService');

class ReminderScheduler {
  constructor() {
    this.cronTask = null;
    this.isRunning = false;
    this.timezone = process.env.TIMEZONE || 'Asia/Kolkata';
  }

  /**
   * Calculate difference in whole calendar days between two dates
   */
  getCalendarDaysRemaining(expiryDate, refDate = new Date()) {
    const target = new Date(expiryDate);
    target.setHours(0, 0, 0, 0);

    const current = new Date(refDate);
    current.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - current.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Map days remaining to configured reminder stage
   */
  mapDaysToStage(daysRemaining) {
    switch (daysRemaining) {
      case 30:
        return '30_days';
      case 7:
        return '7_days';
      case 1:
        return '1_day';
      case 0:
        return 'expiry_day';
      default:
        return null;
    }
  }

  /**
   * Check if user preferences allow reminder for this stage
   */
  isStageAllowedByUser(user, stage) {
    if (!user || user.status !== 'active') return false;
    const prefs = user.reminderPreferences || {};

    if (stage === '30_days') return prefs.daysBefore30 !== false;
    if (stage === '7_days') return prefs.daysBefore7 !== false;
    if (stage === '1_day') return prefs.daysBefore1 !== false;
    if (stage === 'expiry_day') return prefs.onExpiryDay !== false;

    return false;
  }

  /**
   * Core Expiry Check Engine
   * @param {Object} options
   * @param {Date} [options.referenceDate] - Custom date for testing or simulated date checks
   * @param {string} [options.triggeredBy] - 'system_cron' | 'admin_manual'
   */
  async runExpiryCheck(options = {}) {
    const refDate = options.referenceDate ? new Date(options.referenceDate) : new Date();
    const triggeredBy = options.triggeredBy || 'system_cron';

    const results = {
      triggeredBy,
      executedAt: new Date(),
      referenceDate: refDate.toISOString().slice(0, 10),
      totalActiveDocuments: 0,
      matchedExpiring: 0,
      dispatched: 0,
      skippedDuplicates: 0,
      skippedPreferences: 0,
      failed: 0,
      errors: []
    };

    try {
      console.log(`[Scheduler] Starting expiry check for ${results.referenceDate} (TZ: ${this.timezone})...`);

      // 1. Fetch all active documents populated with user info
      const documents = await Document.find({ status: 'active' }).populate('userId');
      results.totalActiveDocuments = documents.length;

      for (const doc of documents) {
        try {
          const user = doc.userId;
          if (!user || user.status !== 'active') {
            continue; // Skip documents whose owner is inactive or suspended
          }

          const daysRemaining = this.getCalendarDaysRemaining(doc.expiryDate, refDate);
          const stage = this.mapDaysToStage(daysRemaining);

          // If document does not fall on an exact notification stage, skip
          if (!stage) {
            continue;
          }

          results.matchedExpiring++;

          const dateString = doc.expiryDate.toISOString().slice(0, 10);
          const idempotencyKey = `${doc._id}_${stage}_${dateString}`;

          // Format human-friendly display date (DD/MM/YYYY)
          const formattedExpiry = new Date(doc.expiryDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          // In-App Notification (Always deliver to active user if not already delivered)
          const existingNotification = await Notification.findOne({
            userId: user._id,
            documentId: doc._id,
            stage
          });

          if (!existingNotification) {
            const urgency = stage === 'expiry_day' ? 'critical' : stage === '1_day' ? 'warning' : 'info';
            const stageLabel =
              stage === 'expiry_day'
                ? 'expires today!'
                : `expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;

            await Notification.create({
              userId: user._id,
              documentId: doc._id,
              title: `Document Expiry Alert: ${doc.title}`,
              message: `Your ${doc.documentType} "${doc.title}" ${stageLabel} (${formattedExpiry}). Please renew your document.`,
              type: urgency,
              stage
            });
          }

          // Check SMS Consent & Stage Preferences
          if (!user.smsConsent || !this.isStageAllowedByUser(user, stage)) {
            results.skippedPreferences++;
            continue;
          }

          // Prevent duplicate SMS dispatch across runs/restarts via unique idempotencyKey
          const existingLog = await ReminderLog.findOne({ idempotencyKey });
          if (existingLog) {
            results.skippedDuplicates++;
            continue;
          }

          // Construct outgoing message text
          const smsText = `Alert: Your ${doc.documentType} "${doc.title}" expires on ${formattedExpiry} (${daysRemaining} day(s) left). Please renew.`;

          // Pre-record queued reminder record to lock the idempotency key atomically
          let reminderLog;
          try {
            reminderLog = await ReminderLog.create({
              documentId: doc._id,
              userId: user._id,
              stage,
              targetExpiryDate: doc.expiryDate,
              idempotencyKey,
              recipientPhone: user.phone,
              messageContent: smsText,
              status: 'attempted',
              lastAttemptAt: new Date()
            });
          } catch (dupErr) {
            if (dupErr.code === 11000) {
              results.skippedDuplicates++;
              continue;
            }
            throw dupErr;
          }

          // Dispatch SMS through SMS service abstraction
          const smsResult = await smsService.sendReminder({
            phone: user.phone,
            customerName: user.name,
            documentTitle: doc.title,
            expiryDate: formattedExpiry,
            daysRemaining
          });

          // Update log with real result
          reminderLog.status = smsResult.status;
          reminderLog.provider = smsResult.provider;
          reminderLog.providerResponseId = smsResult.responseId;
          reminderLog.errorMessage = smsResult.error || null;
          await reminderLog.save();

          if (smsResult.success) {
            results.dispatched++;
          } else {
            results.failed++;
            results.errors.push(`Doc ${doc._id} (${user.phone}): ${smsResult.error}`);
          }
        } catch (itemError) {
          results.failed++;
          results.errors.push(`Doc ${doc._id}: ${itemError.message}`);
          console.error(`[Scheduler] Error processing document ${doc._id}:`, itemError.message);
        }
      }

      console.log(`[Scheduler] Expiry check completed. Dispatched: ${results.dispatched}, Skipped: ${results.skippedDuplicates + results.skippedPreferences}, Failed: ${results.failed}`);
      return results;
    } catch (fatalError) {
      console.error('[Scheduler] Fatal error during expiry check:', fatalError.message);
      results.errors.push(`Fatal: ${fatalError.message}`);
      return results;
    }
  }

  /**
   * Admin-authorized manual retry for a failed reminder
   */
  async retryReminder(logId) {
    const log = await ReminderLog.findById(logId).populate('documentId userId');
    if (!log) {
      throw new Error('Reminder log not found');
    }

    if (log.retryCount >= 3) {
      throw new Error('Maximum retry attempts (3) reached for this reminder');
    }

    const doc = log.documentId;
    const user = log.userId;

    if (!doc || !user) {
      throw new Error('Associated document or customer no longer exists');
    }

    const formattedExpiry = new Date(doc.expiryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const daysRemaining = this.getCalendarDaysRemaining(doc.expiryDate);

    log.retryCount += 1;
    log.lastAttemptAt = new Date();
    log.status = 'attempted';
    await log.save();

    const smsResult = await smsService.sendReminder({
      phone: user.phone,
      customerName: user.name,
      documentTitle: doc.title,
      expiryDate: formattedExpiry,
      daysRemaining
    });

    log.status = smsResult.status;
    log.provider = smsResult.provider;
    log.providerResponseId = smsResult.responseId;
    log.errorMessage = smsResult.error || null;
    await log.save();

    return {
      success: smsResult.success,
      status: smsResult.status,
      log
    };
  }

  /**
   * Start background cron scheduler in Asia/Kolkata timezone
   */
  startScheduler() {
    const scheduleExpr = process.env.CRON_SCHEDULE || '0 9 * * *'; // Daily at 9:00 AM IST

    if (!cron.validate(scheduleExpr)) {
      console.error(`[Scheduler] Invalid cron schedule expression: "${scheduleExpr}". Using default "0 9 * * *"`);
    }

    const validExpr = cron.validate(scheduleExpr) ? scheduleExpr : '0 9 * * *';

    this.cronTask = cron.schedule(
      validExpr,
      async () => {
        console.log(`[Scheduler] Cron triggered at ${new Date().toISOString()}`);
        await this.runExpiryCheck({ triggeredBy: 'system_cron' });
      },
      {
        scheduled: true,
        timezone: this.timezone
      }
    );

    this.isRunning = true;
    console.log(`[Scheduler] Persistent cron job initialized: "${validExpr}" (Timezone: ${this.timezone})`);
  }

  stopScheduler() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      this.isRunning = false;
      console.log('[Scheduler] Cron job stopped');
    }
  }
}

module.exports = new ReminderScheduler();
