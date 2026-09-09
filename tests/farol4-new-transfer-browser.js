async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/farol4/realtime.mjs*',route=>route.fulfill({contentType:'application/javascript',body:`export class ReturnChannel {constructor(m,s){this.onState=s;this.identity='test';this.ready=false;}async close(){this.ready=false;this.roomId=null;}async connect(u,k,c){this.ready=true;this.roomId=c.slice(0,12);this.onState('SUBSCRIBED');}async send(){return true;}}`}));
 await p.route('**/farol4/app.mjs*',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:await res.text()+`\nwindow.__test={receivePacket,state:()=>({receiver:receiver?.meta.id,count:receiver?.count,pairTarget,room:connection.roomId}),seedRoom:()=>{restoredRoom={file:'a'.repeat(64)+':400',cursor:0};}};`});});
 await p.setViewportSize({width:390,height:844});await p.goto('http://127.0.0.1:4322/farol4/index.html');await p.locator('#receiveMode').click();
 await p.evaluate(async()=>{const {Sender}=await import('/farol4/protocol.mjs');window.__a=await Sender.create(new Uint8Array(800).fill(1),'primeiro.bin',400);window.__b=await Sender.create(new Uint8Array(800).fill(2),'segundo.bin',400);window.__test.receivePacket(window.__a.metadata());window.__test.receivePacket(window.__a.packet(0));const {pairPacket}=await import('/farol4/pairing.mjs');window.__test.receivePacket(pairPacket({url:document.querySelector('#supabaseUrl').value,code:'bc'.repeat(32),file:window.__b.meta.id}));});
 if(!(await p.locator('#newReceive').textContent()).includes('detectado'))throw Error('Missing new-file action');
 p.once('dialog',d=>d.dismiss());await p.locator('#newReceive').click();if(await p.evaluate(()=>window.__test.state().count)!==1)throw Error('Cancel lost data');
 p.once('dialog',d=>d.accept());await p.locator('#newReceive').click();await p.waitForFunction(()=>window.__test.state().pairTarget===window.__b.meta.id);await p.evaluate(()=>window.__test.receivePacket(window.__b.metadata()));await p.waitForFunction(()=>document.querySelector('#receiveName').textContent==='segundo.bin');
 if(await p.evaluate(()=>window.__test.state().count)!==0)throw Error('New file retained old blocks');
 await p.evaluate(()=>{window.__test.receivePacket(window.__b.packet(0));window.__test.receivePacket(window.__b.packet(1));});await p.waitForFunction(()=>!document.querySelector('#save').disabled);
 p.once('dialog',d=>d.accept());await p.locator('#newReceive').click();await p.waitForFunction(()=>!window.__test.state().receiver);
 await p.reload();await p.waitForTimeout(500);if(await p.evaluate(()=>window.__test.state().receiver))throw Error('Discarded file restored');
 await p.locator('#sendMode').click();await p.evaluate(()=>window.__test.seedRoom());await p.locator('#file').setInputFiles('tests/farol5/fixture.bin');await p.waitForFunction(()=>document.querySelector('#sendName').textContent==='fixture.bin');await p.waitForFunction(()=>!document.querySelector('#showPair').disabled);
 if((await p.locator('#notice').textContent()).includes('não é o arquivo'))throw Error('Restored sender blocks new file');
 if(errors.length)throw Error(errors.join(';'));
 await p.locator('#receiveMode').click();if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');await p.screenshot({path:'output/playwright/farol4-new-reception.png',fullPage:true});await context.close();
}
