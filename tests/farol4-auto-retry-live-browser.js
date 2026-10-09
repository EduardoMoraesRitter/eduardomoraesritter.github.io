// Run with playwright-cli run-code. Uses real Supabase and a simulated optical camera.
// The current page selects the origin, allowing the same check locally and after deploy.
async page=>{
 const base=new URL('/farol4/',page.url()).href;
 const context=await page.context().browser().newContext();
 const s=await context.newPage(),r=await context.newPage();
 const errors=[];s.on('pageerror',e=>errors.push(e.message));r.on('pageerror',e=>errors.push(e.message));
 let phase='camera';try{
  await r.addInitScript(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=900;
   const c=canvas.getContext('2d');
   window.__blank=()=>{c.fillStyle='white';c.fillRect(0,0,900,900);};
   window.__frame=async url=>{const i=new Image();i.src=url;await i.decode();window.__blank();c.imageSmoothingEnabled=false;c.drawImage(i,50,50,800,800);};
   navigator.mediaDevices.getUserMedia=async()=>{
    window.__blank();const stream=canvas.captureStream(12);
    setInterval(()=>{c.fillRect(0,0,1,1);stream.getVideoTracks()[0]?.requestFrame();},80);
    return stream;
   };
  });
  await s.goto(base+'?v=20261009-1');await r.goto(base+'?v=20261009-1');
  await r.locator('#receiveMode').click();await r.locator('#camera').click();
  await r.waitForFunction(()=>document.querySelector('#camera').textContent.startsWith('Parar'));
  await s.locator('#sendSettings > summary').click();await s.locator('#fps').focus();await s.locator('#fps').press('Home');
  await s.locator('#file').setInputFiles('output/playwright/farol4-source.bin');
  phase='room creation';
  await s.waitForFunction(()=>!document.querySelector('#showPair').disabled);
  const feed=async()=>r.evaluate(url=>window.__frame(url),await s.locator('#rgbCanvas').evaluate(c=>c.toDataURL()));
  phase='optical pair';await feed();await s.waitForFunction(()=>document.querySelector('#play').textContent==='Pausar');
  phase='metadata';
  await feed();await r.waitForFunction(()=>document.querySelector('#receiveName').textContent.includes('farol4-source.bin'));
  if(await s.locator('#roomLabel').textContent()!==await r.locator('#roomLabel').textContent())throw Error('Different rooms');
  phase='first blocks';await s.waitForTimeout(1100);await feed();
  await r.waitForFunction(()=>parseInt(document.querySelector('#received').textContent)>0);
  await r.evaluate(()=>window.__blank());
  const received=await r.locator('#received').textContent();
  phase='automatic pause';await r.waitForFunction(()=>document.querySelector('#pauseReceiver').textContent==='Manter pausado',null,{timeout:35000});
  await s.waitForFunction(()=>document.querySelector('#play').textContent==='Transmitir');
  phase='automatic resume';await r.waitForFunction(()=>document.querySelector('#notice').textContent.startsWith('Retomada'),null,{timeout:12000});
  await s.waitForFunction(()=>document.querySelector('#play').textContent==='Pausar');
  if(await r.locator('#received').textContent()!==received)throw Error('Progress lost during retry');
  // Explicit pause and stopping the camera must never be automatically undone.
  phase='manual pause';await r.locator('#pauseReceiver').click();
  await s.waitForFunction(()=>document.querySelector('#play').textContent==='Transmitir');
  await s.waitForTimeout(6500);
  if(await s.locator('#play').textContent()!=='Transmitir')throw Error('Manual pause resumed');
  await r.locator('#camera').click();await s.waitForTimeout(5500);
  if(await s.locator('#play').textContent()!=='Transmitir')throw Error('Camera stop resumed');
  phase='camera restart';await r.locator('#camera').click();await r.locator('#pauseReceiver').click();
  await s.waitForFunction(()=>document.querySelector('#play').textContent==='Pausar');
  phase='completion';for(let i=0;i<100;i++){
   await feed();if(await r.locator('#save').isEnabled())break;
   await s.waitForTimeout(200);
  }
  await r.waitForFunction(()=>!document.querySelector('#save').disabled);
  await s.waitForFunction(()=>document.querySelector('#transferState').textContent==='Arquivo entregue');
  const download=r.waitForEvent('download');await r.locator('#save').click();
  await (await download).saveAs('output/playwright/farol4-auto-retry-received.bin');
  if(errors.length)throw Error(errors.join('\n'));
  return {origin:base,realSupabase:true,opticalPair:true,automaticPauseAndResume:true,
   partialProgressPreserved:true,manualPauseRespected:true,cameraStopRespected:true,verifiedDownload:true};
 }catch(e){
  const status=async p=>p.evaluate(()=>Object.fromEntries(['notice','serviceStatus','connectionStatus','transferState','received','play','camera','pauseReceiver'].map(id=>[id,document.getElementById(id)?.textContent])));
  throw Error(phase+': '+e.message+' '+JSON.stringify({sender:await status(s),receiver:await status(r),errors}));
 }finally{await context.close();}
}
