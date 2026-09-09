import test from 'node:test';
import assert from 'node:assert/strict';
import {AcousticPackets} from '../../public/farol5/acoustic-packets.mjs';
import {Sender,Receiver,unb64,b64} from '../../public/farol5/protocol.mjs';
test('authenticated feedback rejects tampering, replay, wrong sessions and stale packets',async()=>{
 const secret='ab'.repeat(32),a=await AcousticPackets.create(secret),b=await AcousticPackets.create(secret),wrong=await AcousticPackets.create('cd'.repeat(32));
 const message={type:1,count:900,indices:Array.from({length:16},(_,i)=>900+i)},text=await a.encode(message);
 assert.equal(text.length,108);assert.equal(await wrong.decode(text),null);
 const tampered=unb64(text);tampered[20]^=1;assert.equal(await b.decode(b64(tampered)),null);
 assert.deepEqual(await b.decode(text),message);assert.equal(await b.decode(text),null);
 assert.equal(await b.decode(await a.encode(message,Date.now()-61000)),null);
 for(const type of [2,3,4])assert.deepEqual(await b.decode(await a.encode({type,count:916})),{type,count:916,indices:[]});
 await assert.rejects(a.encode({type:1,indices:Array(17).fill(0)}));
});
test('resumed optical receiver asks for missing blocks only and verifies exact bytes',async()=>{
 const bytes=Uint8Array.from({length:3200},(_,i)=>(i*17)%256),tx=await Sender.create(bytes,'test.bin'),rx=new Receiver(tx.meta);
 for(const i of [0,1,3])assert.equal(rx.accept(tx.packet(i)),true);
 const resumed=Receiver.restore(rx.snapshot());assert.deepEqual(resumed.missing(16),[2,4,5,6,7]);
 tx.request(resumed.missing(16),true);let packet;while((packet=tx.next()))assert.equal(resumed.accept(packet),true);
 assert.equal(tx.next(),null);assert.equal(await resumed.verify(),true);assert.deepEqual(resumed.bytes,bytes);
});
