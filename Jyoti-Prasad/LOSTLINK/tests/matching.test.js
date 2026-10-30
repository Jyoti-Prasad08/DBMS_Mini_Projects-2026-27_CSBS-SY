const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WEIGHTS,
  MATCH_THRESHOLD,
  normalizeText,
  scorePair,
  isMeaningfulMatch,
} = require('../utils/matching');

function item(overrides) {
  return {
    type: 'lost',
    title: 'Black laptop bag',
    category: 'bag',
    description: 'Black laptop bag with a blue strap and a small sticker.',
    color: 'black',
    brand: 'North Face',
    location: 'Library West',
    dateTime: new Date('2026-01-10T10:00:00.000Z'),
    tags: ['blue strap', 'laptop sleeve'],
    ...overrides,
  };
}

test('weights add up to 100', () => {
  const total = Object.values(WEIGHTS).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 100);
});

test('normalizeText removes case, punctuation, and accents', () => {
  assert.equal(normalizeText('  Café—Blue!!  '), 'cafe blue');
});

test('identical lost and found reports score 100 with every attribute matched', () => {
  const result = scorePair(item(), item({ type: 'found' }));

  assert.equal(result.score, 100);
  assert.equal(result.attributes.length, 7);
  assert.equal(
    result.attributes.filter((attribute) => attribute.points > 0).length,
    7
  );
  assert.equal(isMeaningfulMatch(result.score, result.attributes), true);
});

test('category, location, and color alone reach the meaningful threshold', () => {
  const lost = item({
    dateTime: new Date('2026-01-01T10:00:00.000Z'),
    tags: [],
    description: 'amber bravo charlie',
    brand: '',
  });
  const found = item({
    type: 'found',
    dateTime: new Date('2026-03-01T10:00:00.000Z'),
    tags: [],
    description: 'delta echo foxtrot',
    brand: '',
  });
  const result = scorePair(lost, found);

  assert.equal(result.score, 55);
  assert.ok(result.score >= MATCH_THRESHOLD);
  assert.equal(isMeaningfulMatch(result.score, result.attributes), true);
});

test('date matching gives full points within one day and none after a week', () => {
  const close = scorePair(
    item(),
    item({ type: 'found', dateTime: new Date('2026-01-10T20:00:00.000Z') })
  );
  const far = scorePair(
    item(),
    item({ type: 'found', dateTime: new Date('2026-02-10T10:00:00.000Z') })
  );

  assert.equal(close.attributes.find((attribute) => attribute.field === 'date').points, 15);
  assert.equal(far.attributes.find((attribute) => attribute.field === 'date').points, 0);
});

test('description overlap alone is not a meaningful match', () => {
  const lost = item({
    category: 'electronics',
    color: 'black',
    location: 'Library West',
    brand: 'Apple',
    tags: [],
  });
  const found = item({
    type: 'found',
    category: 'clothing',
    color: 'red',
    location: 'Sports Hall',
    brand: 'Nike',
    tags: [],
    dateTime: new Date('2026-03-01T10:00:00.000Z'),
    description: 'Black laptop bag with a blue strap and a small sticker.',
  });
  const result = scorePair(lost, found);

  assert.equal(result.score, 10);
  assert.equal(isMeaningfulMatch(result.score, result.attributes), false);
});

test('matched attributes include field, weight, points, and detail', () => {
  const result = scorePair(item(), item({ type: 'found' }));
  const category = result.attributes.find((attribute) => attribute.field === 'category');

  assert.deepEqual(
    {
      field: category.field,
      label: category.label,
      weight: category.weight,
      points: category.points,
    },
    { field: 'category', label: 'Category', weight: 20, points: 20 }
  );
  assert.equal(typeof category.detail, 'string');
  assert.ok(category.detail.length > 0);
});
