async page=>{
 await page.goto('http://127.0.0.1:4322/farol4-staging/index.html');await page.locator('#receiveMode').click();
 await page.evaluate(async()=>{
  const {Sender,Receiver}=await import('./protocol.mjs?v=staging-20260909-1');const s=await Sender.create(new Uint8Array(800),'import.bin',400),r=new Receiver(s.meta);r.accept(s.packet(0));
  const db=await new Promise(resolve=>{const q=indexedDB.open('farol4',1);q.onupgradeneeded=()=>q.result.createObjectStore('sessions');q.onsuccess=()=>resolve(q.result);});
  await new Promise(resolve=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(r.snapshot(),'current');tx.oncomplete=resolve;});db.close();window.confirm=()=>true;
 });
 await page.locator('.recoveryDetails summary').click();await page.locator('#importProgress').click();await page.waitForFunction(()=>document.getElementById('received').textContent==='1 / 2 blocos');
 const preserved=await page.evaluate(async()=>{const {readProductionProgress}=await import('./progress-import.mjs?v=staging-20260909-1');const s=await readProductionProgress();return s.flags.reduce((a,b)=>a+b,0)===1;});
 if(!preserved)throw Error('Production source changed');return {imported:true,originalPreserved:true};
}
