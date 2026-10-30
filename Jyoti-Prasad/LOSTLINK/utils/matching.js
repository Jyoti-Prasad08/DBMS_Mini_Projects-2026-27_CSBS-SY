const WEIGHTS = Object.freeze({
  category: 20,
  location: 20,
  color: 15,
  date: 15,
  tags: 15,
  description: 10,
  brand: 5,
});

const MATCH_THRESHOLD = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for',
  'from', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i',
  'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or',
  'our', 'ours', 'she', 'so', 'that', 'the', 'their', 'theirs', 'them',
  'there', 'these', 'they', 'this', 'those', 'to', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'who', 'with', 'you', 'your', 'yours',
]);

function normalizeText(value) {
  return String(value === undefined || value === null ? '' : value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value, options) {
  const settings = options || {};
  const removeStopWords = settings.removeStopWords !== false;
  const minimumLength = Number.isInteger(settings.minimumLength)
    ? settings.minimumLength
    : 3;

  return normalizeText(value)
    .split(' ')
    .filter((token) => {
      if (!token) return false;
      if (removeStopWords && STOP_WORDS.has(token)) return false;
      return token.length >= minimumLength;
    });
}

function uniqueTokens(value, options) {
  return new Set(tokenize(value, options));
}

function jaccardSimilarity(firstSet, secondSet) {
  if (!firstSet.size || !secondSet.size) return 0;

  let shared = 0;
  firstSet.forEach((value) => {
    if (secondSet.has(value)) shared += 1;
  });

  const union = new Set([...firstSet, ...secondSet]).size;
  return union ? shared / union : 0;
}

function textSimilarity(first, second, options) {
  const firstNormalized = normalizeText(first);
  const secondNormalized = normalizeText(second);

  if (!firstNormalized || !secondNormalized) return 0;
  if (firstNormalized === secondNormalized) return 1;

  return jaccardSimilarity(uniqueTokens(first, options), uniqueTokens(second, options));
}

function roundedPoints(value) {
  return Math.round(value * 10) / 10;
}

function datePoints(firstDate, secondDate) {
  const first = new Date(firstDate);
  const second = new Date(secondDate);

  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
    return { points: 0, detail: 'One or both dates are missing.' };
  }

  const differenceDays = Math.abs(second.getTime() - first.getTime()) / DAY_MS;

  if (differenceDays <= 1) {
    return { points: WEIGHTS.date, detail: 'Within one day.' };
  }
  if (differenceDays <= 3) {
    return { points: 10, detail: 'Within three days.' };
  }
  if (differenceDays <= 7) {
    return { points: 5, detail: 'Within one week.' };
  }

  return { points: 0, detail: 'More than one week apart.' };
}

function attribute(field, label, weight, points, detail) {
  return {
    field,
    label,
    weight,
    points: roundedPoints(points),
    detail,
  };
}

function tagDetails(firstTags, secondTags) {
  const first = new Set(
    (Array.isArray(firstTags) ? firstTags : [])
      .map((tag) => normalizeText(tag))
      .filter(Boolean)
  );
  const second = new Set(
    (Array.isArray(secondTags) ? secondTags : [])
      .map((tag) => normalizeText(tag))
      .filter(Boolean)
  );

  if (!first.size || !second.size) {
    return { points: 0, detail: 'No shared tags.' };
  }

  const shared = [...first].filter((tag) => second.has(tag));
  const union = new Set([...first, ...second]).size;
  const points = (shared.length / union) * WEIGHTS.tags;

  return {
    points,
    detail: shared.length
      ? `${shared.length} shared tag${shared.length === 1 ? '' : 's'}: ${shared.slice(0, 5).join(', ')}.`
      : 'No shared tags.',
  };
}

function sharedDescriptionDetail(firstDescription, secondDescription) {
  const first = uniqueTokens(firstDescription);
  const second = uniqueTokens(secondDescription);
  const shared = [...first].filter((token) => second.has(token));

  if (!shared.length) return 'No shared description keywords.';
  return `${shared.length} shared description keyword${shared.length === 1 ? '' : 's'}: ${shared.slice(0, 5).join(', ')}.`;
}

function scorePair(lostItem, foundItem) {
  const categoryPoints = normalizeText(lostItem.category) &&
    normalizeText(lostItem.category) === normalizeText(foundItem.category)
    ? WEIGHTS.category
    : 0;

  const locationSimilarity = textSimilarity(lostItem.location, foundItem.location);
  const locationPoints = locationSimilarity * WEIGHTS.location;

  const colorSimilarity = textSimilarity(lostItem.color, foundItem.color);
  const colorPoints = colorSimilarity * WEIGHTS.color;

  const date = datePoints(lostItem.dateTime, foundItem.dateTime);

  const tags = tagDetails(lostItem.tags, foundItem.tags);

  const descriptionSimilarity = textSimilarity(lostItem.description, foundItem.description);
  const descriptionPoints = descriptionSimilarity * WEIGHTS.description;

  const lostBrand = normalizeText(lostItem.brand);
  const foundBrand = normalizeText(foundItem.brand);
  const brandPoints = lostBrand && foundBrand && lostBrand === foundBrand
    ? WEIGHTS.brand
    : 0;

  const attributes = [
    attribute(
      'category',
      'Category',
      WEIGHTS.category,
      categoryPoints,
      categoryPoints ? 'Same category.' : 'Different or missing category.'
    ),
    attribute(
      'location',
      'Location',
      WEIGHTS.location,
      locationPoints,
      locationPoints ? 'Campus locations overlap.' : 'No location overlap.'
    ),
    attribute(
      'color',
      'Color',
      WEIGHTS.color,
      colorPoints,
      colorPoints ? 'Colors overlap.' : 'No color overlap.'
    ),
    attribute('date', 'Date', WEIGHTS.date, date.points, date.detail),
    attribute('tags', 'Tags', WEIGHTS.tags, tags.points, tags.detail),
    attribute(
      'description',
      'Description',
      WEIGHTS.description,
      descriptionPoints,
      sharedDescriptionDetail(lostItem.description, foundItem.description)
    ),
    attribute(
      'brand',
      'Brand',
      WEIGHTS.brand,
      brandPoints,
      brandPoints ? 'Same brand.' : 'Different or missing brand.'
    ),
  ];

  const score = roundedPoints(
    attributes.reduce((total, current) => total + current.points, 0)
  );

  return { score, attributes };
}

function isMeaningfulMatch(score, attributes) {
  const matchedAttributes = attributes.filter((current) => current.points > 0);
  const hasCoreAttribute = matchedAttributes.some((current) =>
    current.field === 'category' || current.field === 'location' || current.field === 'color'
  );

  return score >= MATCH_THRESHOLD && matchedAttributes.length >= 2 && hasCoreAttribute;
}

module.exports = {
  WEIGHTS,
  MATCH_THRESHOLD,
  normalizeText,
  tokenize,
  textSimilarity,
  datePoints,
  scorePair,
  isMeaningfulMatch,
};
