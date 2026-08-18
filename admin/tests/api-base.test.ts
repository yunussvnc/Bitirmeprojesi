import assert from 'node:assert/strict';
import test from 'node:test';

import { buildApiBaseUrl } from '../lib/api-base.ts';

test('uses the production API origin and appends /api/v1 by default', () => {
  assert.equal(buildApiBaseUrl(), 'https://api.asemos.tr/api/v1');
});

test('appends /api/v1 to a configured origin', () => {
  assert.equal(buildApiBaseUrl('http://localhost:8000'), 'http://localhost:8000/api/v1');
});

test('removes trailing slashes before appending the API version', () => {
  assert.equal(buildApiBaseUrl('https://api.asemos.tr///'), 'https://api.asemos.tr/api/v1');
});

test('does not append /api/v1 twice', () => {
  assert.equal(buildApiBaseUrl('https://api.asemos.tr/api/v1/'), 'https://api.asemos.tr/api/v1');
});
