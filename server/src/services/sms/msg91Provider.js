const { formatForMSG91, isSamplePhoneNumber } = require('../../utils/phoneValidator');

class MSG91Provider {
  constructor(config = {}) {
    this.authKey = config.authKey || process.env.MSG91_AUTH_KEY;
    this.templateId = config.templateId || process.env.MSG91_TEMPLATE_ID;
    this.senderId = config.senderId || process.env.MSG91_SENDER_ID;
  }

  isConfigured() {
    return Boolean(this.authKey && this.templateId);
  }

  /**
   * Send SMS via MSG91 Flow API
   * @param {Object} params
   * @param {string} params.phone - 10-digit Indian phone number
   * @param {string} params.documentTitle - Document title
   * @param {string} params.expiryDate - Formatted expiry date string
   * @param {string} params.daysRemaining - Days remaining text
   * @param {string} params.customerName - Customer name
   * @param {boolean} params.isExplicitTest - If true, permits verified test send
   */
  async send({ phone, documentTitle, expiryDate, daysRemaining, customerName, isExplicitTest = false }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'failed',
        provider: 'msg91',
        error: 'MSG91 is not configured. Missing MSG91_AUTH_KEY or MSG91_TEMPLATE_ID.'
      };
    }

    // Safety guard: Never send to dummy seed customer numbers unless explicit test
    if (!isExplicitTest && isSamplePhoneNumber(phone)) {
      return {
        success: false,
        status: 'failed',
        provider: 'msg91',
        error: `Safety Guard: Phone ${phone} is identified as a sample/test seed number. Real SMS aborted.`
      };
    }

    const internationalPhone = formatForMSG91(phone);
    if (!internationalPhone) {
      return {
        success: false,
        status: 'failed',
        provider: 'msg91',
        error: `Invalid phone format: ${phone}. Expected 10-digit Indian mobile number.`
      };
    }

    const payload = {
      template_id: this.templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: internationalPhone,
          name: customerName || 'Customer',
          doc_name: documentTitle,
          expiry_date: expiryDate,
          days_left: String(daysRemaining)
        }
      ]
    };

    if (this.senderId) {
      payload.sender = this.senderId;
    }

    try {
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.authKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.type === 'error') {
        return {
          success: false,
          status: 'failed',
          provider: 'msg91',
          error: data.message || `MSG91 HTTP Error: ${response.status}`,
          details: data
        };
      }

      // MSG91 accepts the flow request into queue
      return {
        success: true,
        status: 'provider_accepted',
        provider: 'msg91',
        responseId: data.message || data.request_id || 'accepted',
        rawResponse: data
      };
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        provider: 'msg91',
        error: `MSG91 Network/API Error: ${err.message}`
      };
    }
  }
}

module.exports = MSG91Provider;
