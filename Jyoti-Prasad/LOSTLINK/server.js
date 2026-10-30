require('dotenv').config({ quiet: true });

const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');
const matchesRouter = require('./routes/matches');
const claimsRouter = require('./routes/claims');
const dashboardRouter = require('./routes/dashboard');
const { loadUser } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and update it.');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('SESSION_SECRET is missing. Add a long random value to .env.');
  process.exit(1);
}

const sessionStore = MongoStore.create({
  mongoUrl: MONGODB_URI,
  collectionName: 'sessions',
  ttl: SESSION_MAX_AGE / 1000,
  autoRemove: 'native',
});

const sessionMiddleware = session({
  name: 'lostlink.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  },
});

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/api', sessionMiddleware, loadUser);

app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed' || (error instanceof SyntaxError && error.status === 400)) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Please correct the submitted details.',
      details: Object.values(error.errors).map((detail) => detail.message),
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'One or more fields have an invalid value.' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Unexpected server error.' });
});

let server;

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');

    server = app.listen(PORT, () => {
      console.log(`LostLink running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Closing LostLink.`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (sessionStore && typeof sessionStore.close === 'function') {
    await sessionStore.close();
  }
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

start();
