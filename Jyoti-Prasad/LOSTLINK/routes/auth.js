const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function validateRegistration(body) {
  const details = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 80) {
    details.push('Name must be between 2 and 80 characters.');
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    details.push('Enter a valid email address.');
  }
  if (password.length < 8) {
    details.push('Password must be at least 8 characters.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    details.push('Password must be 72 bytes or fewer.');
  }

  return { name, email, password, details };
}

router.post('/register', async (req, res, next) => {
  try {
    const body = req.body || {};
    const { name, email, password, details } = validateRegistration(body);

    if (details.length) {
      return res.status(400).json({
        error: 'Please correct the account details.',
        details,
      });
    }

    const existing = await User.exists({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash });

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Please correct the account details.',
        details: Object.values(error.errors).map((detail) => detail.message),
      });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (email.length > 254 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    if (req.session) {
      await destroySession(req);
    }

    res.clearCookie('lostlink.sid', { path: '/' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store');

  if (!req.user) {
    return res.status(401).json({ error: 'Not signed in.' });
  }

  return res.json({ user: publicUser(req.user) });
});

module.exports = router;
