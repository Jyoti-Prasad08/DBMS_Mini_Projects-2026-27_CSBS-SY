/**
 * Seed Database Script
 * -------------------------------------------------------------
 * File: seed.js
 * Architecture: Standalone Node.js ES Module database seeder
 * Purpose: Populates the MongoDB database with realistic demo data
 *          covering all 7 collections and 5 ER relationships.
 * 
 * Execution:
 *   node seed.js  (or npm run seed)
 * 
 * Data Populated:
 *   - 5 Customers
 *   - 4 Shows (mix of 'movies', 'live Show', and 'concert')
 *   - 3 Theaters (linked to Shows via R4: Locate)
 *   - 4 Coupons (2 active, 2 expired)
 *   - 6 Tickets (with auto-calculated amounts and R5 coupon links)
 *   - 5 Snack Orders (linked to Customers via R1: Order)
 *   - 4 Bookings (Customer + Show reservation junction via R2: Book)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Customer from './src/models/Customer.js';
import Show from './src/models/Show.js';
import Theater from './src/models/Theater.js';
import Ticket from './src/models/Ticket.js';
import Coupon from './src/models/Coupon.js';
import Snack from './src/models/Snack.js';
import Booking from './src/models/Booking.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinemadb';

const seedDatabase = async () => {
  try {
    console.log('\n======================================================');
    console.log(' Starting Cinema DB Database Seeding...');
    console.log(` Target Database: ${MONGO_URI}`);
    console.log('======================================================\n');

    await mongoose.connect(MONGO_URI);
    console.log('[1/9] Connected to MongoDB.');

    // 1. Clear all existing collections to start with a fresh slate
    console.log('[2/9] Clearing existing collections...');
    await Promise.all([
      Customer.deleteMany({}),
      Show.deleteMany({}),
      Theater.deleteMany({}),
      Ticket.deleteMany({}),
      Coupon.deleteMany({}),
      Snack.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    console.log('      All collections cleared successfully.');

    // 2. Insert Customers (Indian names per project context)
    console.log('[3/9] Inserting Customers...');
    const customerData = [
      {
        customerId: 'CUST-001',
        email: 'arjun.sharma@gmail.com',
        firstName: 'Arjun',
        lastName: 'Sharma',
        contactNo: '+91-9876543210',
        age: 24,
        gender: 'Male',
      },
      {
        customerId: 'CUST-002',
        email: 'priya.patel@gmail.com',
        firstName: 'Priya',
        lastName: 'Patel',
        contactNo: '+91-9876543211',
        age: 27,
        gender: 'Female',
      },
      {
        customerId: 'CUST-003',
        email: 'rohit.verma@gmail.com',
        firstName: 'Rohit',
        lastName: 'Verma',
        contactNo: '+91-9876543212',
        age: 31,
        gender: 'Male',
      },
      {
        customerId: 'CUST-004',
        email: 'sneha.iyer@gmail.com',
        firstName: 'Sneha',
        lastName: 'Iyer',
        contactNo: '+91-9876543213',
        age: 22,
        gender: 'Female',
      },
      {
        customerId: 'CUST-005',
        email: 'vikram.nair@gmail.com',
        firstName: 'Vikram',
        lastName: 'Nair',
        contactNo: '+91-9876543214',
        age: 35,
        gender: 'Male',
      },
    ];
    const createdCustomers = await Customer.create(customerData);
    console.log(`      Inserted ${createdCustomers.length} customers.`);

    // 3. Insert Theaters (named "Theatre 1", "Theatre 2", "Theatre 3" per user instruction)
    //    transId is set to match the booking transaction at this theater (same as Ticket transactionId)
    console.log('[4/9] Inserting Theaters...');
    const theaterData = [
      {
        theaterId: 'THR-001',
        theaterName: 'Theatre 1',          // TECHNICAL: display name; ER has no name attribute
        email: 'theatre1@cinemadb.com',
        seatNo: 'A1-Z50',
        quantity: 250,
        transId: 'TXN-908123',             // Same as Ticket TKT-001 transactionId (user confirmed: same transaction)
        ticketId: 'TKT-001',               // Same seat reference as Ticket.seatNo (user confirmed)
        showIds: [],
      },
      {
        theaterId: 'THR-002',
        theaterName: 'Theatre 2',
        email: 'theatre2@cinemadb.com',
        seatNo: 'A1-H80',
        quantity: 500,
        transId: 'TXN-908126',             // Same as Ticket TKT-004 transactionId
        ticketId: 'TKT-004',
        showIds: [],
      },
      {
        theaterId: 'THR-003',
        theaterName: 'Theatre 3',
        email: 'theatre3@cinemadb.com',
        seatNo: 'A1-P45',
        quantity: 180,
        transId: 'TXN-908125',             // Same as Ticket TKT-003 transactionId
        ticketId: 'TKT-003',
        showIds: [],
      },
    ];
    const createdTheaters = await Theater.create(theaterData);
    console.log(`      Inserted ${createdTheaters.length} theaters.`);

    // 4. Insert Shows — Indian cinema context per user request:
    //    type 'movies'   : Bollywood films (Kalki 2898 AD, Stree 2)
    //    type 'live Show': Sunburn Festival Live
    //    type 'concert'  : AR Rahman World Tour
    console.log('[5/9] Inserting Shows and establishing R4 (Locate) relationship...');
    const showData = [
      {
        showId: 'SHW-001',
        name: 'Kalki 2898 AD',
        language: 'Hindi',
        genre: 'Sci-Fi / Action',
        duration: 181,
        type: 'movies',
        theaterIds: [createdTheaters[0]._id],   // Theatre 1 (R4: locate)
      },
      {
        showId: 'SHW-002',
        name: 'Stree 2',
        language: 'Hindi',
        genre: 'Horror / Comedy',
        duration: 145,
        type: 'movies',
        theaterIds: [createdTheaters[1]._id],   // Theatre 2 (R4: locate)
      },
      {
        showId: 'SHW-003',
        name: 'Sunburn Festival Live',
        language: 'Hindi / English',
        genre: 'Electronic Dance Music',
        duration: 300,
        type: 'live Show',
        theaterIds: [createdTheaters[2]._id],   // Theatre 3 (R4: locate)
      },
      {
        showId: 'SHW-004',
        name: 'AR Rahman World Tour',
        language: 'Tamil / Hindi',
        genre: 'Fusion / Classical',
        duration: 180,
        type: 'concert',
        theaterIds: [createdTheaters[0]._id, createdTheaters[1]._id], // Theatre 1 & 2 (R4: locate)
      },
    ];
    const createdShows = await Show.create(showData);
    console.log(`      Inserted ${createdShows.length} shows.`);

    // Update reverse relationship on theaters (Theater.showIds) — R4: locate
    await Theater.findByIdAndUpdate(createdTheaters[0]._id, {
      $set: { showIds: [createdShows[0]._id, createdShows[3]._id] }, // Theatre 1 hosts Kalki + AR Rahman
    });
    await Theater.findByIdAndUpdate(createdTheaters[1]._id, {
      $set: { showIds: [createdShows[1]._id, createdShows[3]._id] }, // Theatre 2 hosts Stree 2 + AR Rahman
    });
    await Theater.findByIdAndUpdate(createdTheaters[2]._id, {
      $set: { showIds: [createdShows[2]._id] }, // Theatre 3 hosts Sunburn
    });
    console.log('      Bidirectional R4 (Locate) theater <-> show associations linked.');

    // 5. Insert Coupons (2 active, 2 expired)
    console.log('[6/9] Inserting Coupons (Active and Expired)...');
    const now = new Date();
    const couponData = [
      {
        couponId: 'CPN-001',
        couponCode: 'WELCOME20',
        discount: 20,
        expireDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead (Active)
      },
      {
        couponId: 'CPN-002',
        couponCode: 'BLOCKBUSTER15',
        discount: 15,
        expireDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days ahead (Active)
      },
      {
        couponId: 'CPN-003',
        couponCode: 'SUMMER2023',
        discount: 25,
        expireDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago (Expired)
      },
      {
        couponId: 'CPN-004',
        couponCode: 'FLASHSALE50',
        discount: 50,
        expireDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago (Expired)
      },
    ];
    const createdCoupons = await Coupon.create(couponData);
    console.log(`      Inserted ${createdCoupons.length} coupons.`);

    // 6. Insert Tickets (Amount auto-computed via pre-save, R5 coupons applied)
    console.log('[7/9] Inserting Tickets with auto-computed amounts & R5 coupons...');
    const ticketData = [
      {
        ticketId: 'TKT-001',
        transactionId: 'TXN-908123',     // Same as Theatre 1's transId (user confirmed same transaction)
        seatNo: 'A-12',                  // Specific seat in Theatre 1 (user confirmed same seat as Theater.seatNo)
        quantity: 2,
        unitPrice: 350,                  // ₹350 per seat; amount auto-derived = ₹700
        customerId: createdCustomers[0]._id, // Arjun Sharma (R3: buy)
        showId: createdShows[0]._id,         // Kalki 2898 AD
        couponIds: [createdCoupons[0]._id],  // R5: apply WELCOME20
      },
      {
        ticketId: 'TKT-002',
        transactionId: 'TXN-908124',
        seatNo: 'B-04',
        quantity: 1,
        unitPrice: 350,                  // amount = ₹350
        customerId: createdCustomers[1]._id, // Priya Patel
        showId: createdShows[0]._id,         // Kalki 2898 AD
        couponIds: [],
      },
      {
        ticketId: 'TKT-003',
        transactionId: 'TXN-908125',     // Same as Theatre 3's transId
        seatNo: 'C-10',                  // Specific seat in Theatre 3
        quantity: 1,
        unitPrice: 500,                  // amount = ₹500
        customerId: createdCustomers[2]._id, // Rohit Verma
        showId: createdShows[2]._id,         // Sunburn Festival Live
        couponIds: [createdCoupons[1]._id],  // R5: apply BLOCKBUSTER15
      },
      {
        ticketId: 'TKT-004',
        transactionId: 'TXN-908126',     // Same as Theatre 2's transId
        seatNo: 'D-01',                  // Specific seat in Theatre 2
        quantity: 3,
        unitPrice: 299,                  // amount = ₹897
        customerId: createdCustomers[3]._id, // Sneha Iyer
        showId: createdShows[1]._id,         // Stree 2
        couponIds: [],
      },
      {
        ticketId: 'TKT-005',
        transactionId: 'TXN-908127',
        seatNo: 'E-22',
        quantity: 2,
        unitPrice: 1200,                 // amount = ₹2400 (AR Rahman concert)
        customerId: createdCustomers[4]._id, // Vikram Nair
        showId: createdShows[3]._id,         // AR Rahman World Tour
        couponIds: [],
      },
      {
        ticketId: 'TKT-006',
        transactionId: 'TXN-908128',
        seatNo: 'A-05',
        quantity: 1,
        unitPrice: 350,                  // amount = ₹350
        customerId: createdCustomers[0]._id, // Arjun Sharma (bought 2 shows)
        showId: createdShows[1]._id,         // Stree 2
        couponIds: [],
      },
    ];

    // Use save() loop to invoke Mongoose pre('save') middleware for amount calculation
    const createdTickets = [];
    for (const t of ticketData) {
      const ticket = new Ticket(t);
      await ticket.save();
      createdTickets.push(ticket);
    }
    console.log(`      Inserted ${createdTickets.length} tickets with pre-save derived amounts.`);

    // 7. Insert Snack Orders (R1: Order, 1:N — one Customer has many Snack Orders)
    //    Each record = one snack item a customer buys at the theater
    console.log('[8/9] Inserting Snack Orders (R1: Order)...');
    const snackData = [
      {
        orderId: 'ORD-001',
        itemName: 'Popcorn (Butter Large)',
        price: 150,
        quantity: 2,
        customerId: createdCustomers[0]._id, // Arjun Sharma orders 2 Popcorns
      },
      {
        orderId: 'ORD-002',
        itemName: 'Pepsi (Regular)',
        price: 80,
        quantity: 2,
        customerId: createdCustomers[0]._id, // Arjun Sharma also orders 2 Pepsis
      },
      {
        orderId: 'ORD-003',
        itemName: 'Samosa (2 pcs)',
        price: 60,
        quantity: 1,
        customerId: createdCustomers[1]._id, // Priya Patel
      },
      {
        orderId: 'ORD-004',
        itemName: 'Nachos with Cheese Dip',
        price: 120,
        quantity: 1,
        customerId: createdCustomers[2]._id, // Rohit Verma
      },
      {
        orderId: 'ORD-005',
        itemName: 'Cold Coffee',
        price: 90,
        quantity: 3,
        customerId: createdCustomers[3]._id, // Sneha Iyer
      },
    ];
    const createdSnacks = await Snack.create(snackData);
    console.log(`      Inserted ${createdSnacks.length} snack orders.`);

    // 8. Insert Bookings (R2: Book — M:N, Customer RESERVES a Show)
    //    NOTE: Booking = Reservation (availability decreases)
    //          Ticket  = Purchase/Transaction (actual payment — R3: buy)
    //    These are SEPARATE operations per the ER diagram.
    console.log('[9/9] Inserting Bookings (R2: Book — Reservation)...');
    const bookingData = [
      {
        bookingId: 'BKG-001',
        customerId: createdCustomers[0]._id, // Arjun Sharma reserves Kalki 2898 AD
        showId: createdShows[0]._id,
      },
      {
        bookingId: 'BKG-002',
        customerId: createdCustomers[1]._id, // Priya Patel reserves Kalki 2898 AD
        showId: createdShows[0]._id,
      },
      {
        bookingId: 'BKG-003',
        customerId: createdCustomers[2]._id, // Rohit Verma reserves Sunburn Festival
        showId: createdShows[2]._id,
      },
      {
        bookingId: 'BKG-004',
        customerId: createdCustomers[3]._id, // Sneha Iyer reserves AR Rahman Concert
        showId: createdShows[3]._id,
      },
    ];
    const createdBookings = await Booking.create(bookingData);
    console.log(`      Inserted ${createdBookings.length} bookings.`);

    console.log('\n======================================================');
    console.log(' SEEDING COMPLETE! Summary of Seeded Data:');
    console.log('======================================================');
    console.log(` • Customers    : ${createdCustomers.length}`);
    console.log(` • Shows        : ${createdShows.length}`);
    console.log(` • Theaters     : ${createdTheaters.length}`);
    console.log(` • Tickets      : ${createdTickets.length}`);
    console.log(` • Coupons      : ${createdCoupons.length} (2 Active, 2 Expired)`);
    console.log(` • Snack Orders : ${createdSnacks.length}`);
    console.log(` • Bookings     : ${createdBookings.length}`);
    console.log('======================================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal Error during Database Seeding:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
