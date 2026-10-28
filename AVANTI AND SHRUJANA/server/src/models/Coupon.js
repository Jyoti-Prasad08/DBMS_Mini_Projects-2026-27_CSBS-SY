/**
 * Coupon Model
 * -------------------------------------------------------------
 * File: src/models/Coupon.js
 * ER Entity: Coupon (Promotional Discount Entity)
 * ER Relationships:
 *   - R5 (Apply): M:N — Coupon applied to Tickets (Ticket.couponIds -> Coupon)
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation
 *   - Auto-generation of human-readable couponId (e.g. CPN-001)
 *   - Validity check helpers for expiration date and percentage bounds
 */

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. CPN-001)
    couponId: {
      type: String,
      required: [true, 'Coupon ID is required'],
      unique: true,
      trim: true,
    },
    // User-entered discount promo code (e.g. SAVE20, SUMMER50)
    couponCode: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Percentage discount value (0 to 100)
    discount: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [0, 'Discount cannot be less than 0%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    // Expiration date for validity verification
    expireDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to generate the next human-readable Coupon ID (CPN-001, CPN-002...)
 */
couponSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ couponId: `CPN-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `CPN-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Auto-generates human-readable couponId before saving if not provided.
 */
couponSchema.pre('validate', async function (next) {
  if (this.isNew && !this.couponId) {
    try {
      this.couponId = await mongoose.model('Coupon').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
