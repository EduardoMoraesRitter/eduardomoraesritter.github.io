import test from 'node:test';
import assert from 'node:assert/strict';
import {Sender,Receiver,readMeta,ranges,parseRanges,newPairCode,controlKey,seal,open} from '../public/farol4/protocol.mjs';
import {ReturnChannel} from '../public/farol4/realtime.mjs';
import {analyzeFrame,autoZoom} from '../public/farol4/camera.mjs';
import {pairPacket,readPair} from '../public/farol4/pairing.mjs';
import {readFile} from 'node:fs/promises';
import {TransferRate,duration} from '../public/farol4/transfer-rate.mjs';

test('ETA counts new bytes only, handles stalls and restored baselines',()=>{
  const meter=new TransferRate();
  assert.equal(meter.observe(4000,0).rate,0);
  assert.equal(meter.observe(5200,3000).rate,400);
  assert.equal(meter.observe(5200,6000).rate,200);
  assert.equal(meter.observe(5200,11000).stalled,true);
  assert.equal(meter.observe(5200,11000).rate,0);
  assert.ok(meter.observe(5600,12000).rate>0);
  assert.equal(new TransferRate().observe(5600,13000).rate,0);
  assert.equal(duration(80),'~2 min');
});

const sample=()=>Uint8Array.from({length:123456},(_,i)=>(i*17+i%7)%256);
test('pairing QR roundtrip and rejection of invalid codes/projects',()=>{
  const p={url:'https://example.supabase.co',key:'public-key',code:newPairCode(),file:'a'.repeat(64)+':400'};
  assert.deepEqual(readPair(pairPacket(p)),p);
  assert.equal(readPair(pairPacket({...p,code:'1234'})),null);
  assert.equal(readPair(pairPacket({...p,url:'https://untrusted.example'})),null);
  assert.equal(readPair('F4|P|invalid'),null);
});
test('camera guidance handles dark/bright/low contrast and zoom only uses centered QR',()=>{
  const flat=v=>new Uint8ClampedArray(100*100*4).fill(v);
  assert.match(analyzeFrame(flat(15),100,100).message,/escura/);
  assert.match(analyzeFrame(flat(250),100,100).message,/clara/);
  assert.match(analyzeFrame(flat(120),100,100).message,/contraste/);
  assert.equal(autoZoom(1,1,3,{coverage:0,centered:false}),1);
  assert.equal(autoZoom(2,1,3,{coverage:.2,centered:false}),2);
  assert.ok(autoZoom(1,1,3,{coverage:.3,centered:true})>1);
  assert.ok(autoZoom(2,1,3,{coverage:.9,centered:true})<2);
  assert.equal(autoZoom(3,1,3,{coverage:.3,centered:true}),3);
  assert.equal(autoZoom(2,1,3,{coverage:.6,centered:true}),2);
});
test('RGB: out-of-order blocks, duplicates, targeted recovery and SHA-256',async()=>{
  const s=await Sender.create(sample(),'teste.bin',400),r=new Receiver(readMeta(s.metadata()));
  for(let i=s.meta.total-1;i>=0;i--)if(i%7!==0){assert.ok(r.accept(s.packet(i)));assert.equal(r.accept(s.packet(i)),false);}
  const missing=r.missing();assert.equal(missing.length,s.meta.total-r.count);
  assert.ok(s.request(missing));for(let i=0;i<missing.length;i++)r.accept(s.next());
  assert.ok(await r.verify());assert.deepEqual(r.bytes,s.bytes);
});
test('corrupt, truncated, foreign and invalid-index packets do not poison reception',async()=>{
  const s=await Sender.create(sample(),'arquivo',256),r=new Receiver(s.meta);
  const p=s.packet(0).split('|');p[4]='00000000';assert.equal(r.accept(p.join('|')),false);
  assert.equal(r.accept(s.packet(0).slice(0,-4)),false);
  assert.equal(r.accept(s.packet(0).replace('|0|','|-1|')),false);
  assert.equal(r.accept(s.packet(0).replace(s.meta.id,'a'.repeat(64)+':256')),false);
  assert.equal(r.count,0);assert.ok(r.accept(s.packet(0)));
  assert.equal(readMeta('F4|M|bad'),null);
});
test('metadata bounded allocation, zero bytes and identity includes block size',async()=>{
  const a=await Sender.create(new Uint8Array(),'vazio',256);const r=new Receiver(a.meta);
  assert.ok(r.accept(a.packet(0)));assert.ok(await r.verify());
  const b=await Sender.create(new Uint8Array(),'vazio',400);assert.notEqual(a.meta.id,b.meta.id);
  assert.throws(()=>new Receiver({...a.meta,total:200000000}));
  assert.throws(()=>new Receiver({...a.meta,size:-1}));
});
test('manual ranges are one-based, bounded and deduplicated',()=>{
  assert.equal(ranges([0,1,2,5,7,8]),'1-3, 6, 8-9');
  assert.deepEqual(parseRanges('1-3, 3, 6',10),[0,1,2,5]);
  for(const text of ['0','-1','5-2','11','1-513','1.5'])assert.throws(()=>parseRanges(text,10));
  assert.throws(()=>parseRanges('1-513',1000));
});
test('persist partial progress and verify restored completion; catch tampering',async()=>{
  const s=await Sender.create(sample(),'teste',400),r=new Receiver(s.meta);
  r.accept(s.packet(1));const restored=Receiver.restore(structuredClone(r.snapshot()));
  assert.equal(restored.count,1);for(let i=0;i<s.meta.total;i++)restored.accept(s.packet(i));
  assert.ok(await restored.verify());restored.bytes[0]^=1;assert.equal(await restored.verify(),false);
});
test('control messages encrypted/authenticated; wrong session cannot read or forge',async()=>{
  const a=await controlKey(newPairCode()),b=await controlKey(newPairCode());
  const msg={type:'missing',indices:[12,45],count:8};const payload=await seal(a,msg);
  assert.deepEqual(await open(a,payload),msg);await assert.rejects(()=>open(b,payload));
  const bytes=Buffer.from(payload.data,'base64');bytes[0]^=1;
  await assert.rejects(()=>open(a,{...payload,data:bytes.toString('base64')}));
});
test('return channel rejects stale, replayed, wrong-session and oversized messages',async()=>{
  let handler,deliveries=0;const fake=()=>({channel:()=>({on(_e,_f,cb){handler=cb;return this;},subscribe(cb){cb('SUBSCRIBED');return this;}}),removeAllChannels:async()=>{},realtime:{disconnect(){}}});
  const ch=new ReturnChannel(()=>deliveries++,()=>{},fake),code=newPairCode();await ch.connect('url','key',code);
  const key=await controlKey(code),msg={v:4,type:'missing',from:'peer',seq:1,time:Date.now()};
  const payload=await seal(key,msg);await handler({payload});await handler({payload});assert.equal(deliveries,1);
  await handler({payload:await seal(key,{...msg,seq:2,time:Date.now()-120000})});assert.equal(deliveries,1);
  await handler({payload:await seal(await controlKey(newPairCode()),{...msg,seq:3})});assert.equal(deliveries,1);
  await handler({payload:{iv:'a'.repeat(16),data:'a'.repeat(24001)}});assert.equal(deliveries,1);
  await ch.close();await handler({payload:await seal(key,{...msg,seq:4})});assert.equal(deliveries,1);
});
test('LIVE Supabase: missing request → exact repairs → integrity confirmation', {skip:process.env.FAROL_LIVE!=='1',timeout:40000},async()=>{
  const sdk=await readFile(new URL('../public/farol4/vendor/supabase.js',import.meta.url),'utf8');
  const {createClient}=new Function(sdk+';return supabase;')();
  const config=JSON.parse(await readFile(new URL('../public/farol4/config.json',import.meta.url),'utf8'));
  const s=await Sender.create(sample(),'live.bin',400),r=new Receiver(s.meta);
  for(let i=0;i<s.meta.total;i++)if(i%13!==0)r.accept(s.packet(i));
  const code=newPairCode();let missingResolve,doneResolve;
  const missing=new Promise(resolve=>missingResolve=resolve),done=new Promise(resolve=>doneResolve=resolve);
  let senderReady,receiverReady;
  const readyA=new Promise(resolve=>senderReady=resolve),readyB=new Promise(resolve=>receiverReady=resolve);
  const a=new ReturnChannel(m=>{if(m.type==='missing')missingResolve(m);if(m.type==='done')doneResolve(m);},state=>{if(state==='SUBSCRIBED')senderReady();},createClient);
  const b=new ReturnChannel(()=>{},state=>{if(state==='SUBSCRIBED')receiverReady();},createClient);
  try{
    await a.connect(config.url,config.key,code);await b.connect(config.url,config.key,code);
    await Promise.race([Promise.all([readyA,readyB]),new Promise((_,reject)=>setTimeout(()=>reject(Error('Realtime connection timeout')),15000).unref())]);
    assert.ok(await b.send({type:'missing',role:'receive',file:r.meta.id,count:r.count,indices:r.missing()}));
    const request=await missing;assert.equal(request.file,s.meta.id);assert.ok(s.request(request.indices));
    for(let i=0;i<request.indices.length;i++)r.accept(s.next());
    assert.ok(await r.verify());
    assert.ok(await b.send({type:'done',role:'receive',file:r.meta.id,count:r.count,hash:r.meta.hash}));
    const receipt=await done;assert.equal(receipt.hash,s.meta.hash);assert.deepEqual(r.bytes,s.bytes);
    // Rejoin after a disconnect and confirm the receiver can repeat the completion receipt.
    const reconnected=new Promise(resolve=>senderReady=resolve),again=new Promise(resolve=>doneResolve=resolve);
    await a.connect(config.url,config.key,code);await reconnected;
    assert.ok(await b.send({type:'done',role:'receive',file:r.meta.id,count:r.count,hash:r.meta.hash}));
    assert.equal((await again).hash,s.meta.hash);
  }finally{await a.close();await b.close();}
});
