const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const a=await browser.newContext(),b=await browser.newContext(),c=await browser.newContext();
  const p=await a.newPage(),q=await b.newPage(),r=await c.newPage();
  const url=process.env.PAPEL_URL||'http://127.0.0.1:4337/papel/';
  const frames=[];
  p.on('websocket',socket=>{if(socket.url().includes('supabase'))socket.on('framesent',frame=>frames.push(String(frame.payload)));});
  await p.goto(url);await p.locator('#text').fill('SENTINELA-SECRETA-123 🌎');
  await p.locator('#connect').click();await p.locator('#newRoom').click();
  await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('Sala online'),{},{timeout:30000});
  const link=await p.locator('#roomLink').inputValue();assert.ok(link.includes('#sala='));
  await q.goto(link);
  await q.waitForFunction(()=>document.querySelector('#text').value==='SENTINELA-SECRETA-123 🌎',{},{timeout:30000});
  await p.locator('.close').click();await q.locator('#text').fill('Resposta pelo servidor');
  await p.waitForFunction(()=>document.querySelector('#text').value==='Resposta pelo servidor');
  assert.ok(frames.some(f=>f.includes('paper')));assert.ok(!frames.join('\n').includes('SENTINELA-SECRETA-123'));
  // Third browser receives via P2P from the browser bridging the relay.
  await r.goto(url);await p.locator('#connect').click();await p.locator('#p2p summary').click();await p.locator('#invite').click();
  await p.waitForFunction(()=>document.querySelector('#outgoing').value.includes('offer'));
  await r.locator('#connect').click();await r.locator('#p2p summary').click();await r.locator('#incoming').fill(await p.locator('#outgoing').inputValue());await r.locator('#join').click();
  await r.waitForFunction(()=>document.querySelector('#outgoing').value.includes('answer'));
  await p.locator('#incoming').fill(await r.locator('#outgoing').inputValue());await p.locator('#finish').click();
  await r.waitForFunction(()=>document.querySelector('#text').value==='Resposta pelo servidor');
  await p.locator('.close').click();await r.locator('.close').click();
  await r.locator('#text').fill('Ponte do P2P para Supabase');
  await q.waitForFunction(()=>document.querySelector('#text').value==='Ponte do P2P para Supabase');
  await q.locator('#text').fill('Ponte do Supabase para P2P');
  await r.waitForFunction(()=>document.querySelector('#text').value==='Ponte do Supabase para P2P');
  for(const room of [2,3]){
   for(const page of [p,q,r])await page.locator(`[data-room="${room}"]`).click();
   await q.locator('#text').fill(`Sala online folha ${room}`);
   await r.waitForFunction(n=>document.querySelector('#text').value===`Sala online folha ${n}`,room);
  }
  await p.locator('#connect').click();await p.locator('#disconnect').click();await p.locator('.close').click();
  await q.locator('#text').fill('Servidor permanece após desligar P2P');
  await p.waitForFunction(()=>document.querySelector('#text').value==='Servidor permanece após desligar P2P');
  await q.reload();await q.waitForFunction(()=>document.querySelector('#status').dataset.connected==='true');
  await q.locator('[data-room="3"]').click();assert.equal(await q.locator('#text').inputValue(),'Servidor permanece após desligar P2P');
  await p.locator('#connect').click();await p.setViewportSize({width:390,height:844});
  await p.screenshot({path:'output/playwright/papel-dual-mobile.png',fullPage:true});
  console.log('PASS: real Supabase, encrypted WebSocket payload, bidirectional relay, three sheets, reconnect and P2P bridge both ways');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
