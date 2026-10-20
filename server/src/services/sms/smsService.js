const MSG91Provider = require('./msg91Provider');
const SimulatedSMSProvider = require('./simulatedProvider');
const SystemSetting = require('../../models/SystemSetting');

class SMSService {
  constructor() {
    this.msg91 = new MSG91Provider();
    this.simulated = new SimulatedSMSProvider();
  }

  /**
   * Determine whether simulation mode is forced or required
   */
  async isSimulationActive() {
    // Check environment variable
    if (process.env.SMS_SIMULATION_MODE === 'true') {
      return true;
    }

    // Check dynamic system setting if stored in DB
    try {
      const setting = await SystemSetting.findOne({ key: 'sms_simulation_mode' });
      if (setting && setting.value !== undefined) {
        return Boolean(setting.value);
      }
    } catch (e) {
      // In-memory or pre-connection check fallback
    }

    // If MSG91 is not configured, fall back to simulation mode safely
    return !this.msg91.isConfigured();
  }

  /**
   * Get active provider status summary
   */
  async getStatus() {
    const isSimulated = await this.isSimulationActive();
    const msg91Ready = this.msg91.isConfigured();

    return {
      activeProvider: isSimulated ? 'simulated' : 'msg91',
      isSimulationMode: isSimulated,
      msg91Configured: msg91Ready,
      senderId: process.env.MSG91_SENDER_ID || 'Not configured',
      templateIdConfigured: Boolean(process.env.MSG91_TEMPLATE_ID)
    };
  }

  /**
   * Send reminder SMS using active provider
   */
  async sendReminder(params) {
    const isSimulated = await this.isSimulationActive();
    if (isSimulated) {
      return this.simulated.send(params);
    }
    return this.msg91.send(params);
  }

  /**
   * Authorized test SMS dispatch
   */
  async sendTestSMS({ phone, recipientName, isExplicitConfirmation = false }) {
    if (!isExplicitConfirmation) {
      throw new Error('Explicit confirmation is required to dispatch a test SMS.');
    }

    const testParams = {
      phone,
      customerName: recipientName || 'Admin Tester',
      documentTitle: 'Test Document Verification',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
      daysRemaining: '30',
      isExplicitTest: true
    };

    const isSimulated = await this.isSimulationActive();
    if (isSimulated) {
      const result = await this.simulated.send(testParams);
      return {
        ...result,
        testMode: true,
        summary: `Simulated test SMS successfully recorded for ${phone}.`
      };
    }

    const result = await this.msg91.send(testParams);
    return {
      ...result,
      testMode: true,
      summary: result.success
        ? `MSG91 accepted test SMS to ${phone}. Request ID: ${result.responseId}`
        : `MSG91 failed to send test SMS: ${result.error}`
    };
  }
}

module.exports = new SMSService();
