/**
 * Coupon Routes
 * -------------------------------------------------------------
 * File: src/routes/coupons.js
 * ER Entity: Coupon (Promotional Discount Entity)
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/coupons       : List coupons (filter by active/expired status, paginate, sort)
 *   - POST   /api/coupons       : Create a new promotional coupon
 *   - GET    /api/coupons/:id   : Get a single coupon by _id or couponId
 *   - PUT    /api/coupons/:id   : Update coupon details (couponId cannot be changed)
 *   - DELETE /api/coupons/:id   : Delete a coupon
 */

import express from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable couponId
 */
const getCouponLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { couponId: id };
};

/**
 * GET /api/coupons
 * Description: List coupons with active/expired filtering and pagination
 * Query Params:
 *   - active: 'true' (unexpired) or 'false' (expired)
 *   - search: string (matches couponCode)
 *   - page: integer (default 1)
 *   - limit: integer (default 10)
 */
router.get('/', async (req, res, next) => {
  try {
    const { active, search, sort, page = 1, limit = 10 } = req.query;

    const filter = {};
    const now = new Date();

    if (active === 'true') {
      filter.expireDate = { $gte: now };
    } else if (active === 'false') {
      filter.expireDate = { $lt: now };
    }

    if (search) {
      filter.$or = [
        { couponCode: { $regex: search, $options: 'i' } },
        { couponId: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { expireDate: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      if (field) {
        sortOption = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, coupons] = await Promise.all([
      Coupon.countDocuments(filter),
      Coupon.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    res.json({
      success: true,
      data: coupons,
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
 * GET /api/coupons/:id
 * Description: Retrieve a single coupon by _id or couponId (e.g. CPN-001)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getCouponLookupQuery(req.params.id);
    const coupon = await Coupon.findOne(query);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/coupons
 * Description: Create a new discount coupon
 */
router.post('/', async (req, res, next) => {
  try {
    const { couponCode, discount, expireDate } = req.body;

    // Check duplicate code
    if (couponCode) {
      const existing = await Coupon.findOne({ couponCode: couponCode.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: `Coupon with code '${couponCode}' already exists.`,
        });
      }
    }

    const coupon = new Coupon({
      couponCode: couponCode ? couponCode.toUpperCase().trim() : undefined,
      discount,
      expireDate,
    });

    const savedCoupon = await coupon.save();

    res.status(201).json({
      success: true,
      data: savedCoupon,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/coupons/:id
 * Description: Update coupon details
 * Business Rule: couponId cannot be changed
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getCouponLookupQuery(req.params.id);

    // Prevent changing couponId
    if (req.body.couponId) {
      delete req.body.couponId;
    }

    if (req.body.couponCode) {
      req.body.couponCode = req.body.couponCode.toUpperCase().trim();
    }

    const updatedCoupon = await Coupon.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedCoupon,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/coupons/:id
 * Description: Delete a coupon document
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getCouponLookupQuery(req.params.id);
    const coupon = await Coupon.findOne(query);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID '${req.params.id}' not found.`,
      });
    }

    await Coupon.deleteOne({ _id: coupon._id });

    res.json({
      success: true,
      data: {
        message: `Coupon ${coupon.couponId} ('${coupon.couponCode}') was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
