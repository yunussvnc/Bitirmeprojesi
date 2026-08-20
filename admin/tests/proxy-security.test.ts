import assert from 'node:assert/strict';
import test from 'node:test';

import { NextRequest } from 'next/server.js';

import { proxy } from '../proxy.ts';

function request(path: string, cookie?: string) {
  return new NextRequest(`https://admin.asemos.tr${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

test('redirects unauthenticated navigation to login with an internal return path', () => {
  const response = proxy(request('/users?page=2'));
  const location = new URL(response.headers.get('location') ?? '');

  assert.equal(location.origin, 'https://admin.asemos.tr');
  assert.equal(location.pathname, '/login');
  assert.equal(location.searchParams.get('redirect'), '/users?page=2');
});

test('allows a refresh-only session to reach the app so the BFF can refresh it', () => {
  const response = proxy(request('/venues', 'asemos_admin_refresh=opaque-refresh-token'));

  assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('treats an access cookie only as a navigation hint and never parses role claims', () => {
  const forgedPayload = Buffer.from(JSON.stringify({ role: 'standard', exp: 1 })).toString('base64url');
  const response = proxy(request('/users', `asemos_admin_access=x.${forgedPayload}.x`));

  assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('redirects an access-cookie session away from the login page', () => {
  const response = proxy(request('/login', 'asemos_admin_access=opaque-access-token'));

  assert.equal(response.headers.get('location'), 'https://admin.asemos.tr/');
});
