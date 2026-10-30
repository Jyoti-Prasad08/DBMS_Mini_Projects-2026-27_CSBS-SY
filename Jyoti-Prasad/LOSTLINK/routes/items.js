const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const PotentialMatch = require('../models/PotentialMatch');
const { requireAuth } = require('../middleware/auth');
const { refreshMatchesForItem } = require('../services/matchService');
const { itemView } = require('../utils/itemView');

const router = express.Router();
const ITEM_TYPES = ['lost', 'found'];
const ITEM_STATUSES = ['open', 'claimed', 'returned', 'resolved'];
const EDITABLE_FIELDS = ['title', 'category', 'description', 'color', 'brand', 'location', 'imageUrl'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return source
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 20);
}

function validationDetails(error) {
  if (!error.errors) return [];
  return Object.values(error.errors).map((detail) => detail.message);
}

function invalidDate(value) {
  return value !== undefined && value !== null && value !== ''
    ? Number.isNaN(new Date(value).getTime())
    : false;
}

async function runMatching(item) {
  try {
    await refreshMatchesForItem(item);
  } catch (error) {
    console.error(`Matching failed for item ${item._id}: ${error.message}`);
  }
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!ITEM_TYPES.includes(body.type)) {
      return res.status(400).json({ error: 'Type must be either lost or found.' });
    }

    if (invalidDate(body.dateTime)) {
      return res.status(400).json({ error: 'Date and time must be a valid date.' });
    }

    const item = new Item({
      owner: req.user._id,
      type: body.type,
      title: body.title,
      category: body.category,
      description: body.description,
      color: body.color,
      brand: typeof body.brand === 'string' ? body.brand.trim() : '',
      location: body.location,
      dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
      tags: normalizeTags(body.tags),
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '',
    });

    const savedItem = await item.save();
    await runMatching(savedItem);

    return res.status(201).json({ item: itemView(savedItem) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Please correct the report details.',
        details: validationDetails(error),
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'One or more fields have an invalid value.' });
    }
    return next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      count: items.length,
      items: items.map((item) => itemView(item)),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.type) {
      if (!ITEM_TYPES.includes(req.query.type)) {
        return res.status(400).json({ error: 'Type filter must be either lost or found.' });
      }
      filter.type = req.query.type;
    }

    if (req.query.status) {
      if (!ITEM_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          error: 'Status filter must be open, claimed, returned, or resolved.',
        });
      }
      filter.status = req.query.status;
    }

    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      filter.category = req.query.category.trim().slice(0, 60);
    }

    if (typeof req.query.location === 'string' && req.query.location.trim()) {
      filter.location = new RegExp(escapeRegex(req.query.location.trim().slice(0, 160)), 'i');
    }

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = new RegExp(escapeRegex(req.query.search.trim().slice(0, 120)), 'i');
      filter.$or = [{ title: search }, { description: search }];
    }

    const items = await Item.find(filter)
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      count: items.length,
      items: items.map((item) => itemView(item)),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    const item = await Item.findById(req.params.id).populate('owner', 'name').lean();
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const canManage = Boolean(
      req.user && item.owner && String(item.owner._id) === String(req.user._id)
    );

    return res.json({ item: itemView(item), canManage });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only edit your own reports.' });
    }

    if (item.status !== 'open') {
      return res.status(409).json({ error: 'This report can no longer be edited because it has moved into the claim workflow.' });
    }

    const body = req.body || {};

    if (body.type && body.type !== item.type) {
      return res.status(400).json({ error: 'Report type cannot be changed after the report is created.' });
    }

    if (invalidDate(body.dateTime)) {
      return res.status(400).json({ error: 'Date and time must be a valid date.' });
    }

    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        item[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
      }
    }

    if (body.tags !== undefined) {
      item.tags = normalizeTags(body.tags);
    }

    if (body.dateTime !== undefined) {
      item.dateTime = new Date(body.dateTime);
    }

    await item.save();
    await runMatching(item);

    return res.json({ item: itemView(item), canManage: true });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Please correct the report details.',
        details: validationDetails(error),
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'One or more fields have an invalid value.' });
    }
    return next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own reports.' });
    }

    if (item.status !== 'open') {
      return res.status(409).json({ error: 'This report cannot be deleted because it is already part of a claim.' });
    }

    const hasClaim = await Claim.exists({
      $or: [{ lostItem: item._id }, { foundItem: item._id }],
    });

    if (hasClaim) {
      return res.status(409).json({ error: 'This report cannot be deleted because a claim history exists for it.' });
    }

    await PotentialMatch.deleteMany({
      $or: [{ lostItem: item._id }, { foundItem: item._id }],
    });
    await item.deleteOne();

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
