import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ReturnChannel} from '../public/farol3/realtime.mjs';
import {controlKey,open} from '../public/farol4/protocol.mjs';
test('control messages stay ordered and old queued messages never enter a new connection',async()=>{
 const r=new ReturnChannel(()=>{},()=>{},()=>{});r.key=await controlKey('a'.repeat(64));r.ready=true;
 let concurrent=0,max=0;const received=[];
 r.channel={async send({payload}){max=Math.max(max,++concurrent);await new Promise(resolve=>setTimeout(resolve,10));received.push(await open(r.key,payload));concurrent--;return 'ok';}};
 await Promise.all(['sync_ack','pause_state','hello'].map(type=>r.send({type})));
 assert.equal(max,1);assert.deepEqual(received.map(m=>m.type),['sync_ack','pause_state','hello']);assert.deepEqual(received.map(m=>m.seq),[1,2,3]);
 const queued=r.send({type:'ready'});await r.close();assert.equal(await queued,false);
});
