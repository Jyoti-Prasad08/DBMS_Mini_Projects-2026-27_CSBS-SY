/**
 * Customer Routes
 * -------------------------------------------------------------
 * File: src/routes/customers.js
 * ER Entity: Customer
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/customers       : List customers (supports search, sort, pagination)
 *   - POST   /api/customers       : Create a new customer (validates email & fields)
 *   - GET    /api/customers/:id   : Get a single customer by _id or customerId
 *   - PUT    /api/customers/:id   : Update customer details (customerId cannot be changed)
 *   - DELETE /api/customers/:id   : Delete customer (enforces ER integrity: blocks if
 *                                   active tickets, snacks, or bookings exist)
 */

import express from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Ticket from '../models/Ticket.js';
import Snack from '../models/Snack.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable customerId
 */
const getCustomerLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { customerId: id };
};

/**
 * GET /api/customers
 * Description: Retrieves list of customers with optional search, sorting, and pagination
 * Query Params:
 *   - search: string (matches against firstName, lastName, or email)
 *   - sort: field:asc or field:desc (e.g. age:asc, createdAt:desc)
 *   - page: integer (default 1)
 *   - limit: integer (default 10)
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, sort, page = 1, limit = 10 } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    let sortOption = { createdAt: -1 }; // default newest first
    if (sort) {
      const [field, order] = sort.split(':');
      if (field) {
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Fetch total and paginated records
    const [total, customers] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customers/:id
 * Description: Retrieve a single customer by _id or human-readable customerId (e.g. CUST-001)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getCustomerLookupQuery(req.params.id);
    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers
 * Description: Create a new customer document
 * Validation: Required fields, valid email, duplicate email check
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, firstName, lastName, contactNo, age, gender } = req.body;

    // Check duplicate email explicitly for immediate clear feedback
    if (email) {
      const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: `A customer with email '${email}' already exists.`,
        });
      }
    }

    // Create new customer instance (customerId will auto-generate via pre-validate hook)
    const customer = new Customer({
      email,
      firstName,
      lastName,
      contactNo,
      age,
      gender,
    });

    const savedCustomer = await customer.save();

    res.status(201).json({
      success: true,
      data: savedCustomer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/customers/:id
 * Description: Update an existing customer
 * Business Rule: customerId is immutable and cannot be updated
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getCustomerLookupQuery(req.params.id);

    // Prevent changing customerId
    if (req.body.customerId) {
      delete req.body.customerId;
    }

    // Check duplicate email if email is being updated
    if (req.body.email) {
      const existing = await Customer.findOne({
        email: req.body.email.toLowerCase().trim(),
        ...(!query._id ? {} : { _id: { $ne: query._id } }),
      });
      if (existing && existing.customerId !== req.params.id && String(existing._id) !== req.params.id) {
        return res.status(400).json({
          success: false,
          error: `Email '${req.body.email}' is already in use by another customer.`,
        });
      }
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/customers/:id
 * Description: Delete a customer document
 * ER Integrity Rule:
 *   - R3 (Buy): Cannot delete if Customer has purchased Tickets
 *   - R1 (Order): Cannot delete if Customer has Snack Orders
 *   - R2 (Book): Cannot delete if Customer has active Bookings
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getCustomerLookupQuery(req.params.id);
    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID '${req.params.id}' not found.`,
      });
    }

    // Reference Integrity Checks
    const [ticketCount, snackCount, bookingCount] = await Promise.all([
      Ticket.countDocuments({ customerId: customer._id }),
      Snack.countDocuments({ customerId: customer._id }),
      Booking.countDocuments({ customerId: customer._id }),
    ]);

    if (ticketCount > 0 || snackCount > 0 || bookingCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer: associated dependent records exist in the database.',
        details: {
          ticketsCount: ticketCount,
          snackOrdersCount: snackCount,
          bookingsCount: bookingCount,
        },
      });
    }

    await Customer.deleteOne({ _id: customer._id });

    res.json({
      success: true,
      data: {
        message: `Customer ${customer.customerId} (${customer.firstName} ${customer.lastName}) was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
