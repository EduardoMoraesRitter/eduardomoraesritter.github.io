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
 await s.waitForFunction(()=>document.querySelector('#transferStats').textContent.includes('Concluído'));
 await r.waitForFunction(()=>document.querySelector('#transferStats').textContent.includes('Concluído'));
 const download=r.waitForEvent('download');await r.locator('#saveBtn').click();await (await download).saveAs('output/playwright/farol3-room-received.bin');
 const oldCode=await s.locator('#roomCode').inputValue();
 await s.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(1600).fill(17)],'second.bin'));const input=document.querySelector('#file');input.files=dt.files;input.dispatchEvent(new Event('change'));});
 await s.waitForFunction(old=>document.querySelector('#roomCode').value!==old&&document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado · Sala:'),oldCode);
 await r.locator('#startCam').click();await r.waitForFunction(()=>window.farol3Engine.state().camera);r.once('dialog',d=>d.accept());await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 await r.locator('#roomCameraStop').click();await s.waitForFunction(()=>window.farol3Link.paused()&&!window.farol3Engine.state().sending);
 s.once('dialog',d=>d.dismiss());await s.locator('#roomReset').click();if(!(await s.locator('#roomCode').inputValue()))throw Error('Cancel reset cleared room');
 s.once('dialog',d=>d.accept());await s.locator('#roomReset').click();
 await s.waitForFunction(()=>!document.querySelector('#roomCode').value&&!window.farol3Engine.source());
 await r.waitForFunction(()=>!document.querySelector('#roomCode').value&&window.farol3Engine.state().count===0&&!window.farol3Engine.state().camera);
 await r.reload();await r.waitForTimeout(300);if(await r.evaluate(()=>window.farol3Engine.state().count))throw Error('Reset progress restored');
 await r.locator('#mRecv').click();await r.locator('#startCam').click();await r.waitForFunction(()=>window.farol3Engine.state().camera);
 await r.locator('#roomCameraStop').click();await r.waitForTimeout(1600);
 await r.evaluate(()=>{const data=new Uint8ClampedArray(100*100*4).fill(128);window.farol3Camera.guide({data,width:100,height:100},{topLeftCorner:{x:35,y:35},topRightCorner:{x:65,y:35},bottomLeftCorner:{x:35,y:65},bottomRightCorner:{x:65,y:65}});});
 if(await r.evaluate(()=>window.farol3Engine.zoom())<=1)throw Error('Auto zoom did not increase during initial sync');
 await context.close();return {opticalPair:true,autoStart:true,sameRoom:true,sharedPause:true,reconnectPreservesPause:true,verifiedCompletion:true,newFileRoom:true,cameraStopPausesPeer:true,resetBoth:true,autoZoomBeforePairing:true};
}
