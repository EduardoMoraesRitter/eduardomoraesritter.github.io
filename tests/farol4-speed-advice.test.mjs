import test from 'node:test';import assert from 'node:assert/strict';
import {speedAdvice,adviceBadge,clampFps} from '../public/farol4/speed-advice.mjs';
const base={fps:6,frames:6,codes:16.5,scans:9,fresh:16,sinceAdjustment:9000,active:true};
test('waits until both sides have fresh measurements',()=>{
 assert.deepEqual(speedAdvice({...base,active:false}),{action:'wait',target:6,text:''});
 assert.equal(speedAdvice({...base,sinceAdjustment:3000}).text,'Medindo a leitura…');
 assert.equal(speedAdvice({...base,scans:0}).action,'wait');assert.equal(speedAdvice({...base,codes:0}).action,'wait');
});
test('suggests speeding up only with camera headroom and nearly every QR captured',()=>{
 assert.equal(speedAdvice(base).action,'keep');
 const up=speedAdvice({...base,scans:10});assert.equal(up.action,'up');assert.equal(up.target,7);
 assert.equal(speedAdvice({...base,fps:4,frames:4,codes:11,fresh:10.5,scans:10}).target,6);
 assert.equal(speedAdvice({...base,fps:12,frames:12,codes:33,fresh:32,scans:30}).action,'keep');
 assert.equal(speedAdvice({...base,scans:10,fresh:13}).action,'keep');
});
test('suggests slowing down when frames outrun the camera or blocks are lost',()=>{
 const fast=speedAdvice({...base,scans:5});assert.equal(fast.action,'down');assert.equal(fast.target,4);
 const lossy=speedAdvice({...base,fresh:6});assert.equal(lossy.action,'down');assert.equal(lossy.target,5);
 assert.match(lossy.text,/36% dos QR/);
 assert.equal(speedAdvice({...base,fps:1,frames:1,codes:2.7,scans:.8,fresh:2.6}).action,'keep');
});
test('low capture at a slow rate is a framing problem, not speed',()=>{
 const framing=speedAdvice({...base,fps:3,frames:3,codes:8.2,scans:9,fresh:2.7});
 assert.equal(framing.action,'frame');assert.equal(framing.target,3);
 assert.equal(speedAdvice({...base,fps:1,frames:1,codes:2.7,scans:1.5,fresh:.5}).action,'frame');
});
test('badge and clamp',()=>{
 assert.equal(adviceBadge(6,'up'),'6 quadros/s · pode aumentar');assert.equal(adviceBadge(4,'wait'),'4 quadros/s');
 assert.equal(clampFps(0),1);assert.equal(clampFps(99),12);assert.equal(clampFps('7'),7);assert.equal(clampFps(NaN),1);
});
