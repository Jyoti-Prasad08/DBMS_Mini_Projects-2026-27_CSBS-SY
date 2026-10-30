const User = require('../models/User');

async function loadUser(req, res, next) {
  if (!req.session || !req.session.userId) return next();

  try {
    const user = await User.findById(req.session.userId).select('name email createdAt');

    if (!user) {
      delete req.session.userId;
      return next();
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  return next();
}

module.exports = {
  loadUser,
  requireAuth,
};
