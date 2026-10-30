const express = require('express');
const Item = require('../models/Item');
const PotentialMatch = require('../models/PotentialMatch');
const Claim = require('../models/Claim');
const { requireAuth } = require('../middleware/auth');
const { getOwnerId, itemView } = require('../utils/itemView');

const router = express.Router();
const ACTIVE_CLAIM_STATUSES = ['requested', 'approved', 'returned'];

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const myItemIds = await Item.find({ owner: req.user._id }).distinct('_id');
    if (!myItemIds.length) {
      return res.json({ count: 0, matches: [] });
    }

    const matches = await PotentialMatch.find({
      $or: [{ lostItem: { $in: myItemIds } }, { foundItem: { $in: myItemIds } }],
    })
      .sort({ score: -1, createdAt: -1 })
      .limit(100)
      .populate('lostItem')
      .populate('foundItem')
      .lean();

    const matchIds = matches.map((match) => match._id);
    const claims = matchIds.length
      ? await Claim.find({ match: { $in: matchIds } })
          .select('match lostItem foundItem claimant finder status createdAt reviewedAt returnedAt')
          .sort({ createdAt: -1, _id: -1 })
          .lean()
      : [];

    const latestClaimByMatch = new Map();
    const activeClaimByFoundItem = new Set();
    const activeClaimByLostItem = new Set();

    for (const claim of claims) {
      const matchKey = String(claim.match);
      if (!latestClaimByMatch.has(matchKey)) {
        latestClaimByMatch.set(matchKey, claim);
      }
      if (ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
        activeClaimByFoundItem.add(String(claim.foundItem));
        activeClaimByLostItem.add(String(claim.lostItem));
      }
    }

    const userId = String(req.user._id);
    const results = [];

    for (const match of matches) {
      if (!match.lostItem || !match.foundItem) continue;

      const lostOwnerId = getOwnerId(match.lostItem);
      const foundOwnerId = getOwnerId(match.foundItem);
      const isLostOwner = lostOwnerId === userId;
      const isFoundOwner = foundOwnerId === userId;

      if (!isLostOwner && !isFoundOwner) continue;

      const latestClaim = latestClaimByMatch.get(String(match._id)) || null;
      const foundItemHasActiveClaim = activeClaimByFoundItem.has(String(match.foundItem._id));
      const lostItemHasActiveClaim = activeClaimByLostItem.has(String(match.lostItem._id));
      const canClaim = isLostOwner
        && match.lostItem.status === 'open'
        && match.foundItem.status === 'open'
        && !foundItemHasActiveClaim
        && !lostItemHasActiveClaim;
      const canReview = isFoundOwner && latestClaim && latestClaim.status === 'requested';

      results.push({
        id: String(match._id),
        score: match.score,
        attributes: match.attributes || [],
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        role: isLostOwner ? 'lostOwner' : 'foundOwner',
        lostItem: itemView(match.lostItem),
        foundItem: itemView(match.foundItem),
        claim: latestClaim
          ? {
              id: String(latestClaim._id),
              status: latestClaim.status,
              createdAt: latestClaim.createdAt,
              reviewedAt: latestClaim.reviewedAt,
              returnedAt: latestClaim.returnedAt,
            }
          : null,
        activeClaimOnFoundItem: foundItemHasActiveClaim,
        activeClaimOnLostItem: lostItemHasActiveClaim,
        canClaim,
        canReview,
      });
    }

    return res.json({ count: results.length, matches: results });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
