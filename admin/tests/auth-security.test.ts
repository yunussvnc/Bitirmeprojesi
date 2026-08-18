import assert from 'node:assert/strict';
import test from 'node:test';

import { getSafeRedirectPath } from '../lib/safe-redirect.ts';

test('allows known admin routes and their query strings', () => {
  assert.equal(getSafeRedirectPath('/users?page=2'), '/users?page=2');
  assert.equal(getSafeRedirectPath('/venues/42'), '/venues/42');
});

test('rejects external, protocol-relative and script redirects', () => {
  assert.equal(getSafeRedirectPath('https://evil.example'), '/');
  assert.equal(getSafeRedirectPath('//evil.example'), '/');
  assert.equal(getSafeRedirectPath('javascript:alert(1)'), '/');
});

test('rejects unknown internal routes and backslash confusion', () => {
  assert.equal(getSafeRedirectPath('/unknown'), '/');
  assert.equal(getSafeRedirectPath('/users\\evil'), '/');
});
