import test from 'node:test';import assert from 'node:assert/strict';
import {TransferClock,elapsed} from '../public/farol4/transfer-clock.mjs';
test('accumulates reception, pauses and closed-page gaps across reload',()=>{
 const c=new TransferClock(null,1000);c.update(1000,true,true);c.update(61000,false);c.update(91000,true);c.update(121000,false);
 assert.deepEqual(c.summary(121000),{totalMs:120000,activeMs:90000,pausedMs:30000});
 const restored=new TransferClock(c.snapshot(),181000);restored.update(181000,true);restored.finish(211000);
 assert.deepEqual(restored.summary(250000),{totalMs:210000,activeMs:120000,pausedMs:90000});
 const final=new TransferClock(restored.snapshot(),300000);assert.deepEqual(final.summary(400000),restored.summary(250000));
 assert.equal(elapsed(3661000),'1 h 1 min');
});
test('no time before first block; invalid saved clock cannot inflate active time',()=>{
 const c=new TransferClock(null,1000);c.update(10000,true,false);assert.equal(c.summary(20000).totalMs,0);
 const bad=new TransferClock({startedAt:1000,activeMs:Infinity},2000);assert.equal(bad.activeMs,0);
});
