/**
 * Booking Routes
 * -------------------------------------------------------------
 * File: src/routes/bookings.js
 * ER Entity: Booking (Associative Entity / Junction Table)
 * ER Relationships:
 *   - R2 (Book): M:N Junction — Customer reserves seats for Show
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/bookings       : List bookings (filter by customerId/showId, paginate, sort)
 *   - POST   /api/bookings       : Create booking (validates customer and show, blocks duplicate combos)
 *   - GET    /api/bookings/:id   : Get single booking by _id or bookingId (populated with customer and show)
 *   - DELETE /api/bookings/:id   : Cancel/delete booking
 */

import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Show from '../models/Show.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable bookingId
 */
const getBookingLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { bookingId: id };
};

/**
 * GET /api/bookings
 * Description: List bookings with customer and show filters, sorting, and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { customerId, showId, sort, page = 1, limit = 10 } = req.query;

    // Auto-sync: Ensure every ticket has a corresponding booking
    try {
      const allTickets = await Ticket.find({});
      for (const t of allTickets) {
        if (t.customerId && t.showId) {
          const hasBooking = await Booking.findOne({ customerId: t.customerId, showId: t.showId });
          if (!hasBooking) {
            const b = new Booking({
              customerId: t.customerId,
              showId: t.showId
            });
            await b.save();
          }
        }
      }
    } catch (syncErr) {
      // Continue if sync encounters duplicate index race
    }

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

    if (showId) {
      if (mongoose.Types.ObjectId.isValid(showId)) {
        filter.showId = showId;
      } else {
        const showDoc = await Show.findOne({ showId });
        if (showDoc) filter.showId = showDoc._id;
        else filter.showId = null;
      }
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

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('customerId', 'customerId firstName lastName email contactNo')
        .populate('showId', 'showId name language genre type duration')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      data: bookings,
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
 * GET /api/bookings/:id
 * Description: Retrieve a single booking with customer and show details populated
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getBookingLookupQuery(req.params.id);
    const booking = await Booking.findOne(query)
      .populate('customerId', 'customerId firstName lastName email contactNo')
      .populate('showId', 'showId name language genre type duration');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Booking with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings
 * Description: Create a new booking
 * Business Rules:
 *   - Customer must exist
 *   - Show must exist
 *   - Duplicate booking check: a customer cannot book the same show twice
 */
router.post('/', async (req, res, next) => {
  try {
    const { customerId, showId } = req.body;

    // Validate customerId presence and resolve
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID (customerId) is required.',
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

    // Validate showId presence and resolve
    if (!showId) {
      return res.status(400).json({
        success: false,
        error: 'Show ID (showId) is required.',
      });
    }
    const showQuery = mongoose.Types.ObjectId.isValid(showId)
      ? { _id: showId }
      : { showId };
    const show = await Show.findOne(showQuery);
    if (!show) {
      return res.status(404).json({
        success: false,
        error: `Show with ID '${showId}' does not exist.`,
      });
    }

    // Check for existing booking (prevent duplicate customer + show combination)
    const existing = await Booking.findOne({
      customerId: customer._id,
      showId: show._id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Customer ${customer.customerId} already has an active booking (${existing.bookingId}) for show '${show.name}'.`,
      });
    }

    const booking = new Booking({
      customerId: customer._id,
      showId: show._id,
    });

    const savedBooking = await booking.save();

    // Auto-create synchronized Ticket for this booking if not already present
    const existingTicket = await Ticket.findOne({
      customerId: customer._id,
      showId: show._id,
    });
    if (!existingTicket) {
      const ticket = new Ticket({
        transactionId: req.body.transactionId || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        seatNo: req.body.seatNo || 'A-12',
        quantity: Number(req.body.quantity) || 1,
        unitPrice: Number(req.body.unitPrice) || 250,
        customerId: customer._id,
        showId: show._id,
      });
      await ticket.save();
    }

    const populated = await Booking.findById(savedBooking._id)
      .populate('customerId', 'customerId firstName lastName email')
      .populate('showId', 'showId name language genre type');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/bookings/:id
 * Description: Cancel/delete a booking
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getBookingLookupQuery(req.params.id);
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Booking with ID '${req.params.id}' not found.`,
      });
    }

    await Booking.deleteOne({ _id: booking._id });

    // Synchronized deletion: Also delete matching tickets for this customer & show
    if (booking.customerId && booking.showId) {
      await Ticket.deleteMany({
        customerId: booking.customerId,
        showId: booking.showId,
      });
    }

    res.json({
      success: true,
      data: {
        message: `Booking ${booking.bookingId} was cancelled successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
