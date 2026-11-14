import test from 'node:test';import assert from 'node:assert/strict';
import {CONTROL,newControlState,decideSpeed} from '../public/farol4/speed-controller.mjs';

// A phone that can read at most `capacity` frames/s keeps up with fps <= capacity.
// Above that, the share of data frames it accepts drops in proportion.
function run({capacity, start=12, seconds=180, every=3, learned=null, stallAt=null}) {
  let state=newControlState(start, learned), t=0, changes=[], fpsLog=[];
  for(let i=0;i<seconds/every;i++){
    t+=every*1000;
    const fps=state.fps;
    const share=Math.min(1, capacity/fps);
    const expected=fps*3*11/12;
    const stalled=stallAt!==null && t/1000>stallAt;
    const fresh=stalled?0:expected*share;
    const r=decideSpeed(state,{fresh,stalled,active:true},t);
    if(r.fps!==fps) changes.push({t:t/1000,from:fps,to:r.fps,reason:r.reason});
    state=r.state; fpsLog.push(state.fps);
  }
  return {state,changes,fpsLog};
}

test('a phone that keeps up at 12 stays at 12',()=>{
  const {state,changes}=run({capacity:12});
  assert.equal(changes.length,0); assert.equal(state.fps,12);
});

test('a phone that reads 6 frames/s settles near 6 without ping-pong',()=>{
  const {state,changes}=run({capacity:6});
  // Above capacity the useful rate is flat, so anything from 6 up to the hold band is fine.
  assert.ok(state.fps>=6 && state.fps<=9,`settled at ${state.fps}`);
  const late=changes.filter(c=>c.t>90);
  assert.ok(late.length<=2,`changes after 90 s: ${JSON.stringify(late)}`);
});

test('a slow phone goes down to its level and never below the minimum',()=>{
  const {state,fpsLog}=run({capacity:3});
  assert.ok(state.fps>=3 && state.fps<=5,`settled at ${state.fps}`);
  assert.ok(Math.min(...fpsLog)>=CONTROL.MIN_FPS);
});

test('going down remembers the failing rate as a ceiling for the next transfer',()=>{
  const first=run({capacity:6});
  assert.ok(first.state.ceiling<=first.state.lastFailedFps,'ceiling set below failing rate');
  const second=run({capacity:6,start:12,learned:first.state.ceiling});
  assert.ok(Math.max(...second.fpsLog)<=first.state.ceiling,'never climbs above the learned ceiling');
});

test('a stall never raises the rate',()=>{
  const {changes}=run({capacity:12,stallAt:30,seconds:90});
  assert.ok(changes.every(c=>c.to<c.from),`changes: ${JSON.stringify(changes)}`);
});

test('inactive samples (paused, camera off, complete) change nothing',()=>{
  const s=newControlState(8);
  const r=decideSpeed(s,{fresh:0,stalled:false,active:false},100000);
  assert.equal(r.fps,8); assert.equal(r.reason,'inactive');
});

test('changes are at least the cooldown apart',()=>{
  const {changes}=run({capacity:4,seconds:120});
  for(let i=1;i<changes.length;i++) assert.ok(changes[i].t-changes[i-1].t>=CONTROL.COOLDOWN_MS/1000,'cooldown respected');
});
