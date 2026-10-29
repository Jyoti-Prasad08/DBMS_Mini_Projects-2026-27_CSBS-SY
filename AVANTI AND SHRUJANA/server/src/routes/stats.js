/**
 * Stats & Analytics Routes
 * -------------------------------------------------------------
 * File: src/routes/stats.js
 * ER Coverage: Aggregations across all 7 Entities and 5 ER Relationships
 * 
 * Operations Exposed:
 *   - GET /api/stats : Returns a comprehensive metrics dashboard computed using
 *                      MongoDB Aggregation Pipelines:
 *                        - totalCustomers, totalShows, totalTheaters, totalTickets
 *                        - totalCoupons, totalSnackOrders, totalBookings
 *                        - totalRevenue (sum of ticket amounts)
 *                        - showsByType (group by show category)
 *                        - avgTicketAmount (average order value)
 *                        - topCustomers (top 5 customers by ticket volume)
 *                        - mostBookedShows (top 5 popular shows by reservation count)
 *                        - activeCoupons & expiredCoupons counts
 *                        - snacksByItem (breakdown of sales and revenue per snack)
 */

import express from 'express';
import Customer from '../models/Customer.js';
import Show from '../models/Show.js';
import Theater from '../models/Theater.js';
import Ticket from '../models/Ticket.js';
import Coupon from '../models/Coupon.js';
import Snack from '../models/Snack.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * GET /api/stats
 * Description: Executive dashboard summary using MongoDB Aggregation pipelines
 */
router.get('/', async (req, res, next) => {
  try {
    const today = new Date();

    // Execute aggregation pipelines concurrently for high performance
    const [
      totalCustomers,
      totalShows,
      totalTheaters,
      totalTickets,
      totalCoupons,
      totalSnackOrders,
      totalBookings,
      revenueResult,
      showsByType,
      avgTicketResult,
      topCustomers,
      mostBookedShows,
      expiredCoupons,
      activeCoupons,
      snacksByItem,
    ] = await Promise.all([
      // 1. Total count of customer records
      Customer.countDocuments(),

      // 2. Total count of show records
      Show.countDocuments(),

      // 3. Total count of theater venues
      Theater.countDocuments(),

      // 4. Total tickets issued
      Ticket.countDocuments(),

      // 5. Total discount coupons created
      Coupon.countDocuments(),

      // 6. Total snack refreshment orders
      Snack.countDocuments(),

      // 7. Total reservations/bookings made
      Booking.countDocuments(),

      // 8. Aggregation: Sum of all ticket sales amounts
      Ticket.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),

      // 9. Aggregation: Group shows by category/type ('movies', 'live Show', 'concert')
      Show.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 10. Aggregation: Average ticket purchase amount
      Ticket.aggregate([
        {
          $group: {
            _id: null,
            avgAmount: { $avg: '$amount' },
          },
        },
      ]),

      // 11. Aggregation: Top 5 customers by ticket volume & spend
      Ticket.aggregate([
        {
          $group: {
            _id: '$customerId',
            ticketCount: { $sum: 1 },
            totalSpent: { $sum: '$amount' },
          },
        },
        { $sort: { ticketCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: '$customer' },
        {
          $project: {
            _id: 1,
            customerId: '$customer.customerId',
            name: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
            email: '$customer.email',
            ticketCount: 1,
            totalSpent: 1,
          },
        },
      ]),

      // 12. Aggregation: Top 5 most booked shows
      Booking.aggregate([
        {
          $group: {
            _id: '$showId',
            bookingCount: { $sum: 1 },
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'shows',
            localField: '_id',
            foreignField: '_id',
            as: 'show',
          },
        },
        { $unwind: '$show' },
        {
          $project: {
            _id: 1,
            showId: '$show.showId',
            name: '$show.name',
            type: '$show.type',
            bookingCount: 1,
          },
        },
      ]),

      // 13. Expired coupons count (expireDate < today)
      Coupon.countDocuments({ expireDate: { $lt: today } }),

      // 14. Active coupons count (expireDate >= today)
      Coupon.countDocuments({ expireDate: { $gte: today } }),

      // 15. Aggregation: Snacks breakdown by item name with total quantity and revenue
      Snack.aggregate([
        {
          $group: {
            _id: '$itemName',
            totalQty: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
    ]);

    // Format response object according to project specifications
    const statsData = {
      totalCustomers,
      totalShows,
      totalTheaters,
      totalTickets,
      totalCoupons,
      totalSnackOrders,
      totalBookings,
      totalRevenue: revenueResult.length > 0 ? Number(revenueResult[0].totalRevenue.toFixed(2)) : 0,
      showsByType,
      avgTicketAmount: avgTicketResult.length > 0 ? Number(avgTicketResult[0].avgAmount.toFixed(2)) : 0,
      topCustomers,
      mostBookedShows,
      expiredCoupons,
      activeCoupons,
      snacksByItem,
    };

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
