async page=>{
 await page.goto('http://127.0.0.1:4322/farol4/index.html');
 await page.evaluate(()=>{localStorage.removeItem('farol4-session-send');localStorage.removeItem('farol4-session-receive');sessionStorage.clear();});await page.reload();
 await page.locator('#sendMode').click();
 await page.locator('#file').setInputFiles('output/playwright/farol4-source.bin');
 await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
 const code=await page.locator('#pairCode').inputValue();
 await page.locator('#play').click();await page.locator('#play').click();
 await page.reload();await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('Sala salva'));
 if(await page.locator('#pairCode').inputValue()!==code)throw Error('Sender room lost');
 await page.locator('#file').setInputFiles('public/farol4/config.json');
 await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('não é o arquivo'));
 await page.locator('#file').setInputFiles('output/playwright/farol4-source.bin');
 await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
 if(await page.locator('#pairCode').inputValue()!==code)throw Error('Sender created another room');
 const r=await page.context().newPage();await r.goto('http://127.0.0.1:4322/farol4/index.html');
 await r.evaluate(async()=>{
   const {Sender,Receiver}=await import('./protocol.mjs');
   const s=await Sender.create(new Uint8Array(1600).fill(17),'partial.bin',400);const rec=new Receiver(s.meta);rec.accept(s.next());rec.accept(s.next());
   const database=await new Promise((resolve,reject)=>{const q=indexedDB.open('farol4',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
   await new Promise(resolve=>{const t=database.transaction('sessions','readwrite');t.objectStore('sessions').put(rec.snapshot(),'current');t.oncomplete=resolve;});database.close();
   const {writeSession}=await import('./session-store.mjs');const sender=JSON.parse(localStorage.getItem('farol4-session-send'));
   writeSession(localStorage,{...sender,role:'receive',file:s.meta.id,pause:{revision:0,author:'',paused:false}});sessionStorage.setItem('farol4-role','receive');
 });
 for(let i=0;i<2;i++){
   await r.reload();await r.waitForFunction(()=>document.getElementById('received').textContent==='2 / 4 blocos');
   await r.waitForFunction(()=>document.getElementById('serviceStatus').textContent.includes('· conectado'));
   if(await r.locator('#pairCode').inputValue()!==code)throw Error('Receiver room lost');
   if(await r.locator('body').getAttribute('data-mode')!=='receive')throw Error('Receiver role lost');
 }
 await page.evaluate(()=>{window.confirm=()=>true;});await page.locator('#openSettings').click();await page.locator('#forgetRoom').click();
 await page.locator('#file').setInputFiles('public/farol4/config.json');await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
 if(await page.locator('#pairCode').inputValue()===code)throw Error('Forget did not permit a new room/file');
 await r.close();
 return {senderSameRoom:true,wrongFileRejected:true,partialReceiverRestoredTwice:true,rolesIndependent:true,forgetAllowsNewFile:true};
}
