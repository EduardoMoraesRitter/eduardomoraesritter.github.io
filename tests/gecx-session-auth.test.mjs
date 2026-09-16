import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/gemini-cx-demo/session-auth.js', import.meta.url), 'utf8');
const eventName = 'chat-messenger-access-token-resolved';
const validState = () => ({ accessToken: 'test-only-credential', accessTokenExpiresAt: new Date(Date.now() + 60000).toISOString() });

function harness() {
  let nextTimer = 0;
  const timers = new Map();
  const schedule = kind => callback => {
    const id = ++nextTimer;
    timers.set(id, { kind, callback });
    return id;
  };
  const sandbox = vm.createContext({
    setTimeout: schedule('timeout'), setInterval: schedule('interval'),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id),
  });
  vm.runInContext(source, sandbox, { filename: 'session-auth.js' });
  class Events extends EventTarget {
    listeners = new Set();
    addEventListener(name, listener, options) { this.listeners.add(listener); super.addEventListener(name, listener, options); }
    removeEventListener(name, listener, options) { this.listeners.delete(listener); super.removeEventListener(name, listener, options); }
  }
  const eventTarget = new Events();
  return {
    auth: sandbox.GecxSessionAuth,
    eventTarget,
    tick(kind) { for (const timer of [...timers.values()]) if (timer.kind === kind) timer.callback(); },
    assertClean() { assert.equal(timers.size, 0); assert.equal(eventTarget.listeners.size, 0); },
  };
}

test('restored valid token authorizes immediately without a token-resolved event', async () => {
  const h = harness();
  await h.auth.waitForAuthorization({ readState: validState, eventTarget: h.eventTarget });
  h.assertClean();
});

test('a state update without an event is detected by bounded polling', async () => {
  const h = harness();
  let state = {}, completed = false;
  const promise = h.auth.waitForAuthorization({ readState: () => state, eventTarget: h.eventTarget });
  promise.then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  state = validState();
  h.tick('interval');
  await promise;
  h.assertClean();
});

test('an expired token and stale event cannot authorize a new request', async () => {
  const h = harness();
  let state = { accessToken: 'expired-test-credential', accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString() };
  let completed = false;
  const promise = h.auth.waitForAuthorization({ readState: () => state, eventTarget: h.eventTarget });
  promise.then(() => { completed = true; });
  h.eventTarget.dispatchEvent(new Event(eventName));
  await Promise.resolve();
  assert.equal(completed, false);
  state = validState();
  h.eventTarget.dispatchEvent(new Event(eventName));
  await promise;
  h.assertClean();
});

test('new session resets before checking the previous valid authorization', async () => {
  const h = harness();
  let state = validState(), resets = 0, completed = false;
  const promise = h.auth.waitForAuthorization({
    readState: () => state, eventTarget: h.eventTarget,
    reset: () => { resets++; state = {}; },
  });
  promise.then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(resets, 1);
  assert.equal(completed, false);
  state = validState();
  h.eventTarget.dispatchEvent(new Event(eventName));
  await promise;
  h.assertClean();
});

test('an authorization event emitted synchronously during reset is not missed', async () => {
  const h = harness();
  let state = {};
  await h.auth.waitForAuthorization({
    readState: () => state, eventTarget: h.eventTarget,
    reset: () => { state = validState(); h.eventTarget.dispatchEvent(new Event(eventName)); },
  });
  h.assertClean();
});

test('missing authorization has its own timeout and does not retain timers or listeners', async () => {
  const h = harness();
  const promise = h.auth.waitForAuthorization({ readState: () => ({}), eventTarget: h.eventTarget });
  const rejected = assert.rejects(promise, error => error.kind === 'authorization-timeout');
  h.tick('timeout');
  await rejected;
  h.assertClean();
});

test('SDK state or reset failures do not disclose their error details', async () => {
  for (const failingOperation of ['readState', 'reset']) {
    const h = harness();
    const args = { readState: validState, eventTarget: h.eventTarget };
    args[failingOperation] = () => { throw new Error('private-sdk-state'); };
    await assert.rejects(h.auth.waitForAuthorization(args), error => {
      assert.equal(error.kind, 'authorization-unavailable');
      assert.doesNotMatch(JSON.stringify(error), /private-sdk-state|credential/);
      return true;
    });
    h.assertClean();
  }
});

test('invalid or missing expiry is not accepted; ISO and numeric expiry are supported', () => {
  const { auth } = harness();
  assert.equal(auth.isAuthorized({ accessToken: 'test', accessTokenExpiresAt: 1001 }, 1000), true);
  assert.equal(auth.isAuthorized({ accessToken: 'test', accessTokenExpiresAt: new Date(1001).toISOString() }, 1000), true);
  for (const accessTokenExpiresAt of [1000, 999, '', undefined, 'invalid']) {
    assert.equal(auth.isAuthorized({ accessToken: 'test', accessTokenExpiresAt }, 1000), false);
  }
  assert.equal(auth.isAuthorized({ accessToken: '', accessTokenExpiresAt: 1001 }, 1000), false);
  assert.equal(auth.isAuthorized(null, 1000), false);
});
