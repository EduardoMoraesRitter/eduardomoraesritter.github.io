// Real room feedback while paused, seeded receiver progress, and skip plan before play.
async page=>{
 const base='http://127.0.0.1:4322/farol4-staging/index.html';
 for(const p of page.context().pages())if(p!==page)await p.close();
 await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();await page.setViewportSize({width:1366,height:768});await page.locator('#sendMode').click();
 await page.locator('#autoStart').uncheck();await page.locator('#file').setInputFiles('output/playwright/farol4-source.bin');await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('farol4-staging-session-send')));
 const r=await page.context().newPage();await r.setViewportSize({width:390,height:844});await r.goto(base);
 await r.evaluate(async saved=>{
  const {Sender,Receiver}=await import('./protocol.mjs?v=staging-20260909-1');
  const s=await Sender.create(Uint8Array.from({length:3200},(_,i)=>(i*13)%256),'farol4-source.bin',400),receiver=new Receiver(s.meta);
  for(const i of [0,1])receiver.accept(s.packet(i));
  const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('farol4-staging',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
  await new Promise(resolve=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(receiver.snapshot(),'current');tx.oncomplete=resolve;});db.close();
  const {writeSession}=await import('./session-store.mjs?v=staging-20260909-1');writeSession(localStorage,{...saved,role:'receive',pause:{revision:5,paused:true,author:'restore-test'}});sessionStorage.setItem('farol4-staging-role','receive');
 },saved);
 await r.reload();await r.waitForFunction(()=>document.getElementById('received').textContent==='2 / 8 blocos');
 await page.waitForFunction(()=>document.getElementById('peerProgress').textContent.includes('já tem 2 de 8'));
 if(await page.locator('#nextBlock').textContent()!=='3')throw Error('Did not skip first 25% before starting');
 if(await page.locator('#play').textContent()!=='Transmitir')throw Error('Paused restoration started itself');
 await page.locator('#sendSettings summary').click();await page.locator('#fps').fill('1');
 await page.locator('#play').click();await page.waitForFunction(()=>Number(document.getElementById('sentBlocks').textContent)>=3);
 const indices=await page.evaluate(()=>{
  const c=document.getElementById('rgbCanvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height),out=[];
  for(let ch=0;ch<3;ch++){const pixels=new Uint8ClampedArray(data.data.length);for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=data.data[i+ch];pixels[i+3]=255;}const q=window.jsQR(pixels,c.width,c.height);if(q?.data.startsWith('F4|B|'))out.push(Number(q.data.split('|')[3]));}return out;
 });
 if(indices.join(',')!=='2,3,4')throw Error('Started from already received packets: '+indices);
 await page.locator('#play').click();await r.close();return {restoredPercent:25,reportedWhilePaused:true,nextBlockBeforePlay:3,firstTransmittedBlocks:indices.map(i=>i+1)};
}
