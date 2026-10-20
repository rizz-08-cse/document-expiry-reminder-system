/**
 * Safe Demo / Simulated SMS Provider
 * Used when MSG91 credentials are not configured or when simulation mode is explicitly enabled.
 * Produces clear simulation records and never misleads as a real delivery.
 */

class SimulatedSMSProvider {
  constructor() {
    this.name = 'simulated';
  }

  isConfigured() {
    return true;
  }

  async send({ phone, documentTitle, expiryDate, daysRemaining, customerName }) {
    const timestamp = new Date().toISOString();
    const simulatedId = `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const message = `[SIMULATED SMS - Demo Mode] Dear ${customerName || 'Customer'}, your document "${documentTitle}" expires on ${expiryDate} (${daysRemaining} days remaining). Please renew in time.`;

    console.log(`[SMS-Simulation] [${timestamp}] Simulated SMS dispatched to ${phone}: "${message}"`);

    return {
      success: true,
      status: 'simulated',
      provider: 'simulated',
      responseId: simulatedId,
      message,
      note: 'Simulated dispatch in demo mode. No carrier charge or real cellular SMS transmitted.'
    };
  }
}

module.exports = SimulatedSMSProvider;
