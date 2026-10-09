import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryAction,canRetryReception} from '../public/farol4/adaptive-recovery.mjs';
import {PauseState} from '../public/farol4/pause-state.mjs';
test('stalled receiver slows progressively before its recovery pause',()=>{
 assert.deepEqual(recoveryAction({age:7900,fps:6,sinceAdjustment:9000}),{});
 assert.deepEqual(recoveryAction({age:8000,fps:6,sinceAdjustment:9000}),{fps:4});
 assert.deepEqual(recoveryAction({age:9000,fps:4,sinceAdjustment:1000}),{});
 assert.deepEqual(recoveryAction({age:15000,fps:4,sinceAdjustment:7000}),{fps:2});
 assert.deepEqual(recoveryAction({age:21000,fps:2,sinceAdjustment:6000}),{fps:1});
 assert.deepEqual(recoveryAction({age:24000,fps:1,sinceAdjustment:6000}),{});
 assert.deepEqual(recoveryAction({age:25000,fps:1,sinceAdjustment:6000}),{pause:true});
 for(const age of [undefined,NaN,-1,Infinity])assert.deepEqual(recoveryAction({age,fps:6,sinceAdjustment:9000}),{});
});

test('retry requires a confirmed automatic pause, active receiver and recent peer',()=>{
 const ready={pause:{paused:true,reason:'stall'},confirmed:true,waitMs:5000,cameraActive:true,
  connected:true,peerAgeMs:2000,visible:true,missing:15,blocked:false};
 assert.equal(canRetryReception(ready),true);
 for(const change of [{pause:{paused:true}},{pause:{paused:false}},{confirmed:false},{waitMs:4999},
  {cameraActive:false},{connected:false},{peerAgeMs:12000},{peerAgeMs:Infinity},{visible:false},{missing:0},{blocked:true}])
  assert.equal(canRetryReception({...ready,...change}),false,JSON.stringify(change));
});

test('automatic pause synchronizes its reason; manual pause wins concurrent races',()=>{
 const s=new PauseState('z-sender'),r=new PauseState('a-receiver');
 const automatic=s.change(true,'stall'),manual=r.change(true);
 assert.equal(r.accept(automatic),false);
 assert.equal(s.accept(manual),true);
 assert.deepEqual(s.value,r.value);assert.equal(s.value.reason,undefined);
 const next=s.change(true,'stall');assert.equal(r.accept(next),true);assert.equal(r.value.reason,'stall');
 assert.equal(r.matches({...next,reason:undefined}),false);
 const resume=r.change(false);s.accept(resume);assert.equal(s.value.reason,undefined);
 assert.equal(s.accept(next),false);
 const a=new PauseState('a'),b=new PauseState('z');a.accept(next);b.accept(next);
 const retry=a.change(false),stop=b.change(true);a.accept(stop);b.accept(retry);
 assert.deepEqual(a.value,b.value);assert.equal(a.value.paused,true);
});
