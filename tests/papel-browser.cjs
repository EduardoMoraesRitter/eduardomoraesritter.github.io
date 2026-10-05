const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const a=await browser.newContext(),b=await browser.newContext();
  const p=await a.newPage(),q=await b.newPage();
  const url=process.env.PAPEL_URL||'http://127.0.0.1:4337/papel/';
  await Promise.all([p.goto(url),q.goto(url)]);
  await p.locator('#text').fill('Texto inicial 🌎');
  await p.locator('#connect').click();await p.locator('#p2p summary').click();await p.locator('#invite').click();
  await p.waitForFunction(()=>document.querySelector('#outgoing').value.includes('offer'));
  await q.locator('#connect').click();await q.locator('#p2p summary').click();await q.locator('#incoming').fill(await p.locator('#outgoing').inputValue());await q.locator('#join').click();
  await q.waitForFunction(()=>document.querySelector('#outgoing').value.includes('answer'));
  await p.locator('#incoming').fill(await q.locator('#outgoing').inputValue());await p.locator('#finish').click();
  await Promise.all([p.waitForFunction(()=>document.querySelector('#status').dataset.connected==='true'),q.waitForFunction(()=>document.querySelector('#status').dataset.connected==='true')]);
  await Promise.all([p.locator('.close').click(),q.locator('.close').click()]);
  await q.waitForFunction(()=>document.querySelector('#text').value==='Texto inicial 🌎');
  await q.locator('#text').fill('Resposta do segundo dispositivo');
  await p.waitForFunction(()=>document.querySelector('#text').value==='Resposta do segundo dispositivo');
  for(const room of [2,3]){
   await p.locator(`[data-room="${room}"]`).click();await q.locator(`[data-room="${room}"]`).click();
   assert.equal(await q.locator('#text').inputValue(),'');
   await p.locator('#text').fill(`Folha ${room} independente`);
   await q.waitForFunction(r=>document.querySelector('#text').value===`Folha ${r} independente`,room);
  }
  await p.locator('[data-room="1"]').click();assert.equal(await p.locator('#text').inputValue(),'Resposta do segundo dispositivo');
  const download=p.waitForEvent('download');await p.locator('#download').click();assert.equal((await download).suggestedFilename(),'papel-1.txt');
  await p.reload();assert.equal(await p.locator('#text').inputValue(),'Resposta do segundo dispositivo');
  await p.setViewportSize({width:390,height:844});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.screenshot({path:'output/playwright/papel-mobile.png',fullPage:true});
  await p.setViewportSize({width:1366,height:900});await p.screenshot({path:'output/playwright/papel-desktop.png',fullPage:true});
  console.log('PASS: real WebRTC, bidirectional text, three sheets, local recovery, download and mobile layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

