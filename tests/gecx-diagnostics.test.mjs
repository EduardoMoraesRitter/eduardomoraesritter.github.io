import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/gemini-cx-demo/diagnostics.js', import.meta.url), 'utf8');
const sandbox = vm.createContext({});
vm.runInContext(source, sandbox, { filename: 'diagnostics.js' });
const { GecxDiagnostics: diagnostics } = sandbox;
const plain = value => JSON.parse(JSON.stringify(value));

test('loads as a dependency-free classic script with a frozen public API', () => {
  assert.equal(typeof diagnostics.describe, 'function');
  assert.equal(typeof diagnostics.codes, 'function');
  assert.equal(typeof diagnostics.createJournal, 'function');
  assert.ok(Object.isFrozen(diagnostics));
});

test('a sentinel status -1 does not mask SDK error 15 / detail 6', () => {
  const detail = { status: -1, errorCode: 15, detailedErrorCode: 6 };
  assert.deepEqual(plain(diagnostics.codes(detail)), { code: 15, detail: 6 });
  const description = diagnostics.describe(detail);
  assert.equal(description.kind, 'stream');
  assert.equal(description.code, 15);
  assert.equal(description.detail, 6);
  assert.equal(description.http, undefined);
});

test('accepts numeric codes and numeric strings, rejecting arbitrary values', () => {
  assert.deepEqual(plain(diagnostics.codes({ status: '429', errorCode: '21', detailedErrorCode: '6' })), {
    http: 429, code: 21, detail: 6,
  });
  for (const value of [-1, null, undefined, '', 'token-secret', {}, NaN, Infinity, 1.5]) {
    assert.deepEqual(plain(diagnostics.codes({ status: value, errorCode: value, detailedErrorCode: value })), {});
  }
  assert.deepEqual(plain(diagnostics.codes({ status: 99 })), {});
  assert.deepEqual(plain(diagnostics.codes({ status: 600 })), {});
});

for (const detail of [{ status: 429 }, { errorCode: 21, status: -1 }, { status: '429', errorCode: '21' }]) {
  test(`recognises quota/capacity only from explicit limit evidence ${JSON.stringify(detail)}`, () => {
    const description = diagnostics.describe(detail);
    assert.equal(description.kind, 'capacity');
    assert.equal(description.action, 'retry');
    assert.match(description.message, /limite|capacidade/i);
  });
}

for (const status of [401, 403]) {
  test(`HTTP ${status} is an access error and suggests reloading`, () => {
    const description = diagnostics.describe({ status });
    assert.equal(description.kind, 'access');
    assert.equal(description.action, 'reload');
    assert.equal(description.http, status);
  });
}

for (const [name, kind] of [
  ['NotAllowedError', 'permission'],
  ['SecurityError', 'permission'],
  ['NotFoundError', 'microphone'],
  ['NotReadableError', 'microphone'],
]) {
  test(`handles microphone DOM error ${name}`, () => {
    const description = diagnostics.describe({ name, message: 'private browser details' });
    assert.equal(description.kind, kind);
    assert.equal(description.action, 'retry');
    assert.doesNotMatch(JSON.stringify(description), /private browser details/);
  });
}

test('SDK error 4 maps to unavailable microphone without losing its code', () => {
  const description = diagnostics.describe({ errorCode: 4, status: -1 });
  assert.equal(description.kind, 'microphone');
  assert.equal(description.code, 4);
  assert.match(description.message, /dispositivo|permissão/i);
});

test('SDK 15 / 3 distinguishes inactivity and explains that mute does not pause it', () => {
  const description = diagnostics.describe({ errorCode: 15, detailedErrorCode: 3, status: -1 });
  assert.equal(description.kind, 'inactivity');
  assert.equal(description.code, 15);
  assert.equal(description.detail, 3);
  assert.match(description.message, /mudo não suspende/i);
});

test('SDK 15 / 6 remains generic rather than asserting a quota or user-network cause', () => {
  const description = diagnostics.describe({ errorCode: 15, detailedErrorCode: 6, status: -1 });
  assert.equal(description.kind, 'stream');
  assert.match(description.message, /não identifica/i);
  assert.doesNotMatch(description.title + ' ' + description.message, /quota|atingiu o limite|está offline/i);
});

test('an empty stream is not falsely classified as a denied microphone', () => {
  const description = diagnostics.describe({ kind: 'empty-stream' });
  assert.equal(description.kind, 'empty-stream');
  assert.notEqual(description.kind, 'permission');
  assert.notEqual(description.kind, 'microphone');
  assert.match(description.message, /não confirma uma recusa/i);
});

test('response timeout explains the missing response without claiming the session is disconnected', () => {
  const description = diagnostics.describe({ kind: 'response-timeout' });
  assert.equal(description.kind, 'response-timeout');
  assert.match(description.message, /transcrição/i);
  assert.match(description.message, /aguardar/i);
  assert.match(description.message, /nova conversa/i);
  assert.doesNotMatch(description.title, /terminada|interrompida/i);
});

test('diagnostic strings do not include arbitrary error details or credentials', () => {
  const description = diagnostics.describe({
    errorCode: 15, detailedErrorCode: 6, status: -1,
    message: 'SECRET_TRANSCRIPT', transcript: 'SECRET_TRANSCRIPT',
    token: 'SECRET_TOKEN', authorization: 'Bearer SECRET_TOKEN',
  });
  assert.doesNotMatch(JSON.stringify(description), /SECRET_TRANSCRIPT|SECRET_TOKEN|Bearer/);
});

test('journal retains only the newest entries within the configured limit', () => {
  const journal = diagnostics.createJournal(3);
  for (let attempt = 1; attempt <= 7; attempt += 1) journal.add('connect', { attempt });
  const entries = plain(journal.entries());
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map(entry => entry.attempt), ['5', '6', '7']);
  assert.ok(entries.every(entry => Number.isFinite(Date.parse(entry.at))));
});

test('journal defaults to a bounded history of 40 events', () => {
  const journal = diagnostics.createJournal();
  for (let attempt = 0; attempt < 90; attempt += 1) journal.add('connect', { attempt });
  const entries = journal.entries();
  assert.equal(entries.length, 40);
  assert.equal(entries[0].attempt, '50');
  assert.equal(entries.at(-1).attempt, '89');
});

test('journal allowlists structured metadata and excludes text, audio, tokens and arbitrary details', () => {
  const journal = diagnostics.createJournal();
  journal.add('sdk-error', {
    attempt: 2, mode: 'voice', language: 'pt-PT', kind: 'stream',
    status: -1, errorCode: 15, detailedErrorCode: 6,
    authorization: 'Bearer SECRET_TOKEN', token: 'SECRET_TOKEN', apiKey: 'SECRET_KEY',
    message: 'SECRET_TRANSCRIPT', transcript: 'SECRET_TRANSCRIPT', utterance: 'SECRET_REPLY',
    audio: [1, 2, 3], arbitrary: { secret: 'SECRET_DETAIL' },
  });
  const [entry] = plain(journal.entries());
  assert.deepEqual(Object.keys(entry).sort(), ['at', 'attempt', 'code', 'detail', 'event', 'kind', 'language', 'mode'].sort());
  assert.deepEqual({ ...entry, at: '<timestamp>' }, {
    at: '<timestamp>', event: 'sdk-error', code: 15, detail: 6,
    attempt: '2', mode: 'voice', language: 'pt-PT', kind: 'stream',
  });
  assert.doesNotMatch(JSON.stringify(entry), /SECRET_|Bearer|authorization|audio|arbitrary/);
});

test('journal rejects unstructured event names and unsafe metadata strings', () => {
  const journal = diagnostics.createJournal();
  journal.add('a conversation transcript with spaces', {
    mode: 'voice token=SECRET_TOKEN', kind: 'Bearer SECRET_TOKEN',
    language: '<script>alert(1)</script>', attempt: 'x'.repeat(65),
  });
  const [entry] = plain(journal.entries());
  assert.equal(entry.event, 'unknown');
  assert.deepEqual(Object.keys(entry).sort(), ['at', 'event']);
});

test('entries returns independent snapshots; mutating a snapshot cannot change the journal', () => {
  const journal = diagnostics.createJournal();
  journal.add('connected', { mode: 'voice', attempt: 1 });
  const snapshot = journal.entries();
  snapshot[0].event = 'tampered';
  snapshot[0].token = 'SECRET_TOKEN';
  snapshot.push({ event: 'injected' });
  const current = journal.entries();
  assert.equal(current.length, 1);
  assert.equal(current[0].event, 'connected');
  assert.equal(current[0].token, undefined);
  assert.notEqual(current[0], snapshot[0]);
});

test('add returns an isolated entry so callers cannot tamper with stored diagnostics', () => {
  const journal = diagnostics.createJournal();
  const added = journal.add('connected', { mode: 'voice', attempt: 1 });
  added.event = 'tampered';
  added.token = 'SECRET_TOKEN';
  const [stored] = journal.entries();
  assert.equal(stored.event, 'connected');
  assert.equal(stored.token, undefined);
});

test('pending microphone cancellation offers reload instead of an unsafe second capture', () => {
  const result = diagnostics.describe({ kind: 'pending-cancel' });
  assert.equal(result.action, 'reload');
  assert.match(result.message, /microfone/);
});

test('a stuck chat request offers reload and explains that requests are not replayed', () => {
  const result = diagnostics.describe({ kind: 'chat-response-timeout' });
  assert.equal(result.action, 'reload');
  assert.match(result.message, /Não reenviamos/);
  assert.match(result.message, /pode ainda ser concluída/);
});
