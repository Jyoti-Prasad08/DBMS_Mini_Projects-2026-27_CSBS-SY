/**
 * Theater Model
 * -------------------------------------------------------------
 * File: src/models/Theater.js
 * ER Entity: Theater (Strong Entity)
 * ER Relationships:
 *   - R4 (Locate): M:N reverse side — Theater hosts multiple Shows (Theater.showIds -> Show)
 *
 * Schema Notes:
 *   - ER attribute 'Trans ID' is mapped to field 'transId'
 *     NOTE: transId and Ticket's transactionId refer to the SAME transaction reference
 *           (confirmed by user: Theatre's Trans ID = the ticket transaction for that venue)
 *   - ER attribute 'Tricket ID' (spelling corrected) is mapped to 'ticketId'
 *     NOTE: Theater.ticketId and Ticket.seatNo refer to the SAME seat
 *           (confirmed by user: Theater seat and Ticket seat are the same physical seat)
 *   - 'quantity' represents total seating capacity
 *   - 'theaterName' is a TECHNICAL ADDITION (not in ER diagram).
 *     The ER has no name attribute for Theater. Added for display purposes.
 *     User requested theaters be named: "Theatre 1", "Theatre 2", etc.
 *
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable theaterId (e.g. THR-001)
 *   - References to Show collection for R4 locate relationship
 */

import mongoose from 'mongoose';

const theaterSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. THR-001)
    theaterId: {
      type: String,
      required: [true, 'Theater ID is required'],
      unique: true,
      trim: true,
    },
    // TECHNICAL ADDITION: Display name for theater (not in ER diagram)
    // User specified: "Theatre 1", "Theatre 2", "Theatre 3" etc.
    theaterName: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true,
    },
    // Contact email for theater branch management
    email: {
      type: String,
      required: [true, 'Theater contact email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    // Seat number pattern / sample seat reference from ER diagram
    seatNo: {
      type: String,
      trim: true,
      default: '',
    },
    // Seating quantity / capacity
    quantity: {
      type: Number,
      required: [true, 'Quantity/capacity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    // Transaction ID reference (ER attribute 'Trans ID')
    transId: {
      type: String,
      trim: true,
      default: '',
    },
    // Ticket reference ID (ER attribute 'Tricket ID')
    ticketId: {
      type: String,
      trim: true,
      default: '',
    },
    // R4 (Locate reverse side): Shows hosted / scheduled at this theater
    showIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Show',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to generate the next human-readable Theater ID (THR-001, THR-002...)
 */
theaterSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ theaterId: `THR-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `THR-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable theaterId before saving if not provided.
 */
theaterSchema.pre('validate', async function (next) {
  if (this.isNew && !this.theaterId) {
    try {
      this.theaterId = await mongoose.model('Theater').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Theater = mongoose.model('Theater', theaterSchema);

export default Theater;
