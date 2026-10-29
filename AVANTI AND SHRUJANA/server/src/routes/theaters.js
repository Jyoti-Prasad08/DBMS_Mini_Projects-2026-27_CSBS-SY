/**
 * Theater Routes
 * -------------------------------------------------------------
 * File: src/routes/theaters.js
 * ER Entity: Theater (Auditorium / Screening Venue Entity)
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/theaters       : List theaters (search by email, paginate, sort)
 *   - POST   /api/theaters       : Create a new theater
 *   - GET    /api/theaters/:id   : Get a single theater by _id or theaterId (populated with showIds)
 *   - PUT    /api/theaters/:id   : Update theater details (theaterId cannot be changed)
 *   - DELETE /api/theaters/:id   : Delete theater document
 */

import express from 'express';
import mongoose from 'mongoose';
import Theater from '../models/Theater.js';
import Show from '../models/Show.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable theaterId
 */
const getTheaterLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { theaterId: id };
};

/**
 * GET /api/theaters
 * Description: List theaters with email search and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sort } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { theaterId: { $regex: search, $options: 'i' } },
        { seatNo: { $regex: search, $options: 'i' } },
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

    const [total, theaters] = await Promise.all([
      Theater.countDocuments(filter),
      Theater.find(filter)
        .populate('showIds', 'showId name language genre type duration')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      data: theaters,
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
 * GET /api/theaters/:id
 * Description: Retrieve a single theater populated with scheduled shows
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getTheaterLookupQuery(req.params.id);
    const theater = await Theater.findOne(query).populate(
      'showIds',
      'showId name language genre type duration'
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        error: `Theater with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: theater,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/theaters
 * Description: Create a new theater venue
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, seatNo, quantity, transId, ticketId, showIds } = req.body;

    // Check duplicate email
    if (email) {
      const existing = await Theater.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: `A theater with email '${email}' already exists.`,
        });
      }
    }

    const theater = new Theater({
      email,
      seatNo: seatNo || '',
      quantity,
      transId: transId || '',
      ticketId: ticketId || '',
      showIds: showIds || [],
    });

    const savedTheater = await theater.save();

    res.status(201).json({
      success: true,
      data: savedTheater,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/theaters/:id
 * Description: Update an existing theater
 * Business Rule: theaterId cannot be changed
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getTheaterLookupQuery(req.params.id);

    // Prevent changing theaterId
    if (req.body.theaterId) {
      delete req.body.theaterId;
    }

    const updatedTheater = await Theater.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('showIds', 'showId name language genre type duration');

    if (!updatedTheater) {
      return res.status(404).json({
        success: false,
        error: `Theater with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedTheater,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/theaters/:id
 * Description: Delete a theater document
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getTheaterLookupQuery(req.params.id);
    const theater = await Theater.findOne(query);

    if (!theater) {
      return res.status(404).json({
        success: false,
        error: `Theater with ID '${req.params.id}' not found.`,
      });
    }

    // Clean up reference in Show documents if any
    await Show.updateMany({ theaterIds: theater._id }, { $pull: { theaterIds: theater._id } });

    await Theater.deleteOne({ _id: theater._id });

    res.json({
      success: true,
      data: {
        message: `Theater ${theater.theaterId} (${theater.email}) was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
