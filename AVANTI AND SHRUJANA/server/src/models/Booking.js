/**
 * Booking Model
 * -------------------------------------------------------------
 * File: src/models/Booking.js
 * ER Entity: Booking (Associative Entity / Junction Table)
 * ER Relationships:
 *   - R2 (Book): M:N — Connects Customer and Show to record seat reservations
 * 
 * Integrity Constraints:
 *   - Compound unique index on { customerId: 1, showId: 1 } to prevent duplicate bookings
 *     for the same customer and show combination.
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable bookingId (e.g. BKG-001)
 *   - Compound indexing for business constraint enforcement
 */

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. BKG-001)
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
    },
    // R2 (Book): Customer who made the booking
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    // R2 (Book): Show that is booked
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index:
 * Ensures a customer cannot double-book the same show.
 */
bookingSchema.index({ customerId: 1, showId: 1 }, { unique: true });

/**
 * Static method to generate the next human-readable Booking ID (BKG-001, BKG-002...)
 */
bookingSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ bookingId: `BKG-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `BKG-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable bookingId before saving if not provided.
 */
bookingSchema.pre('validate', async function (next) {
  if (this.isNew && !this.bookingId) {
    try {
      this.bookingId = await mongoose.model('Booking').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
