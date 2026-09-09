async (page) => {
 const browser=page.context().browser();const tc=await browser.newContext(),rc=await browser.newContext(); const tx=await tc.newPage(),rx=await rc.newPage();
 const errors=[];for(const p of [tx,rx])p.on('pageerror',e=>errors.push(e.message));
 await tx.addInitScript(()=>{
 const Native=window.AudioWorkletNode;window.AudioWorkletNode=class extends Native{constructor(...a){super(...a);window.__node=this;}};
 navigator.mediaDevices.getUserMedia=async()=>{const c=new AudioContext();window.__fakeMic=c;return c.createMediaStreamDestination().stream;};
 });
 await rx.addInitScript(()=>{
 window.__sounds=[];AudioBufferSourceNode.prototype.start=function(){window.__sounds.push(Array.from(this.buffer.getChannelData(0)));setTimeout(()=>this.onended?.(),20);};
 navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=c.height=900;window.__camera=c;const stream=c.captureStream(10);window.__cameraStream=stream;return stream;};
 });
 await tx.setViewportSize({width:1440,height:1000});await rx.setViewportSize({width:390,height:844});
 const url='http://127.0.0.1:4322/farol5/index.html';await tx.goto(url);await rx.goto(url);

 await tx.locator('#mic').click();await tx.waitForFunction(()=>window.__node);
 await tx.locator('#file').setInputFiles('tests/farol5/fixture.bin');
 await tx.waitForFunction(()=>!document.querySelector('#qr').hidden);
 await rx.locator('#camera').click();await rx.waitForFunction(()=>window.__camera);
 const optical=async()=>{const src=await tx.locator('#qr').evaluate(c=>c.toDataURL());await rx.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const c=window.__camera,ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);},src);};
 const sound=async()=>{const pcm=await rx.evaluate(()=>window.__sounds.shift());if(!pcm)return false;await tx.evaluate(pcm=>{for(let i=0;i<pcm.length+48000;i+=1024){const a=new Float32Array(1024);a.set(pcm.slice(i,i+1024));window.__node.port.onmessage({data:a});}},pcm);return true;};
 await optical();await rx.waitForFunction(()=>window.__sounds.length>0,{timeout:15000});await sound();
 await tx.waitForFunction(()=>document.querySelector('#audioStatus').textContent.includes('autenticado'));
 // Pause before transferring data, confirm optically, and resume acoustically.
 await rx.locator('#pauseRx').click();await rx.waitForFunction(()=>window.__sounds.length>0);await sound();
 await tx.waitForFunction(()=>document.querySelector('#pauseTx').textContent==='Continuar envio');await optical();await rx.waitForTimeout(400);
 await rx.locator('#pauseRx').click();await rx.waitForFunction(()=>window.__sounds.length>0);await sound();await tx.waitForFunction(()=>document.querySelector('#pauseTx').textContent==='Pausar envio');
 const end=Date.now()+28000;while(Date.now()<end){await optical();await sound();await rx.waitForTimeout(190);if((await rx.locator('#status').textContent()).includes('confirmada nos dois'))break;}
 if(!(await rx.locator('#status').textContent()).includes('confirmada nos dois'))throw Error('Transfer incomplete: '+await rx.locator('#status').textContent()+' / '+await rx.locator('#progress').textContent());
 const bytes=await rx.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('farol5');q.onsuccess=()=>{const r=q.result.transaction('sessions').objectStore('sessions').get('current');r.onsuccess=()=>resolve(Array.from(r.result.bytes));};}));
 if(bytes.length!==3200||bytes.some((v,i)=>v!==(i*17)%256))throw Error('Restored bytes differ');
 await tx.screenshot({path:'output/playwright/farol5-desktop.png',fullPage:true});await rx.screenshot({path:'output/playwright/farol5-mobile.png',fullPage:true});
 for(const p of [tx,rx])if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
 await rx.reload();await rx.waitForFunction(()=>!document.querySelector('#save').hidden);if(!(await rx.locator('#progress').textContent()).includes('8/8'))throw Error('Reload lost progress');
 if(errors.length)throw Error(errors.join('; '));
 await tx.evaluate(()=>document.body.dataset.testResult='PASS: acoustic feedback, pause/resume, RGB transfer, integrity, persistence, layouts');
}
