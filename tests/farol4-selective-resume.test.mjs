import test from 'node:test';
import assert from 'node:assert/strict';
import {Sender,Receiver} from '../public/farol4/protocol.mjs';
test('remote plan skips already received blocks and waits after its batch',async()=>{
 const s=await Sender.create(new Uint8Array(256*3000),'large.bin',256),r=new Receiver(s.meta);
 for(let i=0;i<3000;i++)if(i!==17&&i!==2111)r.accept(s.packet(i));
 assert.equal(r.count,2998);assert.ok(s.request(r.missing(),true));
 assert.equal(Number(s.next().split('|')[3]),17);assert.equal(Number(s.next().split('|')[3]),2111);
 assert.equal(s.next(),null);assert.equal(s.next(),null);
 r.accept(s.packet(17));s.request(r.missing(),true);assert.equal(Number(s.next().split('|')[3]),2111);assert.equal(s.next(),null);
 s.request([4]);assert.equal(Number(s.next().split('|')[3]),4);assert.ok(s.next());
});
test('duplicate blocks remain visible without changing progress',async()=>{
 const s=await Sender.create(new Uint8Array(600),'small.bin',400),r=new Receiver(s.meta);
 assert.ok(r.accept(s.packet(0)));assert.equal(r.accept(s.packet(0)),false);assert.equal(r.count,1);assert.equal(r.duplicates,1);
});

test('frequent missing reports do not starve blocks later in the queue',async()=>{
 const s=await Sender.create(new Uint8Array(400*20),'queue.bin',400);
 s.request([0,1,2,3],true);assert.equal(Number(s.next().split('|')[3]),0);
 s.request([0,1,2,3],true);assert.equal(Number(s.next().split('|')[3]),1);
 s.request([0,2,3],true);assert.equal(Number(s.next().split('|')[3]),2);
 s.request([0,3],true);assert.equal(Number(s.next().split('|')[3]),3);
 assert.equal(Number(s.next().split('|')[3]),0);assert.equal(s.next(),null);
 s.request([],true);assert.equal(s.next(),null);
});
test('recovery detects active duplicate readings but respects pause, completion and camera loss',async()=>{
 const {needsRecovery}=await import('../public/farol4/transfer-rate.mjs');
 const state={active:true,paused:false,complete:false,lastDecoded:9500,progressSince:1000,now:10000};
 assert.equal(needsRecovery(state),true);
 for(const patch of [{paused:true},{active:false},{complete:true},{lastDecoded:0},{lastDecoded:6000},{progressSince:9500}])assert.equal(needsRecovery({...state,...patch}),false);
});
