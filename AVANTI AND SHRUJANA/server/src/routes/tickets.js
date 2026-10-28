/**
 * Ticket Routes
 * -------------------------------------------------------------
 * File: src/routes/tickets.js
 * ER Entity: Ticket
 * ER Relationships:
 *   - R3 (Buy):   1:N — Customer purchases Ticket (Ticket.customerId -> Customer)
 *   - R5 (Apply): M:N — Coupon applied to Ticket (Ticket.couponIds -> Coupon)
 * 
 * CRUD Operations Exposed:
 *   - GET    /api/tickets                        : List tickets (filter by customer/show, sort by amount, paginate)
 *   - POST   /api/tickets                        : Create ticket (validates customer/show exist, auto-computes amount)
 *   - GET    /api/tickets/:id                    : Get ticket by _id or ticketId (populated with customer, show, coupons)
 *   - PUT    /api/tickets/:id                    : Update ticket (auto-recomputes amount if unitPrice/qty change)
 *   - DELETE /api/tickets/:id                    : Delete ticket
 *   - POST   /api/tickets/:id/apply-coupon       : Apply a valid, unexpired coupon to a ticket
 *   - DELETE /api/tickets/:id/remove-coupon/:couponId : Remove an applied coupon from a ticket
 */

import express from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import Customer from '../models/Customer.js';
import Show from '../models/Show.js';
import Coupon from '../models/Coupon.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * Helper to build find query accepting either MongoDB ObjectId or human-readable ticketId
 */
const getTicketLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }
  return { ticketId: id };
};

/**
 * GET /api/tickets
 * Description: List tickets with filtering by customerId or showId, sorting by amount, and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { customerId, showId, sort = 'amount:desc', page = 1, limit = 10 } = req.query;

    // Auto-sync: Ensure every booking has a corresponding ticket
    try {
      const allBookings = await Booking.find({});
      for (const b of allBookings) {
        if (b.customerId && b.showId) {
          const hasTicket = await Ticket.findOne({ customerId: b.customerId, showId: b.showId });
          if (!hasTicket) {
            const t = new Ticket({
              transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
              seatNo: 'A-12',
              quantity: 1,
              unitPrice: 250,
              customerId: b.customerId,
              showId: b.showId
            });
            await t.save();
          }
        }
      }
    } catch (syncErr) {
      // Continue if sync encounters race
    }

    const filter = {};

    // Filter by customer (by _id or customerId)
    if (customerId) {
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        filter.customerId = customerId;
      } else {
        const custDoc = await Customer.findOne({ customerId });
        if (custDoc) filter.customerId = custDoc._id;
        else filter.customerId = null; // Yields empty result gracefully
      }
    }

    // Filter by show (by _id or showId)
    if (showId) {
      if (mongoose.Types.ObjectId.isValid(showId)) {
        filter.showId = showId;
      } else {
        const showDoc = await Show.findOne({ showId });
        if (showDoc) filter.showId = showDoc._id;
        else filter.showId = null;
      }
    }

    // Sort options (e.g. amount:asc, amount:desc)
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

    const [total, tickets] = await Promise.all([
      Ticket.countDocuments(filter),
      Ticket.find(filter)
        .populate('customerId', 'customerId firstName lastName email contactNo')
        .populate('showId', 'showId name language genre type duration')
        .populate('couponIds', 'couponId couponCode discount expireDate')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      data: tickets,
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
 * GET /api/tickets/:id
 * Description: Retrieve a single ticket with full relationship populations
 */
router.get('/:id', async (req, res, next) => {
  try {
    const query = getTicketLookupQuery(req.params.id);
    const ticket = await Ticket.findOne(query)
      .populate('customerId', 'customerId firstName lastName email contactNo')
      .populate('showId', 'showId name language genre type duration')
      .populate('couponIds', 'couponId couponCode discount expireDate');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tickets
 * Description: Create a new ticket
 * Business Rules:
 *   - Customer must exist (R3: buy)
 *   - Show must exist
 *   - Amount is automatically computed as unitPrice * quantity
 */
router.post('/', async (req, res, next) => {
  try {
    const { transactionId, seatNo, quantity, unitPrice, customerId, showId, couponIds } = req.body;

    // Validate and resolve Customer reference
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID (customerId) is required to issue a ticket.',
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

    // Validate and resolve Show reference
    if (!showId) {
      return res.status(400).json({
        success: false,
        error: 'Show ID (showId) is required to issue a ticket.',
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

    // Create ticket (amount will be calculated in pre('save') middleware)
    const ticket = new Ticket({
      transactionId: transactionId || `TXN-${Date.now()}`,
      seatNo,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice),
      customerId: customer._id,
      showId: show._id,
      couponIds: couponIds || [],
    });

    const savedTicket = await ticket.save();

    // Auto-create synchronized Booking for this ticket if not already present
    const existingBooking = await Booking.findOne({
      customerId: customer._id,
      showId: show._id,
    });
    if (!existingBooking) {
      const booking = new Booking({
        customerId: customer._id,
        showId: show._id,
      });
      await booking.save();
    }

    // Re-populate for rich response
    const populated = await Ticket.findById(savedTicket._id)
      .populate('customerId', 'customerId firstName lastName email')
      .populate('showId', 'showId name language genre type')
      .populate('couponIds', 'couponId couponCode discount expireDate');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tickets/:id
 * Description: Update ticket details
 * Business Rules:
 *   - ticketId is immutable
 *   - Auto-recomputes amount if unitPrice or quantity changes
 */
router.put('/:id', async (req, res, next) => {
  try {
    const query = getTicketLookupQuery(req.params.id);

    // Prevent changing ticketId
    if (req.body.ticketId) {
      delete req.body.ticketId;
    }

    // If customerId is provided, resolve to ObjectId
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

    // If showId is provided, resolve to ObjectId
    if (req.body.showId) {
      const showQuery = mongoose.Types.ObjectId.isValid(req.body.showId)
        ? { _id: req.body.showId }
        : { showId: req.body.showId };
      const show = await Show.findOne(showQuery);
      if (!show) {
        return res.status(404).json({
          success: false,
          error: `Show with ID '${req.body.showId}' not found.`,
        });
      }
      req.body.showId = show._id;
    }

    const updatedTicket = await Ticket.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('customerId', 'customerId firstName lastName email')
      .populate('showId', 'showId name language genre type')
      .populate('couponIds', 'couponId couponCode discount expireDate');

    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tickets/:id
 * Description: Delete a ticket document
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const query = getTicketLookupQuery(req.params.id);
    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${req.params.id}' not found.`,
      });
    }

    await Ticket.deleteOne({ _id: ticket._id });

    // Synchronized deletion: Also delete matching booking for this customer & show
    if (ticket.customerId && ticket.showId) {
      await Booking.deleteMany({
        customerId: ticket.customerId,
        showId: ticket.showId,
      });
    }

    res.json({
      success: true,
      data: {
        message: `Ticket ${ticket.ticketId} (Transaction: ${ticket.transactionId}) was deleted successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tickets/:id/apply-coupon
 * Description: Apply a coupon to a ticket (ER Relationship R5: Apply)
 * Business Rules:
 *   - Coupon must exist
 *   - Coupon expireDate must be >= current date (not expired)
 *   - Prevent duplicate application of the same coupon
 */
router.post('/:id/apply-coupon', async (req, res, next) => {
  try {
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        error: 'Coupon ID (couponId) is required in request body.',
      });
    }

    // Locate Ticket
    const ticketQuery = getTicketLookupQuery(req.params.id);
    const ticket = await Ticket.findOne(ticketQuery);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${req.params.id}' not found.`,
      });
    }

    // Locate Coupon by _id or couponId
    const couponQuery = mongoose.Types.ObjectId.isValid(couponId)
      ? { _id: couponId }
      : { couponId };
    const coupon = await Coupon.findOne(couponQuery);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID '${couponId}' not found.`,
      });
    }

    // Check expiration date
    const now = new Date();
    if (new Date(coupon.expireDate) < now) {
      return res.status(400).json({
        success: false,
        error: `Coupon '${coupon.couponCode}' expired on ${coupon.expireDate.toISOString().split('T')[0]} and cannot be applied.`,
      });
    }

    // Check if already applied
    const alreadyApplied = ticket.couponIds.some(
      (id) => String(id) === String(coupon._id)
    );
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        error: `Coupon '${coupon.couponCode}' is already applied to this ticket.`,
      });
    }

    // Add coupon to ticket's couponIds array
    ticket.couponIds.push(coupon._id);
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'customerId firstName lastName email')
      .populate('showId', 'showId name language genre type')
      .populate('couponIds', 'couponId couponCode discount expireDate');

    res.json({
      success: true,
      message: `Coupon '${coupon.couponCode}' (${coupon.discount}% off) applied successfully.`,
      data: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tickets/:id/remove-coupon/:couponId
 * Description: Remove an applied coupon from a ticket
 */
router.delete('/:id/remove-coupon/:couponId', async (req, res, next) => {
  try {
    const ticketQuery = getTicketLookupQuery(req.params.id);
    const ticket = await Ticket.findOne(ticketQuery);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${req.params.id}' not found.`,
      });
    }

    // Find coupon to remove
    const couponQuery = mongoose.Types.ObjectId.isValid(req.params.couponId)
      ? { _id: req.params.couponId }
      : { couponId: req.params.couponId };
    const coupon = await Coupon.findOne(couponQuery);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: `Coupon with ID '${req.params.couponId}' not found.`,
      });
    }

    // Filter out the coupon
    ticket.couponIds = ticket.couponIds.filter(
      (cId) => String(cId) !== String(coupon._id)
    );
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'customerId firstName lastName email')
      .populate('showId', 'showId name language genre type')
      .populate('couponIds', 'couponId couponCode discount expireDate');

    res.json({
      success: true,
      message: `Coupon '${coupon.couponCode}' removed from ticket successfully.`,
      data: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
