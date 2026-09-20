import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {FileSender,READ_SIZE} from '../public/farol4/parts.mjs';
import {Sender} from '../public/farol4/protocol.mjs';
globalThis.hashwasm=createRequire(import.meta.url)('../public/farol4/vendor/sha256.umd.min.js');

test('file sender uses bounded slices and retains wire identity and selective recovery',async()=>{
 const bytes=Uint8Array.from({length:READ_SIZE*2+123},(_,i)=>(i*31)%251);
 const blob=new Blob([bytes]);let maxRead=0;
 const file={size:blob.size,slice(a,b){maxRead=Math.max(maxRead,Math.min(b,blob.size)-a);return blob.slice(a,b);},arrayBuffer(){throw Error('Whole file read');}};
 const sender=await FileSender.create(file,'sample.mp4',600);
 assert.equal(sender.meta.hash,createHash('sha256').update(bytes).digest('hex'));
 assert.equal(sender.bytes,null);assert.ok(maxRead<=READ_SIZE);
 const legacy=await Sender.create(bytes,'sample.mp4',600);
 for(const i of [0,1747,sender.meta.total-1])assert.equal(await sender.packet(i),legacy.packet(i));
 sender.request([100,2,sender.meta.total-1],true);
 for(const i of [100,2,sender.meta.total-1])assert.equal(await sender.next(),legacy.packet(i));
 assert.equal(await sender.next(),null);
});
test('empty file identity and maximum-file rejection',async()=>{
 const sender=await FileSender.create(new Blob([]),'empty');
 assert.equal(sender.meta.total,1);
 assert.equal(sender.meta.hash,createHash('sha256').digest('hex'));
 await assert.rejects(FileSender.create({size:100000001},'large'),/100 MB/);
});
