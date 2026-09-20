async page=>{
 await page.goto('http://127.0.0.1:4331/farol4/index.html');
 await page.evaluate(()=>{
  window.partsTest={status:'running',count:0};
  window.partsJob=(async()=>{
   const {FileSender,PartReceiver,hashFile}=await import('/farol4/parts.mjs?v=20260920-1');
   const {crc32,b64}=await import('/farol4/protocol.mjs?v=20260920-1');
   const assert=(v,m)=>{if(!v)throw Error(m);};
   const req=q=>new Promise((a,b)=>{q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error);});
   const opening=indexedDB.open('farol-parts-test-'+Date.now(),2);
   opening.onupgradeneeded=()=>{opening.result.createObjectStore('sessions');opening.result.createObjectStore('parts');};
   const db=await req(opening);
   const unit=new Uint8Array(1000000);for(let i=0;i<unit.length;i++)unit[i]=i%200;
   const file=new File(Array(100).fill(unit),'large.mp4');
   const sender=await FileSender.create(file,file.name,400);
   assert(sender.bytes===null,'Sender retained whole file');
   assert(sender.meta.total===250000,'Wrong block count');
   let r=new PartReceiver(sender.meta,db);const data=unit.slice(0,400);
   const suffix=crc32(data)+'|'+b64(data);
   const packet=i=>'F4|B|'+sender.meta.id+'|'+i+'|'+suffix;
   assert(await sender.packet(249999)===packet(249999),'Last sender packet differs');
   for(let i=0;i<sender.meta.total;i++){
    assert(await r.accept(packet(i)),'Rejected block '+i);
    assert(r.cache.size<=2,'Unbounded memory cache');
    if(i===62499){
     await r.flush({activeMs:1234});await r.dispose();
     const saved=await req(db.transaction('sessions').objectStore('sessions').get('current'));
     r=new PartReceiver(sender.meta,db,saved);
     assert(r.count===62500&&r.missing(1)[0]===62500,'Resume lost progress');
     assert(!await r.accept(packet(0)),'Duplicate accepted');
     assert(!await r.accept(packet(62500).replace(suffix,'00000000|'+b64(data))),'Corruption accepted');
    }
    if(i%1000===0){window.partsTest.count=i;await new Promise(a=>setTimeout(a,0));}
   }
   assert(await r.verify(),'100 MB hash mismatch');
   const blob=await r.fileBlob();assert(blob.size===100000000&&blob.type==='video/mp4','Wrong export');
   assert(await hashFile(blob)===sender.meta.hash,'Export differs');
   let rejected=false;try{await FileSender.create(new Blob([file,new Uint8Array(1)]),'too-big');}catch{rejected=true;}
   assert(rejected,'Over limit accepted');
   window.partsTest={status:'passed',bytes:blob.size,blocks:r.count,hash:sender.meta.hash,resumeAt:62500,maxCacheChunks:2};
   await r.dispose();const name=db.name;db.close();indexedDB.deleteDatabase(name);
  })().catch(e=>{window.partsTest={status:'failed',error:e.stack};});
 });
 console.log(await page.evaluate(()=>window.partsTest));
}
