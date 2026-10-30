const mongoose = require('mongoose');

const CLAIM_STATUSES = ['requested', 'approved', 'rejected', 'returned'];

const claimSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PotentialMatch',
      required: true,
      index: true,
    },
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationDetails: {
      type: String,
      required: [true, 'Private identifying details are required.'],
      trim: true,
      maxlength: [1000, 'Private identifying details must be 1,000 characters or fewer.'],
    },
    status: {
      type: String,
      enum: {
        values: CLAIM_STATUSES,
        message: 'Invalid claim status.',
      },
      default: 'requested',
      index: true,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Review note must be 500 characters or fewer.'],
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ foundItem: 1, status: 1 });
claimSchema.index({ claimant: 1, status: 1, createdAt: -1 });
claimSchema.index({ finder: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);
module.exports.CLAIM_STATUSES = CLAIM_STATUSES;
