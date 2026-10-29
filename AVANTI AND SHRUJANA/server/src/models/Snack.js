/**
 * Snack Model
 * -------------------------------------------------------------
 * File: src/models/Snack.js
 * ER Entity: Snack (Concessions & Refreshments Entity)
 * ER Relationships:
 *   - R1 (Order): 1:N — Customer places Snack Orders (Snack.customerId -> Customer)
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable orderId (e.g. ORD-001)
 *   - References to Customer collection for R1 Order relationship
 */

import mongoose from 'mongoose';

const snackSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. ORD-001)
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      trim: true,
    },
    // Snack product name (e.g. Caramel Popcorn, Nachos, Fountain Coke)
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    // Price per unit
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // Quantity of snack items ordered
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    // R1 (Order): Reference to the Customer who placed the snack order
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to generate the next human-readable Snack Order ID (ORD-001, ORD-002...)
 */
snackSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ orderId: `ORD-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `ORD-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable orderId before saving if not provided.
 */
snackSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderId) {
    try {
      this.orderId = await mongoose.model('Snack').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Snack = mongoose.model('Snack', snackSchema);

export default Snack;
