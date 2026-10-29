/**
 * Show Routes
 * -------------------------------------------------------------
 * File: src/routes/shows.js
 * ER Entity: Show (Entertainment Event Entity)
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/shows       : List shows (filter by type, language; search by name; sort; paginate)
 *   - POST   /api/shows       : Create a new show
 *   - GET    /api/shows/:id   : Get a single show by _id or showId (populated with theaterIds)
 *   - PUT    /api/shows/:id   : Update show details (showId cannot be changed)
 *   - DELETE /api/shows/:id   : Delete show (enforces ER integrity: blocks if
 *                               active bookings or tickets exist)
 */

import express from 'express';
import mongoose from 'mongoose';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable showId
 */
const getShowLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { showId: id };
};

/**
 * GET /api/shows
 * Description: List shows with filters, search, sorting, and pagination
 * Query Params:
 *   - type: string (e.g. 'movies', 'live Show', 'concert')
 *   - language: string (e.g. 'English', 'Hindi')
 *   - search: string (matches show name or genre)
 *   - sort: field:asc or field:desc (e.g. duration:asc, createdAt:desc)
 *   - page: integer (default 1)
 *   - limit: integer (default 10)
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, language, search, sort, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) {
      filter.type = type;
    }
    if (language) {
      filter.language = { $regex: `^${language}$`, $options: 'i' };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } },
        { showId: { $regex: search, $options: 'i' } },
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

    const [total, shows] = await Promise.all([
      Show.countDocuments(filter),
      Show.find(filter)
        .populate('theaterIds', 'theaterId email seatNo quantity')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      data: shows,
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
 * GET /api/shows/:id
 * Description: Retrieve a single show populated with screening theaters
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getShowLookupQuery(req.params.id);
    const show = await Show.findOne(query).populate('theaterIds', 'theaterId email seatNo quantity');

    if (!show) {
      return res.status(404).json({
        success: false,
        error: `Show with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: show,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shows
 * Description: Create a new show document
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, language, genre, duration, type, theaterIds } = req.body;

    const show = new Show({
      name,
      language,
      genre,
      duration,
      type,
      theaterIds: theaterIds || [],
    });

    const savedShow = await show.save();

    res.status(201).json({
      success: true,
      data: savedShow,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/shows/:id
 * Description: Update an existing show document
 * Business Rule: showId is immutable
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getShowLookupQuery(req.params.id);

    // Prevent changing showId
    if (req.body.showId) {
      delete req.body.showId;
    }

    const updatedShow = await Show.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('theaterIds', 'theaterId email seatNo quantity');

    if (!updatedShow) {
      return res.status(404).json({
        success: false,
        error: `Show with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedShow,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/shows/:id
 * Description: Delete a show document
 * ER Integrity Rule:
 *   - R2 (Book): Cannot delete show if active Bookings exist
 *   - Ticket: Cannot delete show if issued Tickets exist
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getShowLookupQuery(req.params.id);
    const show = await Show.findOne(query);

    if (!show) {
      return res.status(404).json({
        success: false,
        error: `Show with ID '${req.params.id}' not found.`,
      });
    }

    // Check for dependent records
    const [bookingCount, ticketCount] = await Promise.all([
      Booking.countDocuments({ showId: show._id }),
      Ticket.countDocuments({ showId: show._id }),
    ]);

    if (bookingCount > 0 || ticketCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete show: active bookings or issued tickets exist for this show.',
        details: {
          bookingsCount: bookingCount,
          ticketsCount: ticketCount,
        },
      });
    }

    await Show.deleteOne({ _id: show._id });

    res.json({
      success: true,
      data: {
        message: `Show ${show.showId} ('${show.name}') was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
