const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'CineVerse_Project_Report.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
doc.pipe(fs.createWriteStream(outputPath));

// ── Colors ─────────────────────────────────────────────────────────────────
const GOLD  = '#F59E0B';
const DARK  = '#1F2937';
const GRAY  = '#6B7280';
const LIGHT = '#F3F4F6';
const WHITE = '#FFFFFF';
const GREEN = '#10B981';
const BLUE  = '#3B82F6';
const RED   = '#EF4444';

// ── Helpers ────────────────────────────────────────────────────────────────
function pw() { return doc.page.width - 100; }

function hline(y, color, thickness = 0.8) {
  doc.save().strokeColor(color || GOLD).lineWidth(thickness)
     .moveTo(50, y).lineTo(doc.page.width - 50, y).stroke().restore();
}

function fillRect(x, y, w, h, color) {
  doc.save().fillColor(color).rect(x, y, w, h).fill().restore();
}

function sectionTitle(title) {
  doc.addPage();
  fillRect(50, 50, pw(), 38, DARK);
  doc.fillColor(GOLD).fontSize(16).font('Helvetica-Bold')
     .text(title, 62, 62, { width: pw() - 20 });
  doc.y = 105;
}

function subTitle(text) {
  doc.moveDown(0.5);
  doc.fillColor(GOLD).fontSize(12).font('Helvetica-Bold').text(text);
  hline(doc.y + 2, GOLD, 0.7);
  doc.moveDown(0.5);
}

function para(text) {
  doc.fillColor(DARK).fontSize(10).font('Helvetica')
     .text(text, { align: 'justify' });
  doc.moveDown(0.4);
}

function point(text, sub = false) {
  const x = sub ? 75 : 62;
  const sym = sub ? '–' : '▸';
  doc.fillColor(sub ? GRAY : GOLD).fontSize(10).font('Helvetica-Bold')
     .text(sym, x, doc.y, { continued: true, width: 14 });
  doc.fillColor(DARK).font('Helvetica').text('  ' + text, { width: pw() - (x - 50) });
  doc.moveDown(0.3);
}

function tblRow(cols, widths, header = false, bg = null) {
  const h = 22, sx = 50, sy = doc.y;
  if (bg) fillRect(sx, sy, pw(), h, bg);
  let x = sx;
  cols.forEach((c, i) => {
    doc.fillColor(header ? WHITE : DARK)
       .fontSize(header ? 9.5 : 9)
       .font(header ? 'Helvetica-Bold' : 'Helvetica')
       .text(String(c), x + 4, sy + 6, { width: widths[i] - 8, ellipsis: true });
    x += widths[i];
  });
  doc.strokeColor('#D1D5DB').lineWidth(0.3).rect(sx, sy, pw(), h).stroke();
  doc.y = sy + h;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════════════════════════════
fillRect(0, 0, doc.page.width, doc.page.height, DARK);
fillRect(0, 210, doc.page.width, 6, GOLD);
fillRect(0, 560, doc.page.width, 6, GOLD);

doc.fillColor(GOLD).fontSize(52).font('Helvetica-Bold')
   .text('CineVerse', 50, 240, { align: 'center', width: pw() });
doc.fillColor(WHITE).fontSize(20).font('Helvetica')
   .text('Cinema Booking System', 50, 310, { align: 'center', width: pw() });
doc.fillColor(GRAY).fontSize(12).font('Helvetica')
   .text('DBMS Mini Project — 3rd Semester', 50, 348, { align: 'center', width: pw() });

doc.fillColor(GOLD).fontSize(16).font('Helvetica')
   .text('✦  ✦  ✦', 50, 390, { align: 'center', width: pw() });

// 3 info boxes
const bw = pw() / 3 - 6;
[['Database', 'MongoDB'], ['Backend', 'Node.js + Express'], ['Frontend', 'React + Vite']].forEach(([label, val], i) => {
  const x = 50 + i * (bw + 9);
  fillRect(x, 430, bw, 55, '#374151');
  doc.strokeColor(GOLD).lineWidth(1).rect(x, 430, bw, 55).stroke();
  doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold').text(label, x, 440, { align: 'center', width: bw });
  doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text(val, x, 455, { align: 'center', width: bw });
});

doc.fillColor(GRAY).fontSize(10).font('Helvetica')
   .text('Date: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
     50, 580, { align: 'center', width: pw() });

doc.fillColor(GRAY).fontSize(9).font('Helvetica')
   .text('Submitted for: Database Management Systems (DBMS)', 50, 720, { align: 'center', width: pw() });


// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
doc.addPage();
fillRect(50, 50, pw(), 36, GOLD);
doc.fillColor(DARK).fontSize(17).font('Helvetica-Bold').text('Table of Contents', 62, 62);
doc.y = 105;

const toc = [
  ['1.', 'What is this Project?'],
  ['2.', 'What Problem does it Solve?'],
  ['3.', 'Tools & Technologies Used'],
  ['4.', 'How the System Works (Architecture)'],
  ['5.', 'Database — What Data We Store'],
  ['6.', 'How Tables are Related'],
  ['7.', 'Features of CineVerse'],
  ['8.', 'How Reservations and Tickets Stay in Sync'],
  ['9.', 'All API Endpoints (Backend Routes)'],
  ['10.', 'All Pages in the App'],
  ['11.', 'How We Keep User Data Private'],
  ['12.', 'How to Run this Project'],
  ['13.', 'Sample Data in the Database'],
  ['14.', 'What We Learned / Conclusion'],
];

toc.forEach(([num, title], i) => {
  const y = doc.y;
  fillRect(50, y, pw(), 22, i % 2 === 0 ? LIGHT : WHITE);
  doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold').text(num, 60, y + 6, { width: 28 });
  doc.fillColor(DARK).fontSize(10).font('Helvetica').text(title, 88, y + 6, { width: pw() - 40 });
  doc.fillColor(GRAY).fontSize(10).font('Helvetica-Bold').text(String(i + 3), 50, y + 6, { align: 'right', width: pw() });
  doc.y = y + 22;
});


// ═══════════════════════════════════════════════════════════════════════════
// 1. WHAT IS THIS PROJECT
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('1.  What is this Project?');

para('CineVerse is an online cinema booking web app — similar to BookMyShow — that we built as a DBMS mini project. It lets a user browse movie shows, reserve a seat, buy a ticket, order snacks, and use discount coupons, all from a single website.');
para('The project has two main parts:');
point('Backend — the server that stores and manages all data in MongoDB');
point('Frontend — the website that the user sees and interacts with in a browser');

doc.moveDown(0.5);
subTitle('Why did we build this?');
para('As a DBMS project, our goal was to design a real database, connect it to a backend server, and show how data is stored, retrieved, updated, and deleted. A cinema booking system is a great example because it has multiple types of data (movies, seats, tickets, users) that are all connected to each other — just like in a real application.');

doc.moveDown(0.5);
// Quick stats
const sw = pw() / 4 - 4;
[['7', 'DB Collections'], ['14', 'Web Pages'], ['40+', 'API Routes'], ['1', 'Locked User']].forEach(([val, label], i) => {
  const x = 50 + i * (sw + 5);
  fillRect(x, doc.y, sw, 52, DARK);
  doc.strokeColor(GOLD).lineWidth(1).rect(x, doc.y, sw, 52).stroke();
  doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold').text(val, x, doc.y + 6, { align: 'center', width: sw });
  doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(label, x, doc.y + 30, { align: 'center', width: sw });
});
doc.moveDown(3.5);


// ═══════════════════════════════════════════════════════════════════════════
// 2. WHAT PROBLEM DOES IT SOLVE
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('2.  What Problem does it Solve?');

para('Booking a cinema ticket manually (calling the theater, going in person) is slow and error-prone. People can accidentally book the same seat twice, or lose their ticket info. CineVerse solves this by storing everything in a database and making sure the data is always correct and up to date.');

subTitle('Problems CineVerse Fixes');
[
  ['Double Booking', 'Two people cannot book the same seat — the system checks before confirming'],
  ['Lost Tickets', 'All tickets are saved in the database and can be viewed anytime'],
  ['No Sync Between Records', 'When you reserve a seat, a ticket is also created automatically — they always match'],
  ['No Privacy', 'Each user only sees their own bookings and tickets, not anyone else\'s'],
  ['Manual Discount Calculation', 'Coupons are applied automatically and the final price is calculated by the backend'],
].forEach(([prob, sol]) => {
  doc.fillColor(RED).fontSize(10).font('Helvetica-Bold').text('Problem: ', 62, doc.y, { continued: true, width: 70 });
  doc.fillColor(DARK).font('Helvetica').text(prob);
  doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold').text('Solution: ', 75, doc.y, { continued: true, width: 70 });
  doc.fillColor(DARK).font('Helvetica').text(sol);
  doc.moveDown(0.4);
});

doc.moveDown(0.5);
subTitle('Who uses this App?');
para('For this project, there is one fixed user — Arjun Sharma (CUST-001). He is automatically loaded when you open the app. There is no login page because this is a demo project focused on the database part, not authentication.');


// ═══════════════════════════════════════════════════════════════════════════
// 3. TOOLS & TECHNOLOGIES
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('3.  Tools & Technologies Used');

para('Here are all the technologies we used and a simple explanation of what each one does:');
doc.moveDown(0.3);

const stack = [
  ['Technology', 'What it does in simple words'],
  ['MongoDB', 'Database — stores all our data (users, tickets, shows, etc.) as documents (like JSON files)'],
  ['Mongoose', 'Helps Node.js talk to MongoDB — also lets us define the shape/structure of our data'],
  ['Node.js', 'Runs JavaScript on the server (backend) instead of in the browser'],
  ['Express.js', 'A simple tool that helps us create API routes like /api/tickets, /api/bookings, etc.'],
  ['React 18', 'Used to build the website UI — everything you see on screen is made with React'],
  ['Vite', 'Starts the React app quickly during development (like a fast local web server)'],
  ['React Router', 'Handles navigation between pages (e.g., clicking "My Tickets" goes to /tickets)'],
  ['Axios', 'Sends HTTP requests from the React app to the backend (like fetch but simpler)'],
  ['Tailwind CSS', 'Styles the website — gives us the dark theme, gold colors, and card layouts'],
  ['PDFKit', 'Used to generate this PDF report from a Node.js script'],
];

tblRow(stack[0], [120, pw() - 120], true, DARK);
stack.slice(1).forEach((r, i) => tblRow(r, [120, pw() - 120], false, i % 2 === 0 ? LIGHT : WHITE));

doc.moveDown(1);
subTitle('Why MongoDB instead of SQL (MySQL)?');
para('In SQL databases, data is stored in fixed tables with strict rules. MongoDB stores data as flexible documents (similar to JSON), which is better for a project like this where different shows can have different details. Also, MongoDB is very popular in real-world industry projects, so learning it is useful.');


// ═══════════════════════════════════════════════════════════════════════════
// 4. HOW THE SYSTEM WORKS
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('4.  How the System Works (Architecture)');

para('CineVerse has 3 layers. Think of it like a restaurant: the customer (frontend), the waiter (backend API), and the kitchen (database).');
doc.moveDown(0.3);

// Simple 3-layer diagram
const layers = [
  { label: 'Layer 1 — Frontend (React)', sub: 'http://localhost:5173', desc: 'The website the user sees. Built with React + Vite. When you click buttons, it sends requests to the backend.', bg: '#1D4ED8' },
  { label: 'Layer 2 — Backend API (Express)', sub: 'http://localhost:5001', desc: 'The server. It receives requests, runs the business logic (e.g., sync bookings with tickets), and talks to MongoDB.', bg: '#065F46' },
  { label: 'Layer 3 — Database (MongoDB)', sub: 'mongodb://localhost:27017/cinemadb', desc: 'Stores all the actual data — customers, shows, bookings, tickets, snacks, coupons, theaters.', bg: '#7C3AED' },
];

layers.forEach(l => {
  fillRect(50, doc.y, pw(), 56, l.bg);
  doc.strokeColor(GOLD).lineWidth(1).rect(50, doc.y, pw(), 56).stroke();
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold').text(l.label, 65, doc.y + 8, { width: pw() - 30 });
  doc.fillColor(GOLD).fontSize(8).font('Helvetica').text(l.sub, 65, doc.y + 23, { width: pw() - 30 });
  doc.fillColor('#D1FAE5').fontSize(9).font('Helvetica').text(l.desc, 65, doc.y + 34, { width: pw() - 30 });
  doc.y = doc.y + 62;

  if (layers.indexOf(l) < 2) {
    doc.fillColor(GOLD).fontSize(14).font('Helvetica').text('▼', 50, doc.y, { align: 'center', width: pw() });
    doc.y += 18;
  }
});

doc.moveDown(0.5);
subTitle('How a Request Flows (Example: Reserve a Seat)');
['User fills the "Reserve Seat" form and clicks Submit on the website',
 'React (frontend) sends a POST request to http://localhost:5001/api/bookings',
 'Express (backend) receives the request and validates the data',
 'Backend creates a Booking record in MongoDB',
 'Backend also creates a matching Ticket record (automatically)',
 'Backend sends back a success response with the new booking data',
 'React shows a success message and updates the page',
].forEach((s, i) => {
  doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold').text('Step ' + (i+1) + ': ', 62, doc.y, { continued: true, width: 55 });
  doc.fillColor(DARK).font('Helvetica').text(s);
  doc.moveDown(0.25);
});


// ═══════════════════════════════════════════════════════════════════════════
// 5. DATABASE — WHAT DATA WE STORE
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('5.  Database — What Data We Store');

para('Our MongoDB database (called "cinemadb") has 7 collections. A "collection" in MongoDB is like a table in SQL. Each item in a collection is called a "document" (like a row in SQL). Every collection has a custom ID like CUST-001, TKT-001, etc. to make it easier to read.');

doc.moveDown(0.3);

const colls = [
  {
    name: 'customers — Who is using the app',
    color: BLUE,
    rows: [
      ['customerId', 'CUST-001, CUST-002…', 'Our own readable ID'],
      ['name', 'Text', 'Full name of the user'],
      ['email', 'Text (unique)', 'Email address'],
      ['phone', 'Text', 'Phone number'],
      ['address', 'Text', 'Home address'],
      ['memberSince', 'Date', 'When they joined'],
    ]
  },
  {
    name: 'theaters — Where movies are shown',
    color: '#8B5CF6',
    rows: [
      ['theaterId', 'THR-001…', 'Readable ID'],
      ['name', 'Text', 'Theater name (e.g., PVR IMAX)'],
      ['location', 'Text', 'City and area'],
      ['totalSeats', 'Number', 'Total seats in the hall'],
      ['facilities', 'List of Text', 'E.g., Dolby, 4K Screen, Recliner'],
    ]
  },
  {
    name: 'shows — The movie screenings',
    color: GREEN,
    rows: [
      ['showId', 'SHW-001…', 'Readable ID'],
      ['movieTitle', 'Text', 'Name of the movie'],
      ['theater', 'Reference → Theater', 'Which theater is showing it'],
      ['showTime', 'Date & Time', 'When the show starts'],
      ['ticketPrice', 'Number (₹)', 'Base ticket price'],
      ['genre', 'Text', 'Action, Drama, Horror, etc.'],
      ['language', 'Text', 'Hindi, Tamil, English, etc.'],
      ['availableSeats', 'Number', 'How many seats are left'],
      ['rating', 'Text', 'U / UA / A certification'],
    ]
  },
  {
    name: 'bookings — Seat reservations',
    color: GOLD,
    rows: [
      ['bookingId', 'BKG-001…', 'Readable ID'],
      ['customer', 'Reference → Customer', 'Who made this booking'],
      ['show', 'Reference → Show', 'Which show was booked'],
      ['seatNumber', 'Text', 'Specific seat (e.g., A-12)'],
      ['bookingDate', 'Date', 'When they booked it'],
      ['status', 'Text', 'confirmed / cancelled / pending'],
      ['totalAmount', 'Number (₹)', 'How much they paid'],
    ]
  },
  {
    name: 'tickets — Actual movie tickets',
    color: RED,
    rows: [
      ['ticketId', 'TKT-001…', 'Readable ID'],
      ['customer', 'Reference → Customer', 'Ticket owner'],
      ['show', 'Reference → Show', 'Show for this ticket'],
      ['booking', 'Reference → Booking', 'Linked reservation (auto-set)'],
      ['seatNumber', 'Text', 'Seat assigned'],
      ['purchaseDate', 'Date', 'When the ticket was bought'],
      ['price', 'Number (₹)', 'Final price after coupon discount'],
      ['couponApplied', 'Text', 'Coupon code used (if any)'],
      ['discountAmount', 'Number (₹)', 'How much discount was applied'],
      ['snacks', 'Reference → Snack', 'Linked snack order (if any)'],
    ]
  },
  {
    name: 'snacks — Food and drink orders',
    color: '#F97316',
    rows: [
      ['snackId', 'SNK-001…', 'Readable ID'],
      ['customer', 'Reference → Customer', 'Who ordered'],
      ['items', 'List of {name, qty, price}', 'Items in the order'],
      ['totalPrice', 'Number (₹)', 'Total food bill'],
      ['orderDate', 'Date', 'When the order was placed'],
    ]
  },
  {
    name: 'coupons — Discount codes',
    color: '#06B6D4',
    rows: [
      ['couponId', 'CPN-001…', 'Readable ID'],
      ['code', 'Text', 'The coupon code (e.g., FIRST50)'],
      ['discountType', 'Text', '"percentage" or "flat"'],
      ['discountValue', 'Number', 'How much discount (% or ₹)'],
      ['minPurchase', 'Number (₹)', 'Minimum order needed to use it'],
      ['maxDiscount', 'Number (₹)', 'Maximum discount allowed'],
      ['validUntil', 'Date', 'Expiry date'],
      ['isActive', 'True/False', 'Is it still usable?'],
    ]
  }
];

colls.forEach(col => {
  if (doc.y > 620) doc.addPage();
  doc.moveDown(0.4);
  fillRect(50, doc.y, pw(), 24, col.color + 'CC');
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold').text(col.name, 60, doc.y + 6);
  doc.moveDown(0.15);
  tblRow(['Field Name', 'Data Type / Example', 'What it means'], [110, 150, pw() - 260], true, '#374151');
  col.rows.forEach((r, i) => tblRow(r, [110, 150, pw() - 260], false, i % 2 === 0 ? LIGHT : WHITE));
  doc.moveDown(0.4);
});


// ═══════════════════════════════════════════════════════════════════════════
// 6. HOW TABLES ARE RELATED
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('6.  How Tables are Related (Relationships)');

para('In our database, the 7 collections are connected to each other. Think of it like a web — if you pull one thread, it connects to others. In MongoDB, we use "references" (storing the ID of another document) to create these connections. The table below shows all the relationships:');
doc.moveDown(0.3);

tblRow(['Collection A', 'Collection B', 'Relationship', 'Meaning in simple words'], [90, 90, 75, pw() - 255], true, DARK);
[
  ['Customer', 'Booking', 'One to Many', 'One person can make many reservations'],
  ['Customer', 'Ticket', 'One to Many', 'One person can have many tickets'],
  ['Booking', 'Ticket', 'One to One', 'Every reservation has exactly one ticket (they are always in sync)'],
  ['Show', 'Booking', 'One to Many', 'One movie show can have many reservations (up to seat limit)'],
  ['Show', 'Ticket', 'One to Many', 'One show can have many tickets bought for it'],
  ['Theater', 'Show', 'One to Many', 'One theater can screen many different movies'],
  ['Ticket', 'Snack', 'One to One', 'A ticket can optionally have one snack order linked to it'],
  ['Ticket', 'Coupon', 'Many to One', 'Many tickets can use the same coupon code'],
].forEach((r, i) => tblRow(r, [90, 90, 75, pw() - 255], false, i % 2 === 0 ? LIGHT : WHITE));

doc.moveDown(1);
subTitle('Important: How we handle this in MongoDB');
para('SQL databases have built-in "Foreign Key" rules that automatically reject invalid references. MongoDB does NOT have this by default. So we handle it ourselves in the backend code:');
point('When a booking is deleted, our code also deletes the matching ticket');
point('When a ticket is deleted, our code also deletes the matching booking');
point('When data is fetched, our code checks for "orphan" records and fixes them automatically');
point('Before creating a new ticket, we check if one already exists (to avoid duplicates)');


// ═══════════════════════════════════════════════════════════════════════════
// 7. FEATURES
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('7.  Features of CineVerse');

const features = [
  { num: '01', title: 'Browse Shows', icon: '🎬', route: '/shows',
    what: 'Shows all available movies with their time, price, theater, language and genre. You can filter by genre or language.',
    how: 'Frontend calls GET /api/shows. The backend fetches all shows from MongoDB and also fills in the theater name (using .populate()).' },
  { num: '02', title: 'Reserve a Seat', icon: '💺', route: '/bookings/new',
    what: 'User picks a show and enters a seat number to reserve it. A reservation (Booking) is saved in the database.',
    how: 'Frontend sends POST /api/bookings. Backend saves the booking AND automatically creates a matching ticket. Available seat count on the show is reduced by 1.' },
  { num: '03', title: 'My Reservations', icon: '📋', route: '/bookings',
    what: 'Shows all the reservations made by the current user. User can click to see details or delete a reservation.',
    how: 'GET /api/bookings?customerId=... fetches only this user\'s bookings. Deleting also removes the linked ticket automatically.' },
  { num: '04', title: 'My Tickets', icon: '🎫', route: '/tickets',
    what: 'Shows all tickets the user has. Tickets are always in sync with reservations — they always show the same data.',
    how: 'GET /api/tickets?customerId=... fetches only this user\'s tickets. Deleting also removes the linked booking.' },
  { num: '05', title: 'Buy a Ticket Directly', icon: '🎟️', route: '/tickets/new',
    what: 'User can also buy a ticket directly (without first going to "Reserve Seat"). Optional snack selection is shown too.',
    how: 'POST /api/tickets. Backend creates the ticket AND a matching booking automatically.' },
  { num: '06', title: 'Snack Bar', icon: '🍿', route: '/snacks',
    what: 'User can browse cinema snack items (popcorn, drinks, nachos, etc.) and place an order. Orders are linked to tickets.',
    how: 'GET /api/snacks shows the menu. POST /api/snacks saves the order to MongoDB under the user\'s account.' },
  { num: '07', title: 'Deals & Offers (Coupons)', icon: '🏷️', route: '/coupons',
    what: 'All active discount coupons are shown as voucher cards. User can copy a coupon code with one click.',
    how: 'GET /api/coupons fetches all active coupons from the DB. The coupon is applied on the ticket detail page.' },
  { num: '08', title: 'Apply Coupon on Ticket', icon: '💰', route: '/tickets/:id',
    what: 'On the ticket detail page, user can type in a coupon code. The discount is calculated and the final price is updated.',
    how: 'POST /api/tickets/:id/coupon validates the coupon, calculates discount, and updates the ticket\'s price in MongoDB.' },
  { num: '09', title: 'My Profile', icon: '👤', route: '/profile',
    what: 'Shows the user\'s personal info (name, email, phone, address) and a summary of their activity.',
    how: 'Loads from UserContext which fetches the first customer from GET /api/customers. No login required.' },
];

features.forEach(f => {
  if (doc.y > 610) doc.addPage();
  fillRect(50, doc.y, pw(), 24, DARK);
  doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold').text(f.num + '.  ' + f.title + '  ' + f.icon, 60, doc.y + 7, { continued: true });
  doc.fillColor(GRAY).fontSize(9).font('Helvetica').text('  →  ' + f.route);
  doc.moveDown(0.2);
  doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('What it does: ', 62, doc.y, { continued: true, width: 80 });
  doc.fillColor(DARK).font('Helvetica').text(f.what);
  doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold').text('How it works: ', 62, doc.y, { continued: true, width: 80 });
  doc.fillColor(DARK).font('Helvetica').text(f.how);
  doc.moveDown(0.5);
});


// ═══════════════════════════════════════════════════════════════════════════
// 8. SYNC LOGIC
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('8.  How Reservations and Tickets Stay in Sync');

para('This was the most important and tricky part of the project. Every booking (reservation) should always have exactly one ticket — and every ticket should always have exactly one booking. They must always match. Here is exactly how we did it:');

doc.moveDown(0.3);
subTitle('When you CREATE a Reservation:');
fillRect(50, doc.y, pw(), 110, '#F0FFF4');
doc.strokeColor(GREEN).lineWidth(1).rect(50, doc.y, pw(), 110).stroke();
const c1y = doc.y + 8;
['1. User fills the "Reserve Seat" form and submits it',
 '2. Frontend sends: POST /api/bookings  (only one request — no double calls)',
 '3. Backend saves the Booking in MongoDB',
 '4. Backend checks: "Does a ticket already exist for this show + seat + user?"',
 '5. If NO → Backend creates a new Ticket automatically',
 '6. If YES → Backend skips (to avoid creating 2 tickets)',
 '7. Available seats on the Show are reduced by 1',
].forEach((s, i) => {
  doc.fillColor(i === 0 ? DARK : (i === 4 ? GREEN : DARK)).fontSize(9.5).font(i===0?'Helvetica-Bold':'Helvetica').text(s, 62, c1y + i * 14);
});
doc.y = c1y + 110;
doc.moveDown(0.5);

subTitle('When you DELETE a Reservation:');
fillRect(50, doc.y, pw(), 96, '#FFF1F2');
doc.strokeColor(RED).lineWidth(1).rect(50, doc.y, pw(), 96).stroke();
const c2y = doc.y + 8;
['1. User clicks "Delete" on a reservation',
 '2. Frontend sends: DELETE /api/bookings/:id',
 '3. Backend finds the Booking in MongoDB',
 '4. Backend finds ALL Tickets for this show + seat + user and deletes them',
 '5. Backend then deletes the Booking itself',
 '6. Available seats on the Show are increased by 1 (seat is freed)',
].forEach((s, i) => {
  doc.fillColor(DARK).fontSize(9.5).font('Helvetica').text(s, 62, c2y + i * 14);
});
doc.y = c2y + 100;
doc.moveDown(0.5);

subTitle('Same thing works in reverse (when you delete a Ticket):');
para('If the user deletes from "My Tickets" instead, the same logic runs in the opposite direction — the matching Booking is also deleted. Both pages always stay in sync no matter which one you use.');

subTitle('Auto-Fix (Auto-Heal):');
para('Every time you open "My Reservations" or "My Tickets", the backend does a quick check in the background:');
point('If a ticket exists but its matching booking is missing → booking is created automatically');
point('If a booking exists but its matching ticket is missing → ticket is created automatically');
para('This makes sure the data is always consistent, even if something went wrong before.');


// ═══════════════════════════════════════════════════════════════════════════
// 9. API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('9.  All API Endpoints (Backend Routes)');

para('An "API endpoint" is basically a URL on the backend server that does something when you call it. The frontend calls these URLs to get or send data. Here are all the routes we built:');
doc.moveDown(0.3);

const methodColor = { GET: GREEN, POST: BLUE, PUT: '#8B5CF6', DELETE: RED };

const apis = [
  ['GET',    '/api/customers',            'Get the list of all customers'],
  ['GET',    '/api/customers/:id',         'Get one customer by their ID'],
  ['GET',    '/api/shows',                'Get all movie shows (with theater name filled in)'],
  ['GET',    '/api/shows/:id',            'Get details of one specific show'],
  ['POST',   '/api/shows',               'Add a new show to the database'],
  ['PUT',    '/api/shows/:id',            'Update show info (e.g., change price)'],
  ['DELETE', '/api/shows/:id',            'Delete a show'],
  ['GET',    '/api/theaters',             'Get all theaters'],
  ['GET',    '/api/theaters/:id',         'Get one theater\'s details'],
  ['GET',    '/api/bookings',             'Get all bookings for this user (also auto-fixes orphans)'],
  ['GET',    '/api/bookings/:id',         'Get one specific booking'],
  ['POST',   '/api/bookings',            'Create a booking → also auto-creates a ticket'],
  ['PUT',    '/api/bookings/:id',         'Update booking status'],
  ['DELETE', '/api/bookings/:id',         'Delete booking → also deletes the matching ticket'],
  ['GET',    '/api/tickets',              'Get all tickets for this user (also auto-fixes orphans)'],
  ['GET',    '/api/tickets/:id',          'Get one specific ticket'],
  ['POST',   '/api/tickets',             'Create a ticket → also auto-creates a booking'],
  ['PUT',    '/api/tickets/:id',          'Update ticket info'],
  ['DELETE', '/api/tickets/:id',          'Delete ticket → also deletes the matching booking'],
  ['POST',   '/api/tickets/:id/coupon',  'Apply a coupon code to a ticket'],
  ['DELETE', '/api/tickets/:id/coupon',  'Remove a coupon from a ticket'],
  ['GET',    '/api/snacks',               'Get this user\'s snack orders'],
  ['GET',    '/api/snacks/:id',           'Get one snack order'],
  ['POST',   '/api/snacks',              'Place a new snack order'],
  ['DELETE', '/api/snacks/:id',           'Cancel a snack order'],
  ['GET',    '/api/coupons',              'Get all active coupon codes'],
  ['GET',    '/api/coupons/:code',        'Check if a coupon code is valid'],
];

tblRow(['Method', 'URL', 'What it does'], [65, 195, pw() - 260], true, DARK);
apis.forEach((api, i) => {
  const rowH = 20, sx = 50, sy = doc.y;
  const bg = i % 2 === 0 ? LIGHT : WHITE;
  fillRect(sx, sy, pw(), rowH, bg);
  fillRect(sx, sy, 60, rowH, (methodColor[api[0]] || DARK) + '25');
  doc.fillColor(methodColor[api[0]] || DARK).fontSize(8.5).font('Helvetica-Bold').text(api[0], sx + 4, sy + 6, { width: 56 });
  doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(api[1], sx + 65, sy + 6, { width: 189 });
  doc.fillColor(GRAY).fontSize(8.5).font('Helvetica').text(api[2], sx + 260, sy + 6, { width: pw() - 260 });
  doc.strokeColor('#D1D5DB').lineWidth(0.3).rect(sx, sy, pw(), rowH).stroke();
  doc.y = sy + rowH;
  if (doc.y > 720) { doc.addPage(); doc.y = 50; }
});


// ═══════════════════════════════════════════════════════════════════════════
// 10. ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('10.  All Pages in the App');

para('The React frontend has 14 pages. Every page is a separate React component. React Router decides which page to show based on the URL in the browser.');
doc.moveDown(0.3);

tblRow(['URL Route', 'Page Name', 'What the user can do here'], [110, 125, pw() - 235], true, DARK);
[
  ['/', 'Home / Landing', 'Welcomes the user, shows featured movies and highlights'],
  ['/shows', 'Browse Shows', 'See all movies, filter by genre & language, click to view details'],
  ['/shows/:id', 'Show Details', 'See full info about one movie show'],
  ['/bookings', 'My Reservations', 'See all seat reservations, delete them'],
  ['/bookings/new', 'Reserve a Seat', 'Fill a form to reserve a seat for a show'],
  ['/bookings/:id', 'Reservation Details', 'View details of one specific reservation'],
  ['/tickets', 'My Tickets', 'See all tickets, delete them'],
  ['/tickets/new', 'Buy a Ticket', 'Buy a ticket directly (with optional snacks)'],
  ['/tickets/:id', 'Ticket Details', 'View ticket, apply coupon, see snack order'],
  ['/snacks', 'Snack Bar', 'Browse snack menu and see your orders'],
  ['/snacks/new', 'Order Snacks', 'Place a new snack order'],
  ['/snacks/:id', 'Snack Order Details', 'View details of a snack order'],
  ['/coupons', 'Deals & Offers', 'See all coupons, copy codes with one click'],
  ['/profile', 'My Profile', 'See your name, contact info, and activity summary'],
].forEach((r, i) => tblRow(r, [110, 125, pw() - 235], false, i % 2 === 0 ? LIGHT : WHITE));


// ═══════════════════════════════════════════════════════════════════════════
// 11. PRIVACY
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('11.  How We Keep User Data Private');

para('Even though this is a simple project with only one user, we still built proper privacy checks into every part of the system. This shows good coding practice and is important if the app ever has multiple users.');

doc.moveDown(0.3);

const privacyPoints = [
  ['Single Locked User', 'The app always loads the first customer from the database and uses that as the current user. There is no login page or user switching. This keeps things simple for the demo.'],
  ['Ownership Check on Detail Pages', 'When you visit a Booking, Ticket, or Snack detail page, the backend checks if the item belongs to the current user. If it does not, you get an "Access Denied" message. This means even if you manually type another booking\'s URL, you cannot see it.'],
  ['List Filtering by User', 'The booking, ticket, and snack lists only show records that belong to the current user. The backend filters using: customer = currentUserId.'],
  ['No Other Users\' Data Shown', 'The home page does not show total ticket counts, revenue, or any data that could reveal other users\' activity.'],
  ['String Comparison Fix', 'MongoDB IDs are objects (ObjectId type). When comparing them, you have to convert both sides to strings first. We use String(id) everywhere to avoid bugs where the IDs look equal but fail the check.'],
  ['Redirect from /customers', 'If someone navigates to the /customers page (which would show all users), they are automatically redirected to /profile instead.'],
];

privacyPoints.forEach(([title, desc]) => {
  fillRect(50, doc.y, pw(), 14, DARK);
  doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold').text('  ' + title, 52, doc.y + 2);
  doc.moveDown(0.15);
  para(desc);
  doc.moveDown(0.2);
});


// ═══════════════════════════════════════════════════════════════════════════
// 12. HOW TO RUN
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('12.  How to Run this Project');

subTitle('Requirements (install these first if not already done)');
point('Node.js (version 18 or above) — download from nodejs.org');
point('MongoDB — running locally on your computer (port 27017)');
point('npm — comes with Node.js automatically');

doc.moveDown(0.5);
subTitle('Step 1: Seed (fill) the Database with Sample Data');
para('Run this once to add movies, shows, tickets, coupons etc. into MongoDB:');
fillRect(50, doc.y, pw(), 46, '#111827');
doc.strokeColor(GREEN).lineWidth(1).rect(50, doc.y, pw(), 46).stroke();
doc.fillColor('#86EFAC').fontSize(8.5).font('Courier').text('cd /path/to/cinema-db/server', 62, doc.y + 8);
doc.fillColor('#86EFAC').fontSize(8.5).font('Courier').text('node src/seed.js', 62, doc.y + 0);
doc.fillColor(GRAY).fontSize(8).font('Courier').text('# This creates all sample data (1 user, 10 shows, 7 tickets, 5 coupons…)', 62, doc.y + 0);
doc.moveDown(3);

doc.moveDown(0.5);
subTitle('Step 2: Start the Backend Server');
fillRect(50, doc.y, pw(), 36, '#111827');
doc.strokeColor(GREEN).lineWidth(1).rect(50, doc.y, pw(), 36).stroke();
doc.fillColor('#86EFAC').fontSize(8.5).font('Courier').text('cd /path/to/cinema-db/server', 62, doc.y + 8);
doc.fillColor('#86EFAC').fontSize(8.5).font('Courier').text('node src/index.js', 62, doc.y + 0);
doc.moveDown(2.5);
para('You should see: "Cinema DB Backend Server Running on Port: 5001" and "MongoDB Successfully connected"');
para('Note: We use port 5001 because on Mac, port 5000 is reserved by the operating system.');

doc.moveDown(0.5);
subTitle('Step 3: Start the Frontend (React App)');
para('Open a NEW terminal window for this:');
fillRect(50, doc.y, pw(), 36, '#111827');
doc.strokeColor(BLUE).lineWidth(1).rect(50, doc.y, pw(), 36).stroke();
doc.fillColor('#93C5FD').fontSize(8.5).font('Courier').text('cd /path/to/cinema-db/client', 62, doc.y + 8);
doc.fillColor('#93C5FD').fontSize(8.5).font('Courier').text('npm run dev', 62, doc.y + 0);
doc.moveDown(2.5);

doc.moveDown(0.5);
subTitle('Step 4: Open the App');
fillRect(50, doc.y, pw(), 30, GOLD + '33');
doc.strokeColor(GOLD).lineWidth(1.5).rect(50, doc.y, pw(), 30).stroke();
doc.fillColor(GOLD).fontSize(15).font('Helvetica-Bold')
   .text('http://localhost:5173', 50, doc.y + 8, { align: 'center', width: pw() });
doc.moveDown(2);
para('Open the above URL in any web browser (Chrome, Firefox, Edge). The CineVerse app will load automatically with Arjun Sharma logged in.');


// ═══════════════════════════════════════════════════════════════════════════
// 13. SAMPLE DATA
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('13.  Sample Data in the Database');

subTitle('The One User (Locked)');
tblRow(['Field', 'Value'], [140, pw() - 140], true, DARK);
[['Customer ID','CUST-001'],['Name','Arjun Sharma'],['Email','arjun.sharma@email.com'],['Phone','9876543210'],['Address','Koramangala, Bengaluru'],['Member Since','January 2023']].forEach((r, i) => tblRow(r, [140, pw() - 140], false, i % 2 === 0 ? LIGHT : WHITE));

doc.moveDown(1);
subTitle('5 Sample Theaters');
tblRow(['Theater ID', 'Name', 'City'], [80, 160, pw() - 240], true, DARK);
[['THR-001','PVR IMAX','Bengaluru'],['THR-002','INOX Cinemas','Mumbai'],['THR-003','Cinepolis','Hyderabad'],['THR-004','PVR Phoenix','Delhi'],['THR-005','SPI Sathyam','Chennai']].forEach((r, i) => tblRow(r, [80, 160, pw() - 240], false, i % 2 === 0 ? LIGHT : WHITE));

doc.moveDown(1);
subTitle('Sample Movie Shows');
tblRow(['Show ID', 'Movie', 'Price', 'Language', 'Seats Left'], [65, 140, 60, 80, 80], true, DARK);
[['SHW-001','Kalki 2898 AD','₹550','Telugu','180'],['SHW-002','Stree 2','₹320','Hindi','95'],['SHW-003','Animal','₹280','Hindi','220'],['SHW-004','Jawan','₹450','Hindi','50'],['SHW-005','Leo','₹380','Tamil','130']].forEach((r, i) => tblRow(r, [65, 140, 60, 80, 80], false, i % 2 === 0 ? LIGHT : WHITE));

doc.moveDown(1);
subTitle('Sample Coupons');
tblRow(['Code', 'Type', 'Discount', 'Min. Purchase', 'Works until'], [80, 90, 70, 100, 100], true, DARK);
[['FIRST50','Percentage','50% off','₹200','31 Dec 2025'],['WEEKEND20','Percentage','20% off','₹300','31 Dec 2025'],['FLAT100','Flat','₹100 off','₹400','31 Mar 2026'],['SNACK30','Percentage','30% off','₹150','28 Feb 2026'],['IMAX200','Flat','₹200 off','₹500','30 Nov 2025']].forEach((r, i) => tblRow(r, [80, 90, 70, 100, 100], false, i % 2 === 0 ? LIGHT : WHITE));


// ═══════════════════════════════════════════════════════════════════════════
// 14. CONCLUSION
// ═══════════════════════════════════════════════════════════════════════════
sectionTitle('14.  What We Learned / Conclusion');

para('CineVerse is a complete, working full-stack web application that covers all the topics taught in a DBMS course — designing a database, writing queries, connecting tables (or collections), and making sure data stays correct at all times.');

doc.moveDown(0.4);
subTitle('What we learned from building this project:');
[
  'How to design a database with multiple collections and connect them using references',
  'How to use MongoDB and Mongoose to store and query real data',
  'How to write backend API routes using Node.js and Express',
  'How to connect a React frontend to a backend API using Axios',
  'How to handle data integrity without SQL foreign keys — using code-level logic',
  'How "cascading delete" works — deleting one record automatically deletes related records',
  'How to build a real-world feature (like seat reservation) end-to-end from database to UI',
  'How to protect user data using ownership checks in API routes',
].forEach(b => point(b));

doc.moveDown(0.5);
subTitle('Challenges we faced:');
[
  ['Duplicate Ticket Bug', 'At first, the frontend was calling "create ticket" AND the backend was also creating one automatically — so 2 tickets appeared per booking. Fixed by removing the frontend call and letting only the backend handle it.'],
  ['Port 5000 Conflict on Mac', 'macOS uses port 5000 for its own services. We had to change our backend port to 5001.'],
  ['MongoDB ID Comparison', 'MongoDB ObjectIds are objects, not strings. Comparing them with === was giving wrong results. Fixed using String() conversion on both sides.'],
  ['Keeping Sync on Both Sides', 'Making sure deleting from "My Tickets" also deleted from "My Reservations" (and the other way around) required careful backend logic on both delete routes.'],
].forEach(([title, desc]) => {
  doc.fillColor(RED).fontSize(10).font('Helvetica-Bold').text('❌ Problem: ' + title, 62, doc.y);
  doc.moveDown(0.1);
  doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold').text('✅ Fix: ', 75, doc.y, { continued: true, width: 45 });
  doc.fillColor(DARK).font('Helvetica').text(desc);
  doc.moveDown(0.4);
});

doc.moveDown(0.5);
// Final banner
fillRect(50, doc.y, pw(), 65, DARK);
doc.strokeColor(GOLD).lineWidth(2).rect(50, doc.y, pw(), 65).stroke();
doc.fillColor(GOLD).fontSize(16).font('Helvetica-Bold')
   .text('CineVerse — Your Seat. Your Story.', 50, doc.y + 12, { align: 'center', width: pw() });
doc.fillColor(GRAY).fontSize(10).font('Helvetica')
   .text('MongoDB  ·  Express.js  ·  React 18  ·  Node.js  ·  Vite', 50, doc.y + 35, { align: 'center', width: pw() });
doc.fillColor('#4B5563').fontSize(9).font('Helvetica')
   .text('DBMS Mini Project  |  3rd Semester  |  2nd Year Engineering', 50, doc.y + 50, { align: 'center', width: pw() });

// ── Page Numbers ─────────────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  if (i === 0) continue; // skip cover
  hline(doc.page.height - 35, GOLD, 0.5);
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text('CineVerse Project Report  |  3rd Semester DBMS  |  Page ' + (i + 1),
       50, doc.page.height - 28, { align: 'center', width: pw() });
}

doc.end();
console.log('PDF saved to:', outputPath);
