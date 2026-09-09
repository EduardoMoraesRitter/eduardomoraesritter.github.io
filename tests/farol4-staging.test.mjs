import test from 'node:test';
import assert from 'node:assert/strict';
import {Sender,Receiver} from '../public/farol4-staging/protocol.mjs';
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
