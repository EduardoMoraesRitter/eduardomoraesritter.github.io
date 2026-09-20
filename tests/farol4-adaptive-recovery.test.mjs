import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryAction} from '../public/farol4/adaptive-recovery.mjs';
test('stalled receiver slows progressively then pauses, without automatic resume',()=>{
 assert.deepEqual(recoveryAction({age:7900,fps:6,sinceAdjustment:9000}),{});
 assert.deepEqual(recoveryAction({age:8000,fps:6,sinceAdjustment:9000}),{fps:4});
 assert.deepEqual(recoveryAction({age:9000,fps:4,sinceAdjustment:1000}),{});
 assert.deepEqual(recoveryAction({age:15000,fps:4,sinceAdjustment:7000}),{fps:2});
 assert.deepEqual(recoveryAction({age:21000,fps:2,sinceAdjustment:6000}),{fps:1});
 assert.deepEqual(recoveryAction({age:24000,fps:1,sinceAdjustment:6000}),{});
 assert.deepEqual(recoveryAction({age:25000,fps:1,sinceAdjustment:6000}),{pause:true});
 for(const age of [undefined,NaN,-1,Infinity])assert.deepEqual(recoveryAction({age,fps:6,sinceAdjustment:9000}),{});
});
