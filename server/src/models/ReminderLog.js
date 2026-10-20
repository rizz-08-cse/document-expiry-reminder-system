const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    stage: {
      type: String,
      required: true,
      enum: ['30_days', '7_days', '1_day', 'expiry_day']
    },
    targetExpiryDate: {
      type: Date,
      required: true
    },
    // Unique compound idempotency key: <docId>_<stage>_<YYYY-MM-DD>
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    channel: {
      type: String,
      enum: ['sms', 'in_app'],
      default: 'sms'
    },
    recipientPhone: {
      type: String,
      required: true
    },
    messageContent: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['queued', 'attempted', 'provider_accepted', 'delivered', 'failed', 'simulated'],
      default: 'queued',
      index: true
    },
    provider: {
      type: String,
      enum: ['msg91', 'simulated'],
      default: 'simulated'
    },
    providerResponseId: {
      type: String
    },
    errorMessage: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reminderLogSchema.index({ status: 1, createdAt: -1 });
reminderLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
