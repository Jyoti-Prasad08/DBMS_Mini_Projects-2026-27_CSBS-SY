/**
 * Ticket Model
 * -------------------------------------------------------------
 * File: src/models/Ticket.js
 * ER Entity: Ticket (Entity representing admission pass)
 * ER Relationships:
 *   - R3 (Buy):   1:N — Customer purchases Ticket (Ticket.customerId -> Customer)
 *   - R5 (Apply): M:N — Coupon applied to Ticket (Ticket.couponIds -> Coupon)
 *   - Associated Show: Ticket linked to Show (Ticket.showId -> Show)
 * 
 * Derived Attribute:
 *   - 'amount' is DERIVED as (unitPrice * quantity) via Mongoose pre('save')
 *     and pre('findOneAndUpdate') middleware.
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable ticketId (e.g. TKT-001)
 *   - Automated computation of derived 'amount'
 */

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. TKT-001)
    ticketId: {
      type: String,
      required: [true, 'Ticket ID is required'],
      unique: true,
      trim: true,
    },
    // Payment / transaction identifier (ER attribute)
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
    },
    // Seat identifier or allocation (e.g. "A12", "BALCONY-15")
    seatNo: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
    },
    // Number of seats/tickets purchased in this order
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    // Unit price per seat (used to calculate derived amount)
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    // Derived attribute: unitPrice * quantity (auto-computed by middleware)
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    // R3 (Buy): Reference to the purchasing Customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID reference is required'],
    },
    // Show reference: the movie/show for this ticket
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show ID reference is required'],
    },
    // R5 (Apply): Coupons applied to this ticket for discounts
    couponIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to generate the next human-readable Ticket ID (TKT-001, TKT-002...)
 */
ticketSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ ticketId: `TKT-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `TKT-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable ticketId before saving if not provided.
 */
ticketSchema.pre('validate', async function (next) {
  if (this.isNew && !this.ticketId) {
    try {
      this.ticketId = await mongoose.model('Ticket').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

/**
 * Pre-save middleware:
 * DERIVED ATTRIBUTE: Automatically computes total amount = unitPrice * quantity
 */
ticketSchema.pre('save', function (next) {
  if (this.unitPrice !== undefined && this.quantity !== undefined) {
    this.amount = Number((this.unitPrice * this.quantity).toFixed(2));
  }
  next();
});

/**
 * Pre-findOneAndUpdate middleware:
 * Ensures derived 'amount' stays consistent if unitPrice or quantity is updated.
 */
ticketSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();

    // Check $set operator or top-level fields
    const setObj = update.$set || update;
    const hasPrice = setObj.unitPrice !== undefined;
    const hasQty = setObj.quantity !== undefined;

    if (hasPrice && hasQty) {
      const computed = Number((setObj.unitPrice * setObj.quantity).toFixed(2));
      if (update.$set) {
        update.$set.amount = computed;
      } else {
        update.amount = computed;
      }
    } else if (hasPrice || hasQty) {
      // Fetch existing document to retrieve the unchanged field
      const currentDoc = await this.model.findOne(this.getQuery());
      if (currentDoc) {
        const price = hasPrice ? setObj.unitPrice : currentDoc.unitPrice;
        const qty = hasQty ? setObj.quantity : currentDoc.quantity;
        const computed = Number((price * qty).toFixed(2));
        if (update.$set) {
          update.$set.amount = computed;
        } else {
          update.amount = computed;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
