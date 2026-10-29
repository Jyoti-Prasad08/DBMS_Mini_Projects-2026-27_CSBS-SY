/**
 * Snack Routes
 * -------------------------------------------------------------
 * File: src/routes/snacks.js
 * ER Entity: Snack (Refreshment Orders)
 * ER Relationships:
 *   - R1 (Order): 1:N — Customer places Snack Orders (Snack.customerId -> Customer)
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/snacks       : List snack orders (filter by customerId, paginate, sort)
 *   - POST   /api/snacks       : Create snack order (validates that customerId exists)
 *   - GET    /api/snacks/:id   : Get single snack order by _id or orderId (populated with customer)
 *   - PUT    /api/snacks/:id   : Update snack order details (orderId cannot be changed)
 *   - DELETE /api/snacks/:id   : Delete snack order
 */

import express from 'express';
import mongoose from 'mongoose';
import Snack from '../models/Snack.js';
import Customer from '../models/Customer.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable orderId
 */
const getSnackLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { orderId: id };
};

/**
 * GET /api/snacks
 * Description: List snack orders with customer filtering and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { customerId, search, sort, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (customerId) {
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        filter.customerId = customerId;
      } else {
        const custDoc = await Customer.findOne({ customerId });
        if (custDoc) filter.customerId = custDoc._id;
        else filter.customerId = null;
      }
    }

    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      if (field) {
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, snacks] = await Promise.all([
      Snack.countDocuments(filter),
      Snack.find(filter)
        .populate('customerId', 'customerId firstName lastName email contactNo')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      data: snacks,
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
 * GET /api/snacks/:id
 * Description: Retrieve a single snack order populated with customer information
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getSnackLookupQuery(req.params.id);
    const snack = await Snack.findOne(query).populate(
      'customerId',
      'customerId firstName lastName email contactNo'
    );

    if (!snack) {
      return res.status(404).json({
        success: false,
        error: `Snack order with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: snack,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/snacks
 * Description: Create a new snack order
 * Business Rules:
 *   - Customer must exist (R1: Order)
 */
router.post('/', async (req, res, next) => {
  try {
    const { itemName, price, quantity, customerId } = req.body;

    // Validate customer existence
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID (customerId) is required to place a snack order.',
      });
    }

    const custQuery = mongoose.Types.ObjectId.isValid(customerId)
      ? { _id: customerId }
      : { customerId };
    const customer = await Customer.findOne(custQuery);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID '${customerId}' does not exist.`,
      });
    }

    const snack = new Snack({
      itemName,
      price,
      quantity: quantity || 1,
      customerId: customer._id,
    });

    const savedSnack = await snack.save();

    const populated = await Snack.findById(savedSnack._id).populate(
      'customerId',
      'customerId firstName lastName email'
    );

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/snacks/:id
 * Description: Update snack order details
 * Business Rule: orderId cannot be changed
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getSnackLookupQuery(req.params.id);

    // Prevent changing orderId
    if (req.body.orderId) {
      delete req.body.orderId;
    }

    // If customerId is updated, validate it
    if (req.body.customerId) {
      const custQuery = mongoose.Types.ObjectId.isValid(req.body.customerId)
        ? { _id: req.body.customerId }
        : { customerId: req.body.customerId };
      const customer = await Customer.findOne(custQuery);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: `Customer with ID '${req.body.customerId}' not found.`,
        });
      }
      req.body.customerId = customer._id;
    }

    const updatedSnack = await Snack.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('customerId', 'customerId firstName lastName email contactNo');

    if (!updatedSnack) {
      return res.status(404).json({
        success: false,
        error: `Snack order with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedSnack,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/snacks/:id
 * Description: Delete a snack order document
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getSnackLookupQuery(req.params.id);
    const snack = await Snack.findOne(query);

    if (!snack) {
      return res.status(404).json({
        success: false,
        error: `Snack order with ID '${req.params.id}' not found.`,
      });
    }

    await Snack.deleteOne({ _id: snack._id });

    res.json({
      success: true,
      data: {
        message: `Snack order ${snack.orderId} ('${snack.itemName}') was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
