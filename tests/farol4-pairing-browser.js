// Fresh optical pairing before metadata, bidirectional confirmation, same-room rejoin.
async page => {
  for(const p of page.context().pages())if(p!==page)await p.close();
  await page.setViewportSize({width:1280,height:900});
  await page.goto('http://127.0.0.1:4322/farol4/index.html');
  const receiver=await page.context().newPage();
  await receiver.setViewportSize({width:390,height:844});
  await receiver.addInitScript(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=900;
    window.__cameraFrame=async url=>{const img=new Image();img.src=url;await img.decode();const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,900,900);c.imageSmoothingEnabled=false;c.drawImage(img,50,50,800,800);};
    navigator.mediaDevices.getUserMedia=async()=>{const s=canvas.captureStream(12);setInterval(()=>{canvas.getContext('2d').fillRect(0,0,1,1);s.getVideoTracks()[0].requestFrame();},80);return s;};
  });
  receiver.on('dialog',d=>d.accept());
  await receiver.goto('http://127.0.0.1:4322/farol4/index.html');
  await receiver.waitForTimeout(500);
  if(await receiver.locator('#discard').isEnabled()){
    await receiver.getByText('Blocos faltantes e recuperação manual',{exact:true}).click();
    await receiver.getByRole('button',{name:'Descartar recepção',exact:true}).click();
  }
  await receiver.getByRole('button',{name:'Ligar câmera e escanear',exact:true}).click();
  await receiver.waitForFunction(()=>!document.getElementById('zoom').disabled);
  await page.locator('#autoStart').uncheck();
  await page.getByLabel('Arquivo · até 32 MiB').setInputFiles('output/playwright/farol4-source.bin');
  await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
  if(await page.locator('#play').textContent()!=='Transmitir')throw Error('Started before receiver was ready');
  if(await page.locator('#linkStatus').getAttribute('data-state')!=='waiting')throw Error('False peer confirmation');
  const frame=await page.locator('#rgbCanvas').evaluate(c=>c.toDataURL());
  await receiver.evaluate(url=>window.__cameraFrame(url),frame);
  await receiver.waitForFunction(()=>document.getElementById('linkStatus').dataset.state==='paired');
  if(await page.locator('#play').textContent()!=='Transmitir')throw Error('Manual start option ignored');
  await page.locator('#autoStart').check();
  await page.getByRole('button',{name:'Mostrar QR de conexão',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('play').textContent==='Pausar');
  await receiver.waitForFunction(()=>document.getElementById('linkStatus').dataset.state==='paired');
  const room=await page.locator('#roomLabel').textContent();
  if(room!==await receiver.locator('#roomLabel').textContent()||room==='Sala: —')throw Error('Rooms differ');
  // Only the pairing image reached the camera; metadata has not arrived yet.
  if(await receiver.locator('#received').textContent()!=='0 blocos')throw Error('Unexpected preexisting metadata');
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await receiver.getByRole('button',{name:'Parar câmera',exact:true}).click();
  await receiver.getByText('Conexão entre os aparelhos',{exact:true}).click();
  await receiver.getByRole('button',{name:'Desconectar',exact:true}).click();
  await receiver.waitForTimeout(1200);
  if(await receiver.locator('#serviceStatus').textContent()==='Supabase · conectado')throw Error('Disconnect not shown');
  await receiver.getByRole('button',{name:'Reconectar',exact:true}).click();
  await receiver.waitForFunction(()=>document.getElementById('linkStatus').dataset.state==='paired');
  if(room!==await receiver.locator('#roomLabel').textContent())throw Error('Room changed on retry');
  if(await page.locator('#play').textContent()!=='Transmitir')throw Error('Reconnect resumed manual pause');
  await receiver.evaluate(()=>scrollTo(0,0));
  await receiver.screenshot({path:'output/playwright/farol4-room-mobile.png'});
  return {firstQrPairs:true,roomMatches:true,bothPeersConfirmed:true,reconnectSameRoom:true,manualPauseRespected:true};
}
