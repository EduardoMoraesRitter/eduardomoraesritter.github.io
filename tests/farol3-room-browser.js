async page=>{
 const context=await page.context().browser().newContext();const s=await context.newPage(),r=await context.newPage();
 await s.goto('http://127.0.0.1:4331/farol3/index.html');
 await r.addInitScript(()=>{
  const c=document.createElement('canvas');c.width=c.height=900;
  window.__frame=async url=>{const i=new Image();i.src=url;await i.decode();const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,900,900);x.imageSmoothingEnabled=false;x.drawImage(i,50,50,800,800);};
  navigator.mediaDevices.getUserMedia=async()=>c.captureStream(12);
 });
 await r.goto('http://127.0.0.1:4331/farol3/index.html');await r.locator('#mRecv').click();await r.locator('#startCam').click();
 await r.waitForFunction(()=>window.farol3Engine.state().camera);
 await s.locator('#file').setInputFiles('output/playwright/farol4-source.bin');
 await s.waitForFunction(()=>document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado · Sala:')&&!document.querySelector('#roomQr').disabled);
 const frame=async()=>{const url=await s.locator('#rgbCanvas').evaluate(c=>c.toDataURL());await r.evaluate(url=>window.__frame(url),url);};
 await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 if(await s.locator('#roomCode').inputValue()!==await r.locator('#roomCode').inputValue())throw Error('Different rooms');
 await s.locator('#roomPause').click();await r.waitForFunction(()=>window.farol3Link.paused());
 await s.waitForFunction(()=>document.querySelector('#roomPeer').textContent==='Pausado nos dois aparelhos');
 await s.locator('#roomReconnect').click();await s.waitForTimeout(1000);
 if(await s.evaluate(()=>window.farol3Engine.state().sending))throw Error('Reconnect resumed paused transfer');
 await s.locator('#fps').fill('2');await r.locator('#roomPause').click();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 for(let i=0;i<60;i++){await frame();if(await r.locator('#saveBtn').isEnabled())break;await s.waitForTimeout(300);}
 await r.waitForFunction(()=>!document.querySelector('#saveBtn').disabled);
 await s.waitForFunction(()=>!window.farol3Engine.state().sending);
 const download=r.waitForEvent('download');await r.locator('#saveBtn').click();await (await download).saveAs('output/playwright/farol3-room-received.bin');
 const oldCode=await s.locator('#roomCode').inputValue();
 await s.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(1600).fill(17)],'second.bin'));const input=document.querySelector('#file');input.files=dt.files;input.dispatchEvent(new Event('change'));});
 await s.waitForFunction(old=>document.querySelector('#roomCode').value!==old&&document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado · Sala:'),oldCode);
 await r.locator('#startCam').click();await r.waitForFunction(()=>window.farol3Engine.state().camera);r.once('dialog',d=>d.accept());await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 await r.locator('#roomCameraStop').click();await s.waitForFunction(()=>window.farol3Link.paused()&&!window.farol3Engine.state().sending);
 await context.close();return {opticalPair:true,autoStart:true,sameRoom:true,sharedPause:true,reconnectPreservesPause:true,verifiedCompletion:true,newFileRoom:true,cameraStopPausesPeer:true};
}
