const express = require('express');
const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const PotentialMatch = require('../models/PotentialMatch');
const { requireAuth } = require('../middleware/auth');
const { getOwnerId, itemView } = require('../utils/itemView');

const router = express.Router();
const ACTIVE_CLAIM_STATUSES = ['requested', 'approved', 'returned'];

function claimView(claim, userId) {
  const claimantId = claim.claimant && claim.claimant._id
    ? String(claim.claimant._id)
    : String(claim.claimant);
  const finderId = claim.finder && claim.finder._id
    ? String(claim.finder._id)
    : String(claim.finder);
  const isClaimant = claimantId === userId;
  const role = isClaimant ? 'claimant' : 'finder';

  return {
    id: String(claim._id),
    status: claim.status,
    verificationDetails: claim.verificationDetails,
    reviewNote: claim.reviewNote || '',
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
    reviewedAt: claim.reviewedAt,
    returnedAt: claim.returnedAt,
    role,
    claimantName: claim.claimant && claim.claimant.name ? claim.claimant.name : 'Campus user',
    finderName: claim.finder && claim.finder.name ? claim.finder.name : 'Campus user',
    lostItem: claim.lostItem ? itemView(claim.lostItem) : null,
    foundItem: claim.foundItem ? itemView(claim.foundItem) : null,
    match: claim.match
      ? {
          id: String(claim.match._id || claim.match),
          score: claim.match.score,
          attributes: claim.match.attributes || [],
        }
      : null,
    canApprove: role === 'finder' && claim.status === 'requested',
    canReject: role === 'finder' && claim.status === 'requested',
    canReturn: role === 'finder' && claim.status === 'approved',
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const claims = await Claim.find({
      $or: [{ claimant: req.user._id }, { finder: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('lostItem')
      .populate('foundItem')
      .populate('match')
      .populate('claimant', 'name')
      .populate('finder', 'name')
      .lean();

    return res.json({
      count: claims.length,
      claims: claims.map((claim) => claimView(claim, String(req.user._id))),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const verificationDetails = typeof body.verificationDetails === 'string'
      ? body.verificationDetails.trim()
      : '';

    if (!mongoose.isValidObjectId(body.matchId)) {
      return res.status(400).json({ error: 'A valid match is required.' });
    }

    if (verificationDetails.length < 10 || verificationDetails.length > 1000) {
      return res.status(400).json({
        error: 'Private identifying details must be between 10 and 1,000 characters.',
      });
    }

    const match = await PotentialMatch.findById(body.matchId)
      .populate('lostItem')
      .populate('foundItem');

    if (!match || !match.lostItem || !match.foundItem) {
      return res.status(404).json({ error: 'Potential match not found.' });
    }

    const claimantId = getOwnerId(match.lostItem);
    const finderId = getOwnerId(match.foundItem);

    if (claimantId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the owner of the lost report can request this claim.' });
    }

    if (finderId === claimantId) {
      return res.status(409).json({ error: 'This match cannot be claimed.' });
    }

    if (match.lostItem.status !== 'open' || match.foundItem.status !== 'open') {
      return res.status(409).json({ error: 'One of these reports is no longer open for claims.' });
    }

    const activeClaimForFoundItem = await Claim.exists({
      foundItem: match.foundItem._id,
      status: { $in: ACTIVE_CLAIM_STATUSES },
    });

    if (activeClaimForFoundItem) {
      return res.status(409).json({ error: 'An active claim already exists for this found item.' });
    }

    const activeClaimForLostItem = await Claim.exists({
      lostItem: match.lostItem._id,
      status: { $in: ACTIVE_CLAIM_STATUSES },
    });

    if (activeClaimForLostItem) {
      return res.status(409).json({
        error: 'You already have an active claim for this lost report. Finish or resolve that claim first.',
      });
    }

    const claim = await Claim.create({
      match: match._id,
      lostItem: match.lostItem._id,
      foundItem: match.foundItem._id,
      claimant: req.user._id,
      finder: finderId,
      verificationDetails,
    });

    return res.status(201).json({
      claim: {
        id: String(claim._id),
        status: claim.status,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Please correct the claim details.',
        details: Object.values(error.errors).map((detail) => detail.message),
      });
    }
    return next(error);
  }
});

router.patch('/:id/approve', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid claim id.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (String(claim.finder) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the finder can review this claim.' });
    }

    if (claim.status !== 'requested') {
      return res.status(409).json({ error: 'This claim has already been reviewed.' });
    }

    const foundItem = await Item.findById(claim.foundItem);
    if (!foundItem || foundItem.status !== 'open') {
      return res.status(409).json({ error: 'The found item is no longer open for this claim.' });
    }

    claim.status = 'approved';
    claim.reviewedAt = new Date();
    await claim.save();

    await Item.updateMany(
      { _id: { $in: [claim.lostItem, claim.foundItem] }, status: { $ne: 'returned' } },
      { $set: { status: 'claimed' } }
    );

    return res.json({ claim: { id: String(claim._id), status: claim.status } });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/reject', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid claim id.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (String(claim.finder) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the finder can review this claim.' });
    }

    if (claim.status !== 'requested') {
      return res.status(409).json({ error: 'This claim has already been reviewed.' });
    }

    const body = req.body || {};
    const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote.trim() : '';

    claim.status = 'rejected';
    claim.reviewedAt = new Date();
    claim.reviewNote = reviewNote.slice(0, 500);
    await claim.save();

    return res.json({ claim: { id: String(claim._id), status: claim.status } });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/return', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid claim id.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (String(claim.finder) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the finder can mark this item as returned.' });
    }

    if (claim.status !== 'approved') {
      return res.status(409).json({ error: 'Only an approved claim can be marked as returned.' });
    }

    claim.status = 'returned';
    claim.returnedAt = new Date();
    await claim.save();

    await Item.updateMany(
      { _id: { $in: [claim.lostItem, claim.foundItem] } },
      { $set: { status: 'returned' } }
    );

    return res.json({ claim: { id: String(claim._id), status: claim.status } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
