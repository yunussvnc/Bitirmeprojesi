import assert from 'node:assert/strict';
import test from 'node:test';

import { isAllowedAdminPath } from '../lib/bff-path.ts';

test('allows normal admin API paths', () => {
  assert.equal(isAllowedAdminPath(['admin', 'stats']), true);
  assert.equal(isAllowedAdminPath(['admin', 'users', '42', 'role']), true);
});

test('rejects non-admin and incomplete paths', () => {
  assert.equal(isAllowedAdminPath(['auth', 'me']), false);
  assert.equal(isAllowedAdminPath(['admin']), false);
});

test('rejects traversal and path separator confusion', () => {
  assert.equal(isAllowedAdminPath(['admin', '..', 'auth', 'me']), false);
  assert.equal(isAllowedAdminPath(['admin', 'users/42']), false);
  assert.equal(isAllowedAdminPath(['admin', 'users\\42']), false);
});
