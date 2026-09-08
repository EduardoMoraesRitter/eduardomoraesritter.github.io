// Real Supabase, synthetic optical camera: pause either peer, rejoin, recover and save.
async page=>{
 for(const p of page.context().pages())if(p!==page)await p.close();
 await page.setViewportSize({width:1366,height:768});
 await page.goto('http://127.0.0.1:4322/farol4/index.html');
 const r=await page.context().newPage();await r.setViewportSize({width:390,height:844});
 await r.addInitScript(()=>{
  const c=document.createElement('canvas');c.width=c.height=900;
  window.__frame=async url=>{const i=new Image();i.src=url;await i.decode();const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,900,900);x.imageSmoothingEnabled=false;x.drawImage(i,50,50,800,800);};
  navigator.mediaDevices.getUserMedia=async()=>{const s=c.captureStream(12);setInterval(()=>{c.getContext('2d').fillRect(0,0,1,1);s.getVideoTracks()[0].requestFrame();},80);return s;};
 });
 r.on('dialog',d=>d.accept());await r.goto('http://127.0.0.1:4322/farol4/index.html');await r.waitForTimeout(400);
 if(await r.locator('#discard').isEnabled()){await r.locator('.recoveryDetails summary').click();await r.locator('#discard').click();}
 await r.locator('#camera').click();await r.waitForFunction(()=>!document.getElementById('zoom').disabled);
 await page.locator('#file').setInputFiles('output/playwright/farol4-source.bin');await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
 const frame=async()=>{const url=await page.locator('#rgbCanvas').evaluate(c=>c.toDataURL());await r.evaluate(url=>window.__frame(url),url);};
 await frame();await page.waitForFunction(()=>document.getElementById('play').textContent==='Pausar');
 await r.waitForFunction(()=>document.getElementById('linkStatus').dataset.state==='paired');
 if(await page.locator('#roomLabel').textContent()!==await r.locator('#roomLabel').textContent())throw Error('Different rooms');
 await page.locator('#play').click();
 await r.waitForFunction(()=>document.getElementById('transferState').textContent==='Pausado nos dois aparelhos');
 await page.waitForFunction(()=>document.getElementById('transferState').textContent==='Pausado nos dois aparelhos');
 await r.locator('#pauseReceiver').click();await page.waitForFunction(()=>document.getElementById('play').textContent==='Pausar');
 await r.locator('#pauseReceiver').click();await page.waitForFunction(()=>document.getElementById('transferState').textContent==='Pausado nos dois aparelhos');
 const count=await r.locator('#received').textContent();await frame();await r.waitForTimeout(700);
 if(count!==await r.locator('#received').textContent())throw Error('Receiver accepted data while paused');
 await page.locator('#retryConnection').click();
 await page.waitForFunction(()=>document.getElementById('linkStatus').dataset.state==='paired');
 await r.waitForTimeout(1200);
 if(await page.locator('#play').textContent()!=='Transmitir')throw Error('Reconnect resumed paused transfer');
 await page.locator('#sendSettings summary').click();await page.locator('#fps').fill('1');
 await page.locator('#play').click();
 for(let i=0;i<35;i++){await frame();if(await r.locator('#save').isEnabled())break;await page.waitForTimeout(450);}
 await r.waitForFunction(()=>!document.getElementById('save').disabled);
 await page.waitForFunction(()=>document.getElementById('peerProgress').textContent.includes('SHA-256 correto'));
 const d=r.waitForEvent('download');await r.locator('#save').click();await (await d).saveAs('output/playwright/farol4-received.bin');
 await r.screenshot({path:'output/playwright/review-completed-mobile.png'});
 await r.reload();await r.waitForFunction(()=>!document.getElementById('save').disabled);
 return {senderPause:true,receiverPause:true,resumeFromEitherPeer:true,pauseSurvivesReconnect:true,verified:true,restored:true};
}
