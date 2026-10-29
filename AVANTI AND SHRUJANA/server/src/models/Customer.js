/**
 * Customer Model
 * -------------------------------------------------------------
 * File: src/models/Customer.js
 * ER Entity: Customer (Strong Entity)
 * ER Relationships:
 *   - R1 (Order): 1:N — One Customer places multiple Snack Orders
 *   - R2 (Book):  M:N — Customer books Shows (via Booking junction entity)
 *   - R3 (Buy):   1:N — Customer purchases multiple Tickets
 * 
 * Operations Provided:
 *   - Schema definition with strict Mongoose validation ($jsonSchema compatible)
 *   - Auto-generation of human-readable customerId (e.g. CUST-001)
 *   - Static ID generator utility
 */

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    // Human-readable primary identifier (e.g. CUST-001)
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      unique: true,
      trim: true,
    },
    // Unique email for communications and customer lookup
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    // Customer's given first name
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    // Customer's family last name
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    // Customer contact / mobile phone number
    contactNo: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    // Age validation between 1 and 120
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age cannot exceed 120'],
    },
    // Customer gender enum
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender (allowed: Male, Female, Other)',
      },
    },
  },
  {
    timestamps: true, // Auto-manages createdAt and updatedAt
  }
);

/**
 * Static method to generate the next human-readable Customer ID
 * Counts existing documents and increments to avoid collisions.
 */
customerSchema.statics.generateId = async function () {
  const count = await this.countDocuments();
  let nextNum = count + 1;
  while (await this.exists({ customerId: `CUST-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `CUST-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Pre-validation middleware:
 * Automatically assigns a human-readable ID (CUST-001, CUST-002, etc.)
 * before document validation if not already specified.
 */
customerSchema.pre('validate', async function (next) {
  if (this.isNew && !this.customerId) {
    try {
      this.customerId = await mongoose.model('Customer').generateId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
