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
 await s.locator('#file').setInputFiles('output/playwright/farol4-source.bin');
 await s.waitForFunction(()=>document.querySelector('#roomStatus').textContent.startsWith('Supabase · conectado · Sala:')&&!document.querySelector('#roomQr').disabled);
 const frame=async()=>{const url=await s.locator('#rgbCanvas').evaluate(c=>c.toDataURL());await r.evaluate(url=>window.__frame(url),url);};
 await frame();await s.waitForFunction(()=>window.farol3Engine.state().sending);
 if(await s.locator('#roomCode').inputValue()!==await r.locator('#roomCode').inputValue())throw Error('Different rooms');

 await s.waitForFunction(()=>document.querySelector('#roomIdentity').textContent.includes('Outro aparelho confirmado'));
 await r.waitForFunction(()=>document.querySelector('#roomIdentity').textContent.includes('Outro aparelho confirmado'));
 const a=await s.locator('#roomIdentity').textContent(),b=await r.locator('#roomIdentity').textContent();
 if(a!==b)throw Error('Visible room identities differ');
 for(const p of [s,r]){await p.setViewportSize({width:390,height:844});if(await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Mobile overflow');}
 await context.close();return {matchingVisibleRoomAndProject:true,confirmedPeer:true,mobileNoOverflow:true};
}
