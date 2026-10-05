const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const contexts=await Promise.all([browser.newContext(),browser.newContext(),browser.newContext()]);
  const [p,q,r]=await Promise.all(contexts.map(c=>c.newPage()));
  const url=process.env.PAPEL_URL||'http://127.0.0.1:4337/public/papel/';
  await Promise.all([p.goto(url),q.goto(url),r.goto(url)]);
  const name='teste-'+Date.now().toString(36),password='Senha teste forte 12345';
  async function enter(page,type,pwd){
   await page.locator('#connect').click();await page.locator('#roomName').fill(name);await page.locator('#roomType').selectOption(type);
   if(type==='password')await page.locator('#roomPassword').fill(pwd);
   await page.locator('#enterNamed').click();await page.waitForFunction(()=>!document.querySelector('#enterNamed').disabled);
   await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Sala teste-'),{},{timeout:30000});
   await page.locator('.close').click();
  }
  await p.locator('#text').fill('Rascunho local não deve ir à sala pública');
  await enter(p,'public');assert.equal(await p.locator('#text').inputValue(),'');
  await enter(q,'public');await p.locator('#text').fill('Texto da sala pública');
  await q.waitForFunction(()=>document.querySelector('#text').value==='Texto da sala pública');
  await enter(p,'password',password);assert.equal(await p.locator('#text').inputValue(),'');
  await enter(q,'password',password);await p.locator('#text').fill('Texto protegido');
  await q.waitForFunction(()=>document.querySelector('#text').value==='Texto protegido');
  await enter(r,'password','Senha errada diferente 67890');await r.waitForTimeout(1500);assert.equal(await r.locator('#text').inputValue(),'');
  const storage=await p.evaluate(()=>JSON.stringify(localStorage));assert.ok(!storage.includes(password));
  const hash=await p.evaluate(()=>location.hash);assert.ok(hash.includes('nome='));assert.ok(!hash.includes(password));assert.ok(!hash.includes('sala='));
  await p.locator('#connect').click();assert.equal(await p.locator('#recentRooms button').count(),2);await p.locator('.close').click();
  await enter(p,'public');assert.equal(await p.locator('#text').inputValue(),'Texto da sala pública');
  await p.reload();await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('Sala teste-'));
  assert.equal(await p.locator('#recentRooms button').count(),2);
  await p.locator('#clearRooms').click();assert.equal(await p.locator('#recentRooms button').count(),0);
  await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:'output/playwright/papel-named-mobile.png',fullPage:true});
  console.log('PASS: public named room, password room, wrong password isolated, notes isolated, recent rooms saved without passwords, reload and mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

