const mongoose = require('mongoose');

const matchAttributeSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    detail: {
      type: String,
      default: '',
      maxlength: 300,
    },
  },
  { _id: false }
);

const potentialMatchSchema = new mongoose.Schema(
  {
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
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    attributes: {
      type: [matchAttributeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

potentialMatchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
potentialMatchSchema.index({ score: -1, createdAt: -1 });

module.exports = mongoose.model('PotentialMatch', potentialMatchSchema);
