// Actual RGB renderer and QR decoder; virtual camera only, no physical-quality claim.
async page=>{
  for(const existing of page.context().pages())if(existing!==page)await existing.close();
  await page.setViewportSize({width:1366,height:768});
  await page.goto('http://127.0.0.1:4322/farol4/index.html');
  await page.locator('#sendSettings summary').click();await page.locator('#fps').fill('1');
  await page.locator('#calibrationSendDetails summary').click();
  await page.locator('#calibrationSend').click();
  const frames=[];
  for(let n=0;n<8;n++){
    await page.waitForFunction(n=>{
      const c=document.getElementById('rgbCanvas'),ctx=c.getContext('2d'),image=ctx.getImageData(0,0,c.width,c.height),d=image.data;
      for(let i=0;i<d.length;i+=4)d[i+1]=d[i+2]=d[i];
      return window.jsQR(d,c.width,c.height)?.data.split('|')[6]===String(n);
    },n);
    frames.push(await page.locator('#rgbCanvas').evaluate(c=>c.toDataURL()));
  }
  await page.waitForFunction(()=>document.getElementById('calibrationSendStatus').textContent.startsWith('Teste concluído'));
  const r=await page.context().newPage();await r.setViewportSize({width:390,height:844});
  await r.addInitScript(()=>{
    sessionStorage.setItem('farol4-role','receive');
    const c=document.createElement('canvas');c.width=c.height=900;
    window.__calibrationFrame=async url=>{const i=new Image();i.src=url;await i.decode();const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,900,900);x.imageSmoothingEnabled=false;x.drawImage(i,50,50,800,800);};
    navigator.mediaDevices.getUserMedia=async()=>{const s=c.captureStream(12);setInterval(()=>{c.getContext('2d').fillRect(0,0,1,1);s.getVideoTracks()[0].requestFrame();},80);return s;};
  });
  await r.goto('http://127.0.0.1:4322/farol4/index.html');
  await r.locator('#camera').click();await r.waitForFunction(()=>!document.getElementById('zoom').disabled);
  await r.locator('#calibrationReceiveDetails summary').click();await r.locator('#calibrationReceive').click();
  await r.evaluate(url=>window.__calibrationFrame(url),frames[0]);
  await r.waitForFunction(()=>document.getElementById('calibrationReceiveStatus').textContent.includes('3 de 24'));
  await r.waitForTimeout(700);
  if(!(await r.locator('#calibrationReceiveStatus').textContent()).includes('3 de 24'))throw Error('Duplicate scans counted');
  let received=3;
  for(let n=1;n<8;n++){
    if(n===3)continue;
    await r.evaluate(url=>window.__calibrationFrame(url),frames[n]);received+=3;
    await r.waitForFunction(expected=>document.getElementById('calibrationReceiveStatus').textContent.includes(`${expected} de 24`),received);
  }
  await r.locator('#calibrationReceive').click();
  const result=await r.locator('#calibrationReceiveStatus').textContent();
  if(!result.includes('21 de 24')||!result.includes('1 quadros/s'))throw Error(result);
  if((await r.locator('#received').textContent())!=='0 blocos')throw Error('Calibration modified file progress');
  await r.screenshot({path:'output/playwright/calibration-mobile.png',fullPage:true});
  return {renderedFrames:8,uniqueChannels:21,missingChannels:3,duplicatesIgnored:true,fileProgressUntouched:true,result};
}

