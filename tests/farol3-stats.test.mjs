import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TransferStats,validStats,statsText} from '../public/farol3/transfer-stats.mjs';
const base={id:'a',count:100,total:1000,bs:400,size:400000,active:true,done:false};
test('resumed blocks do not inflate rate; stalls have no ETA',()=>{
 const s=new TransferStats();s.update(base,0);
 const m=s.update({...base,count:125},10000);assert.equal(m.rate,1000);assert.equal(m.eta,350);
 const stalled=s.update({...base,count:125},23000);assert.equal(stalled.eta,null);assert.equal(stalled.stalled,true);
 assert.match(statsText(stalled),/Sem avanço/);assert.ok(validStats(stalled));
});
test('pauses exclude active time and completion freezes elapsed; new file resets',()=>{
 const s=new TransferStats();s.update({...base,count:0},0);
 s.update({...base,count:10,active:false},10000);
 const paused=s.update({...base,count:10,active:false},70000);assert.equal(paused.active,10);assert.equal(paused.elapsed,70);assert.equal(paused.eta,null);
 s.update({...base,count:10},71000);
 const resumed=s.update({...base,count:20},81000);assert.equal(resumed.rate,400);assert.equal(resumed.active,20);
 const done=s.update({...base,count:1000,done:true},90000);assert.equal(done.bytes,400000);
 assert.equal(s.update({...base,count:1000,done:true},100000).elapsed,done.elapsed);
 assert.equal(s.update({...base,id:'b',count:0},110000).elapsed,0);
});
test('invalid network metrics rejected',()=>{assert.equal(validStats({bytes:Infinity}),false);});
