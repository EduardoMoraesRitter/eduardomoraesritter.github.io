async page=>{
 const context=await page.context().browser().newContext();const s=await context.newPage(),r=await context.newPage();
 await context.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient(){let bus;return {channel(topic){bus=new BroadcastChannel(topic);const c={on(_,__,fn){bus.onmessage=e=>fn(e.data);return c;},subscribe(fn){setTimeout(()=>fn('SUBSCRIBED'),20);return c;},async send(m){bus.postMessage({payload:m.payload});return 'ok';}};return c;},async removeAllChannels(){bus?.close();},realtime:{disconnect(){}}};}};`}));
 await s.goto('http://127.0.0.1:4331/farol3/index.html');
 await r.addInitScript(()=>{
  const c=document.createElement('canvas');c.width=c.height=900;
  window.__frame=async url=>{const i=new Image();i.src=url;await i.decode();const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,900,900);x.imageSmoothingEnabled=false;x.drawImage(i,50,50,800,800);};
  navigator.mediaDevices.getUserMedia=async()=>c.captureStream(12);
 });
 await r.goto('http://127.0.0.1:4331/farol3/index.html');await r.locator('#mRecv').click();await r.locator('#startCam').click();
 await r.waitForFunction(()=>window.farol3Engine.state().camera);
 await s.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([crypto.getRandomValues(new Uint8Array(12000))],'partial.bin'));const i=document.querySelector('#file');i.files=dt.files;i.dispatchEvent(new Event('change'));});
 await s.waitForFunction(()=>document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado · Sala:')&&!document.querySelector('#roomQr').disabled);
 const frame=async()=>{const url=await s.locator('#rgbCanvas').evaluate(c=>c.toDataURL());await r.evaluate(url=>window.__frame(url),url);};
 await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 if(await s.locator('#roomCode').inputValue()!==await r.locator('#roomCode').inputValue())throw Error('Different rooms');

 for(let i=0;i<90;i++){await frame();const v=await r.evaluate(()=>window.farol3Engine.state());if(v.count>0&&v.count<v.total)break;await s.waitForTimeout(180);}
 const before=await r.evaluate(()=>window.farol3Engine.state());if(!before.count||before.done)throw Error('No partial reception');
 await r.locator('#roomReconnect').click();await s.waitForFunction(()=>document.querySelector('#roomPeer').textContent.includes('Centralize'));
 await s.waitForFunction(()=>!window.farol3Engine.state().sending);
 await s.waitForTimeout(1500);if(await s.evaluate(()=>window.farol3Engine.state().sending))throw Error('Premature resume');
 if(await r.evaluate(()=>window.farol3Engine.state().count)!==before.count)throw Error('Progress changed before scan');
 await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 await r.waitForFunction(()=>!window.farol3Link.paused());
 if(await r.evaluate(()=>window.farol3Engine.state().count)<before.count)throw Error('Progress lost');
 const oldRoom=await s.locator('#roomCode').inputValue();
 await s.evaluate(()=>document.querySelector('#file').dispatchEvent(new Event('change')));
 await s.waitForFunction(old=>document.querySelector('#roomCode').value!==old&&document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado'),oldRoom);
 await r.locator('#roomReconnect').click();await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 if(await r.evaluate(()=>window.farol3Engine.state().count)<before.count)throw Error('Same-file new room lost progress');
 await context.close();return {partialBlocksPreserved:before.count,total:before.total,receiverReconnectWaitedForQr:true};
}
