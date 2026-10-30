const express = require('express');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const PotentialMatch = require('../models/PotentialMatch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const userId = req.user._id;
    const [lostReports, foundReports, returnedItems, itemIds] = await Promise.all([
      Item.countDocuments({ owner: userId, type: 'lost' }),
      Item.countDocuments({ owner: userId, type: 'found' }),
      Item.countDocuments({ owner: userId, status: 'returned' }),
      Item.find({ owner: userId }).distinct('_id'),
    ]);

    const [potentialMatches, activeClaims] = await Promise.all([
      itemIds.length
        ? PotentialMatch.countDocuments({
            $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }],
          })
        : 0,
      Claim.countDocuments({
        $or: [{ claimant: userId }, { finder: userId }],
        status: { $in: ['requested', 'approved'] },
      }),
    ]);

    return res.json({
      stats: {
        lostReports,
        foundReports,
        potentialMatches,
        activeClaims,
        returnedItems,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
