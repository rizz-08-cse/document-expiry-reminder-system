const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: ['Driving Licence', 'Passport', 'Vehicle Insurance', 'RC', 'Certificate', 'Custom'],
      default: 'Driving Licence'
    },
    customTypeName: {
      type: String,
      trim: true,
      maxlength: [50, 'Custom type name cannot exceed 50 characters']
    },
    documentNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Document number cannot exceed 50 characters']
    },
    issueDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['active', 'renewed', 'archived'],
      default: 'active',
      index: true
    },
    renewalHistory: [
      {
        previousExpiryDate: { type: Date, required: true },
        renewedAt: { type: Date, default: Date.now },
        notes: { type: String, trim: true }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Calculate days remaining and state relative to given date (defaults to now)
documentSchema.methods.getStatusMeta = function (refDate = new Date()) {
  if (this.status === 'renewed') {
    return {
      daysRemaining: 0,
      state: 'Renewed',
      badgeClass: 'badge-renewed'
    };
  }

  // Normalize dates to midnight UTC for clean calendar day difference
  const target = new Date(this.expiryDate);
  target.setHours(0, 0, 0, 0);

  const current = new Date(refDate);
  current.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - current.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let state = 'Valid';
  let badgeClass = 'badge-valid';

  if (daysRemaining < 0) {
    state = 'Expired';
    badgeClass = 'badge-expired';
  } else if (daysRemaining <= 30) {
    state = 'Expiring Soon';
    badgeClass = 'badge-expiring';
  }

  return {
    daysRemaining,
    state,
    badgeClass
  };
};

// Virtuals for default JSON response
documentSchema.virtual('daysRemaining').get(function () {
  return this.getStatusMeta().daysRemaining;
});

documentSchema.virtual('state').get(function () {
  return this.getStatusMeta().state;
});

// Indexes for common queries
documentSchema.index({ userId: 1, expiryDate: 1 });
documentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);
