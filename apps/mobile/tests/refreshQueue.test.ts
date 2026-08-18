import assert from 'node:assert/strict';
import test from 'node:test';

import {
  pendingTokenRefreshCount,
  rejectTokenRefresh,
  resolveTokenRefresh,
  waitForTokenRefresh,
} from '../src/utils/refreshQueue.ts';

test('resolves every queued request with the refreshed token and clears the queue', async () => {
  const first = waitForTokenRefresh();
  const second = waitForTokenRefresh();

  assert.equal(pendingTokenRefreshCount(), 2);
  resolveTokenRefresh('new-access-token');

  assert.deepEqual(await Promise.all([first, second]), ['new-access-token', 'new-access-token']);
  assert.equal(pendingTokenRefreshCount(), 0);
});

test('rejects every queued request on refresh failure and clears the queue', async () => {
  const first = waitForTokenRefresh();
  const second = waitForTokenRefresh();
  const unauthorized = new Error('Unauthorized');

  assert.equal(pendingTokenRefreshCount(), 2);
  rejectTokenRefresh(unauthorized);

  await assert.rejects(first, /Unauthorized/);
  await assert.rejects(second, /Unauthorized/);
  assert.equal(pendingTokenRefreshCount(), 0);
});
