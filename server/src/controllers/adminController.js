const User = require('../models/User');
const Document = require('../models/Document');
const ReminderLog = require('../models/ReminderLog');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');
const smsService = require('../services/sms/smsService');
const reminderScheduler = require('../services/reminderScheduler');

// Admin Dashboard Summary Metrics
const getAdminDashboardMetrics = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', status: 'active' });
    const suspendedCustomers = await User.countDocuments({ role: 'customer', status: 'suspended' });

    const totalDocuments = await Document.countDocuments();
    const activeDocuments = await Document.countDocuments({ status: 'active' });

    // Expiry breakdown
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiredDocuments = await Document.countDocuments({
      status: 'active',
      expiryDate: { $lt: now }
    });

    const upcomingExpiries = await Document.countDocuments({
      status: 'active',
      expiryDate: { $gte: now, $lte: in30Days }
    });

    // Reminder logs statistics
    const remindersAttempted = await ReminderLog.countDocuments();
    const successfulSends = await ReminderLog.countDocuments({
      status: { $in: ['simulated', 'provider_accepted', 'delivered'] }
    });
    const failedSends = await ReminderLog.countDocuments({ status: 'failed' });

    // Active SMS provider readiness
    const smsProviderStatus = await smsService.getStatus();

    // Recent activity
    const recentReminderLogs = await ReminderLog.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('documentId', 'title documentType')
      .populate('userId', 'name phone');

    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      metrics: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          suspended: suspendedCustomers
        },
        documents: {
          total: totalDocuments,
          active: activeDocuments,
          expired: expiredDocuments,
          upcomingExpiries
        },
        reminders: {
          attempted: remindersAttempted,
          successful: successfulSends,
          failed: failedSends
        },
        smsProvider: smsProviderStatus
      },
      recentReminderLogs,
      recentAuditLogs
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminDashboardMetrics error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard metrics.'
    });
  }
};

// Paginated & Filtered Customer List
const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = { role: 'customer' };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Attach document counts to each customer
    const customerIds = customers.map((c) => c._id);
    const docCounts = await Document.aggregate([
      { $match: { userId: { $in: customerIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    docCounts.forEach((d) => {
      countMap[d._id.toString()] = d.count;
    });

    const enriched = customers.map((c) => ({
      ...c.toJSON(),
      documentCount: countMap[c._id.toString()] || 0
    }));

    return res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      customers: enriched
    });
  } catch (error) {
    console.error('[Admin Controller] getCustomers error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers.'
    });
  }
};

// Customer Detail
const getCustomerDetails = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const documents = await Document.find({ userId: customer._id }).sort({ expiryDate: 1 });
    const now = new Date();
    const enrichedDocs = documents.map((doc) => {
      const meta = doc.getStatusMeta(now);
      return {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      };
    });

    return res.json({
      success: true,
      customer,
      documents: enrichedDocs
    });
  } catch (error) {
    console.error('[Admin Controller] getCustomerDetails error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer details.'
    });
  }
};

// Suspend or Reactivate Customer Account
const updateCustomerStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "suspended".'
      });
    }

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const previousStatus = customer.status;
    customer.status = status;
    await customer.save();

    // Log administrative action
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.phone,
      action: status === 'suspended' ? 'SUSPEND_CUSTOMER' : 'REACTIVATE_CUSTOMER',
      targetUserId: customer._id,
      details: {
        customerName: customer.name,
        customerPhone: customer.phone,
        previousStatus,
        newStatus: status,
        reason: reason || 'Administrative decision'
      },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Customer account successfully ${status === 'suspended' ? 'suspended' : 'reactivated'}.`,
      customer
    });
  } catch (error) {
    console.error('[Admin Controller] updateCustomerStatus error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update customer status.'
    });
  }
};

// Paginated & Filtered All Documents View
const getAllDocuments = async (req, res) => {
  try {
    const { search, type, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (type && type !== 'all') query.documentType = type;
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { documentNumber: regex }, { customTypeName: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('userId', 'name phone email')
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(limitNum);

    const now = new Date();
    const enriched = documents.map((doc) => {
      const meta = doc.getStatusMeta(now);
      return {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      };
    });

    return res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      documents: enriched
    });
  } catch (error) {
    console.error('[Admin Controller] getAllDocuments error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// Inspect Reminder Logs
const getReminderLogs = async (req, res) => {
  try {
    const { status, stage, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (stage && stage !== 'all') query.stage = stage;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await ReminderLog.countDocuments(query);
    const logs = await ReminderLog.find(query)
      .populate('documentId', 'title documentType expiryDate')
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs
    });
  } catch (error) {
    console.error('[Admin Controller] getReminderLogs error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reminder logs.'
    });
  }
};

// Manual Retry for a Failed Reminder
const retryFailedReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await reminderScheduler.retryReminder(id);

    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.phone,
      action: 'RETRY_REMINDER',
      details: {
        reminderLogId: id,
        resultStatus: result.status,
        success: result.success
      },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: result.success ? 'Reminder retry completed successfully.' : 'Retry attempted but provider reported failure.',
      result
    });
  } catch (error) {
    console.error('[Admin Controller] retryFailedReminder error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retry reminder.'
    });
  }
};

// Trigger Manual Expiry Check
const triggerManualExpiryCheck = async (req, res) => {
  try {
    const results = await reminderScheduler.runExpiryCheck({
      triggeredBy: `admin_manual (${req.user.name})`
    });

    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.phone,
      action: 'MANUAL_EXPIRY_CHECK_TRIGGERED',
      details: results,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Manual expiry check executed successfully.',
      results
    });
  } catch (error) {
    console.error('[Admin Controller] triggerManualExpiryCheck error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute manual expiry check.'
    });
  }
};

// Get System Settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const smsStatus = await smsService.getStatus();

    return res.json({
      success: true,
      settings,
      smsStatus,
      configuredCronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
      configuredTimezone: process.env.TIMEZONE || 'Asia/Kolkata'
    });
  } catch (error) {
    console.error('[Admin Controller] getSystemSettings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system settings.'
    });
  }
};

// Update System Settings
const updateSystemSettings = async (req, res) => {
  try {
    const { smsSimulationMode, reminderStages } = req.body;

    if (smsSimulationMode !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'sms_simulation_mode' },
        {
          key: 'sms_simulation_mode',
          value: Boolean(smsSimulationMode),
          description: 'Enable or disable simulation/demo mode for SMS dispatch',
          updatedBy: req.user._id
        },
        { upsert: true, new: true }
      );
    }

    if (reminderStages !== undefined && Array.isArray(reminderStages)) {
      await SystemSetting.findOneAndUpdate(
        { key: 'reminder_stages' },
        {
          key: 'reminder_stages',
          value: reminderStages,
          description: 'Configured days before expiry to dispatch automatic reminders',
          updatedBy: req.user._id
        },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.phone,
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: { smsSimulationMode, reminderStages },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'System settings updated successfully.'
    });
  } catch (error) {
    console.error('[Admin Controller] updateSystemSettings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update system settings.'
    });
  }
};

// Send Authorized Test SMS
const sendTestSMS = async (req, res) => {
  try {
    const { phone, recipientName, isExplicitConfirmation } = req.body;

    if (!isExplicitConfirmation) {
      return res.status(400).json({
        success: false,
        message: 'Explicit recipient confirmation is required before dispatching a test SMS.'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Target mobile number is required.'
      });
    }

    const result = await smsService.sendTestSMS({
      phone,
      recipientName: recipientName || req.user.name,
      isExplicitConfirmation: true
    });

    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.phone,
      action: 'SEND_TEST_SMS',
      details: {
        recipientPhone: phone,
        status: result.status,
        provider: result.provider,
        summary: result.summary
      },
      ipAddress: req.ip
    });

    return res.json({
      success: result.success,
      message: result.summary,
      details: result
    });
  } catch (error) {
    console.error('[Admin Controller] sendTestSMS error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch test SMS.'
    });
  }
};

module.exports = {
  getAdminDashboardMetrics,
  getCustomers,
  getCustomerDetails,
  updateCustomerStatus,
  getAllDocuments,
  getReminderLogs,
  retryFailedReminder,
  triggerManualExpiryCheck,
  getSystemSettings,
  updateSystemSettings,
  sendTestSMS
};
