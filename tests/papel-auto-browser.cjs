const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 let p,q,original,changed=false;
 try{
  const a=await browser.newContext(),b=await browser.newContext();p=await a.newPage();q=await b.newPage();
  const url=process.env.PAPEL_URL||'http://127.0.0.1:4337/public/papel/';
  await Promise.all([p.goto(url),q.goto(url)]);
  await Promise.all([p.waitForFunction(()=>document.querySelector('#status').dataset.connected==='true'),q.waitForFunction(()=>document.querySelector('#status').dataset.connected==='true')]);
  assert.equal(await p.locator('#pair').evaluate(d=>d.open),false);
  assert.equal(await q.locator('#pair').evaluate(d=>d.open),false);
  assert.equal(await p.locator('[data-room="1"]').getAttribute('aria-pressed'),'true');
  await p.waitForFunction(()=>!document.querySelector('#text').disabled);
  await p.waitForTimeout(500);original=await p.locator('#text').inputValue();
  const marker='Teste automático '+Date.now();changed=true;
  await p.locator('#text').fill(marker);await q.waitForFunction(t=>document.querySelector('#text').value===t,marker);
  await q.locator('#text').fill(original);await p.waitForFunction(t=>document.querySelector('#text').value===t,original);changed=false;
  console.log('PASS: default public room connects automatically, no dialog, sheet 01 and bidirectional sync');
 }finally{if(changed&&p)await p.locator('#text').fill(original).catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
