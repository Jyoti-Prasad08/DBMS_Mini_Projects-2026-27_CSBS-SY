const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report owner is required.'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required.'],
      enum: {
        values: ['lost', 'found'],
        message: 'Type must be either lost or found.',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [120, 'Title must be 120 characters or fewer.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      trim: true,
      maxlength: [60, 'Category must be 60 characters or fewer.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      maxlength: [2000, 'Description must be 2000 characters or fewer.'],
    },
    color: {
      type: String,
      required: [true, 'Color is required.'],
      trim: true,
      maxlength: [60, 'Color must be 60 characters or fewer.'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [80, 'Brand must be 80 characters or fewer.'],
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location is required.'],
      trim: true,
      maxlength: [160, 'Location must be 160 characters or fewer.'],
    },
    dateTime: {
      type: Date,
      required: [true, 'Date and time is required.'],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [40, 'Each tag must be 40 characters or fewer.'],
        },
      ],
      default: [],
    },
    imagePath: {
      type: String,
      trim: true,
      maxlength: [500, 'Image path must be 500 characters or fewer.'],
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Image URL must be 500 characters or fewer.'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'claimed', 'returned', 'resolved'],
        message: 'Status must be open, claimed, returned, or resolved.',
      },
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ type: 1, createdAt: -1 });
itemSchema.index({ category: 1, createdAt: -1 });
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ owner: 1, createdAt: -1 });
itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ location: 1 });
itemSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
});

module.exports = mongoose.model('Item', itemSchema);
