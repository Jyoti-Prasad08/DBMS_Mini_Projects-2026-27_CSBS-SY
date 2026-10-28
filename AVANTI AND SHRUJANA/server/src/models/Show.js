/**
 * Show Model
 * -------------------------------------------------------------
 * File: src/models/Show.js
 * ER Entity: Show (Strong Entity)
 * ER Relationships:
 *   - R2 (Book):   M:N — Show booked by Customers (via Booking junction entity)
 *   - R4 (Locate): M:N — Show located at many Theaters (Show.theaterIds -> Theater)
 * 
 * Schema Notes:
 *   - ER diagram attribute 'genra' is stored with standard spelling 'genre'.
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable showId (e.g. SHW-001)
 *   - References to Theater collection for R4 locate relationship
 */

import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. SHW-001)
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      unique: true,
      trim: true,
    },
    // Title or name of the show/movie/concert
    name: {
      type: String,
      required: [true, 'Show name is required'],
      trim: true,
    },
    // Spoken/presented language (e.g. English, Hindi, Spanish)
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    // Genre of the show (ER diagram label: 'genra')
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    // Runtime duration in minutes
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    // Entertainment category enum
    type: {
      type: String,
      required: [true, 'Show type is required'],
      enum: {
        values: ['movies', 'live Show', 'concert'],
        message: '{VALUE} is not a valid show type (allowed: movies, live Show, concert)',
      },
    },
    // R4 (Locate): Reference to Theater documents where this show is screened
    theaterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to generate the next human-readable Show ID (SHW-001, SHW-002...)
 */
showSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ showId: `SHW-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `SHW-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable showId before saving if not provided.
 */
showSchema.pre('validate', async function (next) {
  if (this.isNew && !this.showId) {
    try {
      this.showId = await mongoose.model('Show').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Show = mongoose.model('Show', showSchema);

export default Show;
