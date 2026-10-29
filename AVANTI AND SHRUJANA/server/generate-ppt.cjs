const PptxGenJS = require('pptxgenjs');
const path = require('path');

const prs = new PptxGenJS();
prs.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

// ── Theme Colors ───────────────────────────────────────────────────────────
const GOLD   = 'F59E0B';
const DARK   = '1F2937';
const DARKER = '111827';
const GRAY   = '9CA3AF';
const WHITE  = 'FFFFFF';
const GREEN  = '10B981';
const BLUE   = '3B82F6';
const RED    = 'EF4444';
const PURPLE = '8B5CF6';

// ── Helpers ────────────────────────────────────────────────────────────────
function darkSlide(slide) {
  slide.background = { color: DARKER };
}

function addTitle(slide, text, y = 0.3, size = 36, color = GOLD) {
  slide.addText(text, {
    x: 0.4, y, w: 12.5, h: 0.7,
    fontSize: size, bold: true, color,
    fontFace: 'Arial'
  });
}

function addSubTitle(slide, text, y = 1.1, size = 16, color = GRAY) {
  slide.addText(text, {
    x: 0.4, y, w: 12.5, h: 0.4,
    fontSize: size, color, fontFace: 'Arial'
  });
}

function goldLine(slide, y = 1.05) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0.4, y, w: 12.5, h: 0.04, fill: { color: GOLD }
  });
}

function sectionBadge(slide, text, x, y, w = 2.5, h = 0.4, bg = GOLD, fg = DARK) {
  slide.addShape(prs.ShapeType.rect, { x, y, w, h, fill: { color: bg }, line: { color: bg } });
  slide.addText(text, { x, y, w, h, fontSize: 12, bold: true, color: fg, align: 'center', fontFace: 'Arial' });
}

function card(slide, x, y, w, h, bg = '1F2937', border = GOLD) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: bg },
    line: { color: border, pt: 1.5 }
  });
}

function cardText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.size || 12,
    bold: opts.bold || false,
    color: opts.color || WHITE,
    align: opts.align || 'left',
    valign: opts.valign || 'middle',
    fontFace: 'Arial',
    wrap: true,
    ...opts
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);

  // Gold top bar
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: GOLD } });
  // Gold bottom bar
  s.addShape(prs.ShapeType.rect, { x: 0, y: 7.32, w: 13.33, h: 0.18, fill: { color: GOLD } });

  // Big title
  s.addText('CineVerse', {
    x: 0, y: 1.5, w: 13.33, h: 1.6,
    fontSize: 72, bold: true, color: GOLD,
    align: 'center', fontFace: 'Arial'
  });

  s.addText('Cinema Booking System', {
    x: 0, y: 3.2, w: 13.33, h: 0.6,
    fontSize: 26, color: WHITE, align: 'center', fontFace: 'Arial'
  });

  s.addText('DBMS Mini Project  ·  3rd Semester  ·  2nd Year Engineering', {
    x: 0, y: 3.9, w: 13.33, h: 0.4,
    fontSize: 14, color: GRAY, align: 'center', fontFace: 'Arial'
  });

  // 3 tech pills
  const pills = [['MongoDB', GREEN], ['Node.js + Express', BLUE], ['React + Vite', PURPLE]];
  pills.forEach(([label, color], i) => {
    const x = 3.2 + i * 2.4;
    s.addShape(prs.ShapeType.rect, { x, y: 5.0, w: 2.1, h: 0.48, fill: { color }, line: { color } });
    s.addText(label, { x, y: 5.0, w: 2.1, h: 0.48, fontSize: 13, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  });

  s.addText('Your Seat. Your Story.', {
    x: 0, y: 6.0, w: 13.33, h: 0.4,
    fontSize: 15, color: GOLD, align: 'center', italic: true, fontFace: 'Arial'
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — TABLE OF CONTENTS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, 'What We Will Cover', 0.3, 30);
  goldLine(s, 1.1);

  const items = [
    ['01', 'What is CineVerse?'],
    ['02', 'Problem it Solves'],
    ['03', 'Tools & Technologies'],
    ['04', 'How the System Works'],
    ['05', 'Database Design (7 Collections)'],
    ['06', 'How Data is Connected'],
    ['07', 'Key Features'],
    ['08', 'Booking ↔ Ticket Sync Logic'],
    ['09', 'All API Endpoints'],
    ['10', 'Challenges & How We Fixed Them'],
  ];

  items.forEach(([num, title], i) => {
    const col = i < 5 ? 0 : 1;
    const row = i % 5;
    const x = 0.4 + col * 6.5;
    const y = 1.3 + row * 1.0;
    card(s, x, y, 6.0, 0.75, '1F2937', GOLD);
    s.addText(num, { x: x + 0.1, y, w: 0.6, h: 0.75, fontSize: 18, bold: true, color: GOLD, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText(title, { x: x + 0.75, y, w: 5.1, h: 0.75, fontSize: 13, color: WHITE, valign: 'middle', fontFace: 'Arial' });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — WHAT IS CINEVERSE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '01  What is CineVerse?');
  goldLine(s);

  s.addText(
    'CineVerse is an online cinema booking web app — similar to BookMyShow — built as a DBMS mini project. It lets a user browse movies, reserve seats, buy tickets, order snacks, and use discount coupons from a single website.',
    { x: 0.4, y: 1.2, w: 7.8, h: 1.2, fontSize: 13, color: WHITE, fontFace: 'Arial', wrap: true }
  );

  // 4 stat cards
  const stats = [['7', 'DB Collections'], ['14', 'Web Pages'], ['40+', 'API Routes'], ['1', 'Demo User']];
  stats.forEach(([val, label], i) => {
    const x = 0.4 + i * 3.1;
    card(s, x, 2.6, 2.8, 1.5);
    s.addText(val, { x, y: 2.7, w: 2.8, h: 0.8, fontSize: 36, bold: true, color: GOLD, align: 'center', fontFace: 'Arial' });
    s.addText(label, { x, y: 3.45, w: 2.8, h: 0.4, fontSize: 12, color: GRAY, align: 'center', fontFace: 'Arial' });
  });

  s.addText('Two parts of the project:', { x: 0.4, y: 4.35, w: 12.5, h: 0.35, fontSize: 13, bold: true, color: GOLD, fontFace: 'Arial' });

  const parts = [
    ['🖥️  Backend', 'Node.js + Express + MongoDB\nStores and manages all data', BLUE],
    ['🌐  Frontend', 'React 18 + Vite\nThe website the user sees and interacts with', GREEN],
  ];
  parts.forEach(([title, desc, color], i) => {
    const x = 0.4 + i * 6.3;
    card(s, x, 4.75, 5.9, 1.5, '1F2937', color);
    s.addText(title, { x: x + 0.15, y: 4.85, w: 5.6, h: 0.45, fontSize: 14, bold: true, color, fontFace: 'Arial' });
    s.addText(desc, { x: x + 0.15, y: 5.3, w: 5.6, h: 0.85, fontSize: 12, color: GRAY, fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — PROBLEM IT SOLVES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '02  Problem it Solves');
  goldLine(s);

  const problems = [
    ['Double Booking', 'Two people accidentally book the same seat', 'We check before confirming — duplicate seats blocked'],
    ['Lost Tickets', 'Tickets get lost or forgotten', 'All tickets saved in MongoDB, viewable anytime'],
    ['Out of Sync Records', 'Reservation exists but no ticket (or vice versa)', 'Every booking auto-creates a ticket. They always match.'],
    ['No Privacy', 'Users see each other\'s data', 'Ownership checks ensure you only see your own records'],
    ['Manual Discounts', 'Calculating coupon discount by hand', 'Coupons applied automatically; backend calculates final price'],
  ];

  problems.forEach(([prob, bad, good], i) => {
    const y = 1.25 + i * 1.1;
    card(s, 0.4, y, 12.5, 0.9, '1F2937', RED);
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 0.08, h: 0.9, fill: { color: RED } });
    s.addText('❌ ' + prob, { x: 0.6, y: y + 0.05, w: 2.8, h: 0.38, fontSize: 12, bold: true, color: RED, fontFace: 'Arial' });
    s.addText(bad, { x: 0.6, y: y + 0.45, w: 2.8, h: 0.35, fontSize: 10, color: GRAY, fontFace: 'Arial' });
    s.addShape(prs.ShapeType.rect, { x: 3.55, y: y + 0.2, w: 0.04, h: 0.5, fill: { color: GOLD } });
    s.addText('✅ Fix: ' + good, { x: 3.75, y: y + 0.2, w: 9.0, h: 0.5, fontSize: 12, color: GREEN, fontFace: 'Arial', valign: 'middle' });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — TOOLS & TECHNOLOGIES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '03  Tools & Technologies Used');
  goldLine(s);

  const tools = [
    { name: 'MongoDB', role: 'Database', desc: 'Stores all data as documents (like JSON). 7 collections.', color: GREEN },
    { name: 'Mongoose', role: 'ODM Library', desc: 'Defines schema structure and connects Node.js to MongoDB.', color: GREEN },
    { name: 'Node.js', role: 'Backend Runtime', desc: 'Runs JavaScript code on the server side.', color: BLUE },
    { name: 'Express.js', role: 'API Framework', desc: 'Creates routes like /api/tickets, /api/bookings etc.', color: BLUE },
    { name: 'React 18', role: 'Frontend UI', desc: 'Builds all the web pages and components the user sees.', color: PURPLE },
    { name: 'Vite', role: 'Build Tool', desc: 'Fast local server for React during development.', color: PURPLE },
    { name: 'Axios', role: 'HTTP Client', desc: 'Sends requests from React to the backend API.', color: GOLD },
    { name: 'Tailwind CSS', role: 'Styling', desc: 'Gives the dark theme, gold colors and card layouts.', color: GOLD },
  ];

  tools.forEach((t, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.4 + col * 3.15;
    const y = 1.3 + row * 2.6;
    card(s, x, y, 2.9, 2.3, '1F2937', t.color);
    s.addShape(prs.ShapeType.rect, { x, y, w: 2.9, h: 0.5, fill: { color: t.color }, line: { color: t.color } });
    s.addText(t.name, { x, y, w: 2.9, h: 0.5, fontSize: 14, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText(t.role, { x: x + 0.1, y: y + 0.55, w: 2.7, h: 0.35, fontSize: 10, bold: true, color: t.color, fontFace: 'Arial' });
    s.addText(t.desc, { x: x + 0.1, y: y + 0.9, w: 2.7, h: 1.2, fontSize: 10, color: GRAY, fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — SYSTEM ARCHITECTURE
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '04  How the System Works');
  goldLine(s);

  const layers = [
    { label: 'Layer 1: User opens Browser', url: 'http://localhost:5173', desc: 'Sees the React website — clicks buttons, fills forms', color: BLUE },
    { label: 'Layer 2: React Frontend sends a Request', url: 'Axios → POST /api/bookings', desc: 'Sends data to the Express backend over HTTP', color: PURPLE },
    { label: 'Layer 3: Express Backend processes it', url: 'http://localhost:5001', desc: 'Validates data, runs business logic, talks to MongoDB', color: GOLD },
    { label: 'Layer 4: MongoDB stores/returns Data', url: 'mongodb://localhost:27017/cinemadb', desc: '7 collections — customers, shows, tickets, bookings, etc.', color: GREEN },
  ];

  layers.forEach((l, i) => {
    const y = 1.3 + i * 1.35;
    card(s, 0.4, y, 8.2, 1.1, '1F2937', l.color);
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 0.12, h: 1.1, fill: { color: l.color } });
    s.addText(l.label, { x: 0.65, y: y + 0.08, w: 7.8, h: 0.4, fontSize: 13, bold: true, color: l.color, fontFace: 'Arial' });
    s.addText(l.url, { x: 0.65, y: y + 0.45, w: 7.8, h: 0.28, fontSize: 10, color: GOLD, fontFace: 'Courier New' });
    s.addText(l.desc, { x: 0.65, y: y + 0.72, w: 7.8, h: 0.28, fontSize: 10, color: GRAY, fontFace: 'Arial' });
    if (i < 3) {
      s.addText('▼', { x: 4.0, y: y + 1.15, w: 0.6, h: 0.18, fontSize: 12, color: GOLD, align: 'center', fontFace: 'Arial' });
    }
  });

  // Right side — example flow
  card(s, 9.0, 1.3, 4.0, 5.5, '111827', GOLD);
  s.addText('Example: Reserve a Seat', { x: 9.1, y: 1.4, w: 3.8, h: 0.4, fontSize: 12, bold: true, color: GOLD, fontFace: 'Arial', align: 'center' });
  const steps = ['1. User fills form', '2. React sends POST request', '3. Backend creates Booking', '4. Backend auto-creates Ticket', '5. Seat count reduced by 1', '6. Success shown on screen'];
  steps.forEach((step, i) => {
    s.addText(step, { x: 9.1, y: 1.9 + i * 0.75, w: 3.8, h: 0.6, fontSize: 11, color: i === 3 ? GREEN : WHITE, fontFace: 'Arial' });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 7 — DATABASE DESIGN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '05  Database Design — 7 Collections');
  goldLine(s);

  s.addText('A "collection" in MongoDB is like a table in SQL. Each item is called a "document" (like a row).', {
    x: 0.4, y: 1.15, w: 12.5, h: 0.35, fontSize: 12, color: GRAY, fontFace: 'Arial'
  });

  const colls = [
    { name: 'customers', id: 'CUST-001', fields: 'name, email, phone, address, memberSince', color: BLUE },
    { name: 'theaters', id: 'THR-001', fields: 'name, location, totalSeats, facilities', color: PURPLE },
    { name: 'shows', id: 'SHW-001', fields: 'movieTitle, theater, showTime, ticketPrice, genre, language, availableSeats', color: GREEN },
    { name: 'bookings', id: 'BKG-001', fields: 'customer, show, seatNumber, bookingDate, status, totalAmount', color: GOLD },
    { name: 'tickets', id: 'TKT-001', fields: 'customer, show, booking, seatNumber, price, couponApplied, snacks', color: RED },
    { name: 'snacks', id: 'SNK-001', fields: 'customer, items[ ], totalPrice, orderDate', color: 'F97316' },
    { name: 'coupons', id: 'CPN-001', fields: 'code, discountType, discountValue, minPurchase, maxDiscount, validUntil', color: '06B6D4' },
  ];

  colls.forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.4 + col * 3.15;
    const y = 1.65 + row * 2.55;
    if (i === 6) { // last card centered in second row
    }
    card(s, x, y, 2.9, 2.25, '1F2937', c.color);
    s.addShape(prs.ShapeType.rect, { x, y, w: 2.9, h: 0.45, fill: { color: c.color }, line: { color: c.color } });
    s.addText(c.name, { x, y, w: 2.9, h: 0.45, fontSize: 13, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText('ID: ' + c.id + '…', { x: x + 0.1, y: y + 0.5, w: 2.7, h: 0.3, fontSize: 9, color: c.color, fontFace: 'Courier New' });
    s.addText(c.fields, { x: x + 0.1, y: y + 0.82, w: 2.7, h: 1.3, fontSize: 9, color: GRAY, fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 8 — HOW DATA IS CONNECTED
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '06  How Data is Connected (Relationships)');
  goldLine(s);

  s.addText('MongoDB does not have foreign keys like SQL. We store the ID of related documents inside each other (called "references") and use .populate() to fill in the data when needed.', {
    x: 0.4, y: 1.15, w: 12.5, h: 0.5, fontSize: 12, color: GRAY, fontFace: 'Arial', wrap: true
  });

  const rels = [
    ['Customer', 'Booking', '1 → Many', 'One person can have many reservations', GREEN],
    ['Customer', 'Ticket', '1 → Many', 'One person can have many tickets', GREEN],
    ['Booking', 'Ticket', '1 ↔ 1', 'Every reservation has exactly one ticket — always in sync!', GOLD],
    ['Theater', 'Show', '1 → Many', 'One theater can screen many different movies', BLUE],
    ['Show', 'Booking', '1 → Many', 'One show can have many seat reservations', BLUE],
    ['Ticket', 'Snack', '1 → 1', 'A ticket can optionally have one snack order', 'F97316'],
    ['Ticket', 'Coupon', 'Many → 1', 'Many tickets can use the same coupon code', PURPLE],
  ];

  // Header row
  s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.8, w: 12.5, h: 0.38, fill: { color: DARK } });
  ['From', 'To', 'Type', 'What it means'].forEach((h, i) => {
    const widths = [1.8, 1.8, 1.5, 7.0];
    const xs = [0.5, 2.3, 4.1, 5.6];
    s.addText(h, { x: xs[i], y: 1.85, w: widths[i], h: 0.28, fontSize: 11, bold: true, color: WHITE, fontFace: 'Arial' });
  });

  rels.forEach(([from, to, type, meaning, color], i) => {
    const y = 2.2 + i * 0.65;
    const bg = i % 2 === 0 ? '1F2937' : '111827';
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.58, fill: { color: bg } });
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 0.07, h: 0.58, fill: { color } });
    s.addText(from, { x: 0.55, y, w: 1.7, h: 0.58, fontSize: 11, bold: true, color, valign: 'middle', fontFace: 'Arial' });
    s.addText(to, { x: 2.3, y, w: 1.7, h: 0.58, fontSize: 11, color: WHITE, valign: 'middle', fontFace: 'Arial' });
    s.addText(type, { x: 4.1, y, w: 1.4, h: 0.58, fontSize: 11, bold: true, color: GOLD, valign: 'middle', fontFace: 'Arial' });
    s.addText(meaning, { x: 5.6, y, w: 7.2, h: 0.58, fontSize: 11, color: GRAY, valign: 'middle', fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 9 — KEY FEATURES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '07  Key Features of CineVerse');
  goldLine(s);

  const features = [
    { icon: '🎬', title: 'Browse Shows', desc: 'See all movies with genre & language filters. View theater, time, price and seats left.', color: BLUE },
    { icon: '💺', title: 'Reserve a Seat', desc: 'Pick a show, enter seat number. Booking + Ticket both created automatically.', color: GREEN },
    { icon: '🎫', title: 'My Tickets', desc: 'All tickets in one place. Always in sync with reservations. Delete one → deletes both.', color: GOLD },
    { icon: '🍿', title: 'Snack Bar', desc: 'Order popcorn, drinks, nachos. Orders are saved in DB and linked to your ticket.', color: 'F97316' },
    { icon: '🏷️', title: 'Deals & Offers', desc: 'View active discount coupons. One-click to copy the code. Apply on ticket detail page.', color: PURPLE },
    { icon: '💰', title: 'Apply Coupon', desc: 'Enter coupon code on ticket page. Backend validates and calculates final discounted price.', color: RED },
    { icon: '👤', title: 'My Profile', desc: 'See your name, email, phone and activity summary. Single fixed user — no login needed.', color: '06B6D4' },
    { icon: '🔒', title: 'Privacy Guard', desc: 'You can only see your own bookings, tickets and snack orders. Access denied otherwise.', color: GRAY },
  ];

  features.forEach((f, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.4 + col * 3.15;
    const y = 1.3 + row * 2.7;
    card(s, x, y, 2.9, 2.45, '1F2937', f.color);
    s.addText(f.icon, { x, y: y + 0.1, w: 2.9, h: 0.65, fontSize: 28, align: 'center', fontFace: 'Arial' });
    s.addText(f.title, { x: x + 0.1, y: y + 0.75, w: 2.7, h: 0.4, fontSize: 13, bold: true, color: f.color, fontFace: 'Arial' });
    s.addText(f.desc, { x: x + 0.1, y: y + 1.15, w: 2.7, h: 1.15, fontSize: 10, color: GRAY, fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 10 — SYNC LOGIC
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '08  Booking ↔ Ticket Sync Logic');
  goldLine(s);

  s.addText('The most important part of this project — Bookings and Tickets must ALWAYS match each other.', {
    x: 0.4, y: 1.15, w: 12.5, h: 0.35, fontSize: 12, color: GRAY, fontFace: 'Arial'
  });

  // Create flow
  card(s, 0.4, 1.6, 5.9, 2.5, '064E3B', GREEN);
  s.addText('When you CREATE a Reservation', { x: 0.5, y: 1.65, w: 5.7, h: 0.4, fontSize: 13, bold: true, color: GREEN, fontFace: 'Arial' });
  ['1. User submits "Reserve Seat" form',
   '2. React sends → POST /api/bookings (once only)',
   '3. Backend saves Booking in MongoDB',
   '4. Backend checks: does a Ticket already exist?',
   '5. NO → Auto-creates matching Ticket',
   '6. Show\'s available seats reduced by 1',
  ].forEach((step, i) => {
    s.addText((i === 4 ? '✅ ' : '   ') + step, {
      x: 0.55, y: 2.08 + i * 0.33, w: 5.6, h: 0.3,
      fontSize: 10.5, color: i === 4 ? GREEN : WHITE, fontFace: 'Arial'
    });
  });

  // Delete flow
  card(s, 6.6, 1.6, 5.9, 2.5, '450A0A', RED);
  s.addText('When you DELETE a Reservation', { x: 6.7, y: 1.65, w: 5.7, h: 0.4, fontSize: 13, bold: true, color: RED, fontFace: 'Arial' });
  ['1. User clicks "Delete" on a reservation',
   '2. React sends → DELETE /api/bookings/:id',
   '3. Backend finds all matching Tickets',
   '4. Deletes ALL matching Tickets first',
   '5. Then deletes the Booking itself',
   '6. Show\'s available seats increased by 1',
  ].forEach((step, i) => {
    s.addText((i === 3 ? '🗑️ ' : '   ') + step, {
      x: 6.75, y: 2.08 + i * 0.33, w: 5.6, h: 0.3,
      fontSize: 10.5, color: i === 3 ? RED : WHITE, fontFace: 'Arial'
    });
  });

  // Auto-heal box
  card(s, 0.4, 4.25, 12.1, 1.4, '1E3A5F', BLUE);
  s.addText('🔄  Auto-Fix (Auto-Heal) — runs every time you open "My Reservations" or "My Tickets"', {
    x: 0.55, y: 4.32, w: 11.8, h: 0.42, fontSize: 12, bold: true, color: BLUE, fontFace: 'Arial'
  });
  s.addText('If a Ticket exists but its Booking is missing → Booking is created automatically\nIf a Booking exists but its Ticket is missing → Ticket is created automatically', {
    x: 0.55, y: 4.75, w: 11.8, h: 0.8, fontSize: 11, color: WHITE, fontFace: 'Arial', wrap: true
  });

  // Same in reverse
  card(s, 0.4, 5.75, 12.1, 0.9, '1F2937', GOLD);
  s.addText('Works in BOTH directions — deleting from "My Tickets" also deletes the matching Booking, and vice versa.', {
    x: 0.55, y: 5.82, w: 11.8, h: 0.76, fontSize: 12, color: GOLD, valign: 'middle', fontFace: 'Arial', wrap: true
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 11 — API ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '09  API Endpoints (Backend Routes)');
  goldLine(s);

  s.addText('An API endpoint is a URL on the backend that does something when called. The React frontend calls these to get or send data.', {
    x: 0.4, y: 1.15, w: 12.5, h: 0.35, fontSize: 12, color: GRAY, fontFace: 'Arial'
  });

  // Method legend
  [['GET', GREEN], ['POST', BLUE], ['PUT', PURPLE], ['DELETE', RED]].forEach(([m, c], i) => {
    s.addShape(prs.ShapeType.rect, { x: 0.4 + i * 1.5, y: 1.6, w: 1.2, h: 0.32, fill: { color: c } });
    s.addText(m, { x: 0.4 + i * 1.5, y: 1.6, w: 1.2, h: 0.32, fontSize: 11, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
  s.addText('= Read data     = Create new data     = Update data     = Delete data', {
    x: 6.6, y: 1.62, w: 6.1, h: 0.3, fontSize: 10, color: GRAY, fontFace: 'Arial'
  });

  const endpoints = [
    ['GET', '/api/shows', 'Fetch all movie shows (with theater name)'],
    ['GET', '/api/bookings', 'Get all reservations for this user'],
    ['POST', '/api/bookings', 'Create a reservation → also auto-creates a ticket'],
    ['DELETE', '/api/bookings/:id', 'Delete reservation → also deletes matching ticket'],
    ['GET', '/api/tickets', 'Get all tickets for this user'],
    ['POST', '/api/tickets', 'Buy a ticket → also auto-creates a booking'],
    ['DELETE', '/api/tickets/:id', 'Delete ticket → also deletes matching booking'],
    ['POST', '/api/tickets/:id/coupon', 'Apply a coupon code to a ticket'],
    ['DELETE', '/api/tickets/:id/coupon', 'Remove coupon from a ticket'],
    ['GET', '/api/snacks', 'Get all snack orders for this user'],
    ['POST', '/api/snacks', 'Place a new snack order'],
    ['GET', '/api/coupons', 'Get all active discount coupons'],
  ];

  const mColor = { GET: GREEN, POST: BLUE, PUT: PURPLE, DELETE: RED };
  // Header
  s.addShape(prs.ShapeType.rect, { x: 0.4, y: 2.05, w: 12.5, h: 0.33, fill: { color: DARK } });
  s.addText('Method', { x: 0.5, y: 2.1, w: 1.2, h: 0.23, fontSize: 10, bold: true, color: WHITE, fontFace: 'Arial' });
  s.addText('Endpoint URL', { x: 1.75, y: 2.1, w: 3.8, h: 0.23, fontSize: 10, bold: true, color: WHITE, fontFace: 'Arial' });
  s.addText('What it does', { x: 5.65, y: 2.1, w: 7.1, h: 0.23, fontSize: 10, bold: true, color: WHITE, fontFace: 'Arial' });

  endpoints.forEach(([method, url, desc], i) => {
    const y = 2.4 + i * 0.41;
    const bg = i % 2 === 0 ? '1F2937' : '111827';
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.38, fill: { color: bg } });
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 1.25, h: 0.38, fill: { color: mColor[method] + '30' } });
    s.addText(method, { x: 0.43, y, w: 1.2, h: 0.38, fontSize: 10, bold: true, color: mColor[method], valign: 'middle', fontFace: 'Arial' });
    s.addText(url, { x: 1.72, y, w: 3.85, h: 0.38, fontSize: 9.5, color: GOLD, valign: 'middle', fontFace: 'Courier New' });
    s.addText(desc, { x: 5.65, y, w: 7.1, h: 0.38, fontSize: 10, color: GRAY, valign: 'middle', fontFace: 'Arial' });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 12 — CHALLENGES
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, '10  Challenges & How We Fixed Them');
  goldLine(s);

  const challenges = [
    {
      prob: 'Duplicate Ticket Bug',
      bad: 'When reserving a seat, 2 tickets appeared instead of 1.',
      root: 'The frontend was calling "create ticket" AND the backend was also auto-creating one — so 2 tickets per booking.',
      fix: 'Removed the frontend\'s extra call. Only the backend creates the ticket now. Frontend just sends one request.',
      color: RED,
    },
    {
      prob: 'Port 5000 Conflict on Mac',
      bad: 'Backend refused to start — port already in use.',
      root: 'macOS uses port 5000 for its own AirPlay Receiver service (Control Center).',
      fix: 'Changed backend port to 5001 in all config files. Added a clear note in the code explaining why.',
      color: GOLD,
    },
    {
      prob: 'MongoDB ID Comparison Bug',
      bad: 'Privacy guard was letting wrong users see other users\' tickets.',
      root: 'MongoDB IDs are ObjectId objects. Comparing them with === to a string always returns false — even if the values are same.',
      fix: 'Used String(id) on both sides of every comparison so they match correctly.',
      color: BLUE,
    },
    {
      prob: 'Keeping Both Pages in Sync',
      bad: 'Deleting from "My Tickets" didn\'t remove from "My Reservations" (and vice versa).',
      root: 'Each delete route only deleted its own collection, not the linked one.',
      fix: 'Added cascade delete logic to both /api/bookings DELETE and /api/tickets DELETE routes in the backend.',
      color: GREEN,
    },
  ];

  challenges.forEach((c, i) => {
    const y = 1.3 + i * 1.45;
    card(s, 0.4, y, 12.5, 1.3, '1F2937', c.color);
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 0.1, h: 1.3, fill: { color: c.color } });
    s.addText('❌  ' + c.prob, { x: 0.6, y: y + 0.05, w: 5.5, h: 0.38, fontSize: 13, bold: true, color: c.color, fontFace: 'Arial' });
    s.addText('Problem: ' + c.bad, { x: 0.6, y: y + 0.44, w: 5.5, h: 0.35, fontSize: 10, color: GRAY, fontFace: 'Arial', wrap: true });
    s.addShape(prs.ShapeType.rect, { x: 6.2, y: y + 0.1, w: 0.04, h: 1.1, fill: { color: GOLD } });
    s.addText('Root Cause: ' + c.root, { x: 6.35, y: y + 0.05, w: 6.4, h: 0.55, fontSize: 10, color: GRAY, fontFace: 'Arial', wrap: true });
    s.addText('✅  Fix: ' + c.fix, { x: 6.35, y: y + 0.6, w: 6.4, h: 0.6, fontSize: 10.5, color: GREEN, fontFace: 'Arial', wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 13 — HOW TO RUN
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, 'How to Run the Project');
  goldLine(s);

  const steps = [
    { num: '1', title: 'Seed the Database (do this once)', cmd: 'cd cinema-db/server\nnode src/seed.js', desc: 'Fills MongoDB with sample movies, shows, tickets, coupons and one user.' },
    { num: '2', title: 'Start the Backend', cmd: 'cd cinema-db/server\nnode src/index.js', desc: 'Server starts at http://localhost:5001 — you will see "MongoDB connected" in terminal.' },
    { num: '3', title: 'Start the Frontend (new terminal)', cmd: 'cd cinema-db/client\nnpm run dev', desc: 'React app starts. Open http://localhost:5173 in any browser.' },
  ];

  steps.forEach((step, i) => {
    const y = 1.3 + i * 1.9;
    card(s, 0.4, y, 12.5, 1.75, '1F2937', GREEN);
    s.addShape(prs.ShapeType.rect, { x: 0.4, y, w: 0.55, h: 1.75, fill: { color: GREEN } });
    s.addText(step.num, { x: 0.4, y, w: 0.55, h: 1.75, fontSize: 22, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText('Step ' + step.num + ': ' + step.title, { x: 1.1, y: y + 0.1, w: 11.6, h: 0.4, fontSize: 13, bold: true, color: GREEN, fontFace: 'Arial' });
    s.addShape(prs.ShapeType.rect, { x: 1.1, y: y + 0.55, w: 4.5, h: 0.9, fill: { color: '111827' }, line: { color: GREEN } });
    s.addText(step.cmd, { x: 1.2, y: y + 0.58, w: 4.3, h: 0.84, fontSize: 11, color: GREEN, fontFace: 'Courier New', valign: 'middle' });
    s.addText(step.desc, { x: 5.75, y: y + 0.55, w: 6.9, h: 0.9, fontSize: 11, color: GRAY, fontFace: 'Arial', valign: 'middle', wrap: true });
  });

  // URL banner
  s.addShape(prs.ShapeType.rect, { x: 0.4, y: 6.95, w: 12.5, h: 0.45, fill: { color: GOLD } });
  s.addText('Open in browser →  http://localhost:5173', {
    x: 0.4, y: 6.95, w: 12.5, h: 0.45, fontSize: 16, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial'
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 14 — CONCLUSION
// ══════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  darkSlide(s);
  addTitle(s, 'What We Learned');
  goldLine(s);

  const learnings = [
    ['🗄️', 'Database Design', 'How to design multiple collections and connect them using references (like foreign keys in SQL)'],
    ['🔗', 'Data Integrity', 'How to enforce rules (cascade delete, duplicate guard) in code when MongoDB doesn\'t do it automatically'],
    ['🌐', 'REST API', 'How to build backend routes with Express.js that create, read, update and delete data'],
    ['⚛️', 'React Frontend', 'How to build a full UI with React that fetches data from a backend and updates in real time'],
    ['🔒', 'Privacy & Security', 'How to check ownership of records so users can only access their own data'],
    ['🔄', 'Full-Stack Integration', 'How frontend, backend, and database all work together as one complete system'],
  ];

  learnings.forEach((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.3;
    const y = 1.3 + row * 1.8;
    card(s, x, y, 5.9, 1.6, '1F2937', GOLD);
    s.addText(l[0], { x, y: y + 0.15, w: 0.9, h: 1.3, fontSize: 28, align: 'center', valign: 'middle', fontFace: 'Arial' });
    s.addText(l[1], { x: x + 0.95, y: y + 0.15, w: 4.8, h: 0.42, fontSize: 13, bold: true, color: GOLD, fontFace: 'Arial' });
    s.addText(l[2], { x: x + 0.95, y: y + 0.58, w: 4.8, h: 0.9, fontSize: 11, color: GRAY, fontFace: 'Arial', wrap: true });
  });

  // Final banner
  s.addShape(prs.ShapeType.rect, { x: 0, y: 6.8, w: 13.33, h: 0.7, fill: { color: GOLD } });
  s.addText('CineVerse  —  Your Seat. Your Story.  |  MongoDB · Express · React · Node.js · Vite', {
    x: 0, y: 6.8, w: 13.33, h: 0.7, fontSize: 15, bold: true, color: DARK, align: 'center', valign: 'middle', fontFace: 'Arial'
  });
}

// ── Save ──────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'CineVerse_Presentation.pptx');
prs.writeFile({ fileName: outPath }).then(() => {
  console.log('PPT saved to:', outPath);
}).catch(err => {
  console.error('Error:', err);
});
