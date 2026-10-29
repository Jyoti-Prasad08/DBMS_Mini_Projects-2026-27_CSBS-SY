/**
 * Cinema / Movie Management System Backend Server
 * -------------------------------------------------------------
 * File: src/index.js
 * Architecture: Node.js + Express + MongoDB (Mongoose ODM)
 * 
 * ER Entities Handled:
 *   1. Customer   (customers)
 *   2. Show       (shows)
 *   3. Theater    (theaters)
 *   4. Ticket     (tickets)
 *   5. Coupon     (coupons)
 *   6. Snack      (snacks)
 *   7. Booking    (bookings)
 * 
 * ER Relationships Handled:
 *   - R1: Order  (Customer 1:N Snack)
 *   - R2: Book   (Customer M:N Show via Booking junction)
 *   - R3: Buy    (Customer 1:N Ticket)
 *   - R4: Locate (Show M:N Theater)
 *   - R5: Apply  (Ticket M:N Coupon)
 * 
 * Mounted Routes (all prefixed with /api):
 *   - /api/customers
 *   - /api/shows
 *   - /api/theaters
 *   - /api/tickets
 *   - /api/coupons
 *   - /api/snacks
 *   - /api/bookings
 *   - /api/stats
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Import Route Handlers
import customerRoutes from './routes/customers.js';
import showRoutes from './routes/shows.js';
import theaterRoutes from './routes/theaters.js';
import ticketRoutes from './routes/tickets.js';
import couponRoutes from './routes/coupons.js';
import snackRoutes from './routes/snacks.js';
import bookingRoutes from './routes/bookings.js';
import statsRoutes from './routes/stats.js';

// Import Centralized Error Handler
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Configure CORS to allow communication from Frontend (Vite runs on port 5173)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Built-in JSON request body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cinema / Movie Management System API is running smoothly.',
    version: '1.0.0',
    documentation: {
      customers: '/api/customers',
      shows: '/api/shows',
      theaters: '/api/theaters',
      tickets: '/api/tickets',
      coupons: '/api/coupons',
      snacks: '/api/snacks',
      bookings: '/api/bookings',
      stats: '/api/stats',
    },
  });
});

// Mount Entity CRUD and Aggregation Routes under /api prefix
app.use('/api/customers', customerRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/snacks', snackRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);

// Catch-all 404 handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found.`,
  });
});

// Mount Centralized Global Error Handler Middleware
app.use(errorHandler);

// Establish MongoDB connection
connectDB();

// Start Express HTTP Server on configured port (default 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Cinema DB Backend Server Running on Port: ${PORT}`);
  console.log(` Base URL: http://localhost:${PORT}`);
  console.log(` NOTE: Port 5000 is reserved by macOS. Using ${PORT}.`);
  console.log(` CORS Allowed Origin: http://localhost:5173`);
  console.log(`====================================================`);
});

export default app;
