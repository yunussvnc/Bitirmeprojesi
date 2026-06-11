import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIntent, detectVenueIntent } from '../intentParser.ts';

test('parseIntent - Americano içeceğim', () => {
  const result = parseIntent('Americano içeceğim');
  assert.equal(result.category, 'cafe');
  assert.deepEqual(result.keywords, ['americano']);
  assert.equal(result.intentScore, 1.0);
});

test('parseIntent - Pizza yemek istiyorum', () => {
  const result = parseIntent('Pizza yemek istiyorum');
  assert.equal(result.category, 'restaurant');
  assert.deepEqual(result.keywords, ['pizza']);
  assert.equal(result.intentScore, 1.0);
});

test('parseIntent - Naber (greeting only)', () => {
  const result = parseIntent('Naber');
  assert.equal(result.category, null);
  assert.deepEqual(result.keywords, []);
  assert.equal(result.intentScore, 0.0);
});

test('parseIntent - Sessiz bir yer (general venue intent)', () => {
  const result = parseIntent('Sessiz bir yer');
  assert.equal(result.category, 'cafe');
  assert.deepEqual(result.keywords, []);
  assert.equal(result.intentScore, 1.0);
});

test('detectVenueIntent - Naber', () => {
  const result = detectVenueIntent('Naber');
  assert.deepEqual(result, { hasIntent: false, confidence: 0 });
});

test('detectVenueIntent - Kahve içmek istiyorum', () => {
  const result = detectVenueIntent('Kahve içmek istiyorum');
  assert.equal(result.hasIntent, true);
  assert.ok(result.confidence > 0.7);
});
