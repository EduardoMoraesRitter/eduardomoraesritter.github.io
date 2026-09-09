// Run with playwright-cli run-code --filename; only synthetic video is used.
async page=>{
 await page.addInitScript(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=200;
  navigator.mediaDevices.getUserMedia=async()=>{
   const stream=canvas.captureStream(10);setInterval(()=>{canvas.getContext('2d').fillRect(0,0,200,200);stream.getVideoTracks()[0].requestFrame();},100);return stream;
  };
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4322/farol4/index.html');
 await page.locator('#receiveMode').click();
 await page.waitForFunction(()=>document.getElementById('transferState').dataset.diagnostic==='camera-off');
 const notice=await page.locator('#notice').textContent();
 try{
  await page.context().setOffline(true);
  await page.waitForFunction(()=>document.getElementById('transferState').dataset.diagnostic==='offline');
  if(await page.locator('#notice').textContent()!==notice)throw Error('Diagnosis overwrote actionable notice');
 }finally{await page.context().setOffline(false);}
 await page.locator('#camera').click();
 await page.waitForFunction(()=>document.getElementById('transferState').dataset.diagnostic==='camera-ready');
 await page.waitForFunction(()=>document.getElementById('transferState').dataset.diagnostic==='no-qr',{timeout:12000});
 await page.locator('#camera').click();
 await page.waitForFunction(()=>document.getElementById('transferState').dataset.diagnostic==='camera-off');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({offline:true,noticePreserved:true,cameraOff:true,noQrAfterGrace:true,errors}));
}
