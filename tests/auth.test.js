import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/utils/auth.js';

test('hashPassword and verifyPassword', async () => {
  const hash = await hashPassword('supersecret');
  const ok = await verifyPassword('supersecret', hash);
  assert.equal(ok, true);
});
