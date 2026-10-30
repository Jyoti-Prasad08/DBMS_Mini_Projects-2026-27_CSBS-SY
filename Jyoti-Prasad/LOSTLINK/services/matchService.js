const Item = require('../models/Item');
const PotentialMatch = require('../models/PotentialMatch');
const Claim = require('../models/Claim');
const { scorePair, isMeaningfulMatch } = require('../utils/matching');
const { getOwnerId } = require('../utils/itemView');

async function refreshMatchesForItem(item) {
  if (!item) return { saved: 0, removed: 0 };

  const source = typeof item.toObject === 'function' ? item.toObject() : item;
  const ownerId = getOwnerId(source);

  if (!source._id || !ownerId || source.status !== 'open') {
    return { saved: 0, removed: 0 };
  }

  const oppositeType = source.type === 'lost' ? 'found' : 'lost';
  const candidates = await Item.find({
    type: oppositeType,
    status: 'open',
    owner: { $ne: ownerId },
  })
    .limit(200)
    .lean();

  const meaningfulPairs = new Set();
  let saved = 0;

  for (const candidate of candidates) {
    const candidateOwnerId = getOwnerId(candidate);
    if (!candidateOwnerId || candidateOwnerId === ownerId) continue;

    const lostItem = source.type === 'lost' ? source : candidate;
    const foundItem = source.type === 'found' ? source : candidate;
    const result = scorePair(lostItem, foundItem);

    if (!isMeaningfulMatch(result.score, result.attributes)) continue;

    meaningfulPairs.add(`${String(lostItem._id)}:${String(foundItem._id)}`);

    try {
      await PotentialMatch.findOneAndUpdate(
        { lostItem: lostItem._id, foundItem: foundItem._id },
        { $set: { score: result.score, attributes: result.attributes } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
      saved += 1;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  const existingMatches = await PotentialMatch.find({
    $or: [{ lostItem: source._id }, { foundItem: source._id }],
  })
    .select('_id lostItem foundItem')
    .lean();

  const staleIds = existingMatches
    .filter((match) => !meaningfulPairs.has(`${String(match.lostItem)}:${String(match.foundItem)}`))
    .map((match) => match._id);

  let removed = 0;

  if (staleIds.length) {
    const claimedMatchIds = await Claim.find({ match: { $in: staleIds } }).distinct('match');
    const claimed = new Set(claimedMatchIds.map((id) => String(id)));
    const deletable = staleIds.filter((id) => !claimed.has(String(id)));

    if (deletable.length) {
      const result = await PotentialMatch.deleteMany({ _id: { $in: deletable } });
      removed = result.deletedCount || 0;
    }
  }

  return { saved, removed };
}

module.exports = {
  refreshMatchesForItem,
};
