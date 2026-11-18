import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {packBinaryBlock, parseBinaryBlock, isBinaryBlock, fileTag, latin1, crc32, validMeta, BIN_HEADER, MAX_BLOCK_BYTES} from '../public/farol4/protocol.mjs';
import {packetsFrom, isBinaryPacket} from '../public/farol4/scan-decode.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('../public/farol4/vendor/qrcode.js');

const hash = 'ab12cd34'.padEnd(64, '0');
const metaFor = (bs, size) => ({v: 4, hash, id: `${hash}:${bs}`, name: 'f.bin', size, bs, total: Math.max(1, Math.ceil(size / bs))});
const data = (n, seed = 7) => Uint8Array.from({length: n}, (_, i) => (i * 31 + seed) & 255);

test('a binary block round-trips: tag, index, CRC and data', () => {
  const d = data(880);
  const packed = packBinaryBlock(metaFor(880, 10000), 4321, d);
  assert.equal(packed.length, BIN_HEADER + 880);
  assert.ok(isBinaryBlock(packed));
  const p = parseBinaryBlock(packed);
  assert.deepEqual([...p.tag], [...fileTag(hash)]);
  assert.equal(p.index, 4321);
  assert.equal(p.crc, crc32(d));
  assert.deepEqual([...p.data], [...d]);
});

test('Latin-1 keeps every byte value 0 to 255', () => {
  const all = Uint8Array.from({length: 256}, (_, i) => i);
  const s = latin1(all);
  assert.equal(s.length, 256);
  for (let i = 0; i < 256; i++) assert.equal(s.charCodeAt(i), i);
});

test('only F5B-prefixed byte arrays count as binary blocks', () => {
  assert.equal(isBinaryBlock(Uint8Array.from([0x46, 0x34, 0x42, ...data(20)])), false);
  assert.equal(isBinaryBlock(Uint8Array.from([0x46, 0x35, 0x42])), false);
  assert.equal(isBinaryBlock('F5B' + 'x'.repeat(30)), false);
  assert.equal(parseBinaryBlock(new Uint8Array(4)), null);
});

test('a corrupted data byte no longer matches its CRC', () => {
  const d = data(600);
  const packed = packBinaryBlock(metaFor(600, 5000), 1, d);
  packed[BIN_HEADER + 10] ^= 0xff;
  const p = parseBinaryBlock(packed);
  assert.notEqual(crc32(p.data), p.crc);
});

test('metadata accepts blocks up to 880 bytes and no more', () => {
  assert.equal(MAX_BLOCK_BYTES, 880);
  assert.ok(validMeta(metaFor(880, 100000)));
  assert.ok(validMeta(metaFor(600, 100000)));
  assert.equal(validMeta(metaFor(881, 100000)), false);
});

test('the scanner keeps binary blocks as bytes and text packets as text', () => {
  const packed = packBinaryBlock(metaFor(600, 5000), 2, data(600));
  const position = {topLeft: {x: 0, y: 0}, topRight: {x: 1, y: 0}, bottomLeft: {x: 0, y: 1}, bottomRight: {x: 1, y: 1}};
  const out = packetsFrom([{text: 'garbled', bytes: packed, position}, {text: 'F4|M|abc', bytes: new Uint8Array(3), position}, {text: 'hello', position}, null]);
  assert.equal(out.length, 2);
  assert.ok(out[0].data instanceof Uint8Array && isBinaryPacket(out[0].data));
  assert.equal(out[1].data, 'F4|M|abc');
});

test('an 880-byte binary block fits the same QR size as a 600-byte text block', () => {
  const modules = (s) => { const q = qrcode(0, 'M'); q.addData(s); q.make(); return q.getModuleCount(); };
  const textBlock = `F4|B|${hash}:600|12345|deadbeef|` + 'A'.repeat(800);
  const binBlock = latin1(packBinaryBlock(metaFor(880, 1e6), 12345, data(880)));
  assert.equal(modules(binBlock), modules(textBlock));
});
