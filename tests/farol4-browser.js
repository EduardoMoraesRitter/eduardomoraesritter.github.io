// Run with playwright-cli run-code --filename tests/farol4-browser.js.
// Synthetic camera exercises the real RGB renderer, scanner and live return channel.
async (page) => {
  const base='http://127.0.0.1:4322/farol4/index.html';
  for(const tab of page.context().pages())if(tab!==page)await tab.close();
  await page.goto(base);
  const receiver=await page.context().newPage();
  await receiver.setViewportSize({width:390,height:844});
  await receiver.addInitScript(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=900;canvas.getContext('2d').fillRect(0,0,900,900);
    window.__cameraFrame=async url=>{const image=new Image();image.src=url;await image.decode();const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,900,900);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,50,50,800,800);};
    navigator.mediaDevices.getUserMedia=async()=>{const stream=canvas.captureStream(12);setInterval(()=>{canvas.getContext('2d').fillRect(0,0,1,1);stream.getVideoTracks()[0].requestFrame();},80);return stream;};
  });
  await receiver.goto(base);
  await receiver.waitForFunction(()=>document.getElementById('receiveMode').getAttribute('aria-pressed')==='true');
  await receiver.waitForTimeout(400);receiver.on('dialog',dialog=>dialog.accept());
  if(await receiver.locator('#discard').isEnabled()){
    await receiver.getByText('Blocos faltantes e recuperação manual',{exact:true}).click();
    await receiver.getByRole('button',{name:'Descartar recepção'}).click();
    await receiver.getByText('Blocos faltantes e recuperação manual',{exact:true}).click();
  }
  await receiver.getByRole('button',{name:'Ligar câmera e escanear',exact:true}).click();
  await receiver.waitForFunction(()=>!document.getElementById('zoom').disabled);
  if(!await receiver.getByRole('slider',{name:'Zoom da câmera'}).isEnabled())throw Error('Digital zoom unavailable');
  await receiver.getByRole('slider',{name:'Zoom da câmera'}).fill('1.2');
  await receiver.waitForFunction(()=>document.getElementById('video').style.transform==='scale(1.2)');
  await receiver.getByRole('slider',{name:'Zoom da câmera'}).fill('1');
  await receiver.getByLabel('Ajustar visão automaticamente').check();
  await page.locator('#autoStart').uncheck();
  await page.getByLabel('Arquivo · até 32 MiB').setInputFiles('output/playwright/farol4-source.bin');
  await page.getByRole('button',{name:'Transmitir',exact:true}).waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.getElementById('play').disabled);
  await page.waitForFunction(()=>!document.getElementById('showPair').disabled);
  // Explicit manual positioning exposes metadata for the partial-recovery scenario.
  await page.locator('#startBlock').fill('2');await page.locator('#startBlock').press('Tab');
  await page.locator('#startBlock').fill('1');await page.locator('#startBlock').press('Tab');
  const transferFrame=async()=>{
    const data=await page.locator('#rgbCanvas').evaluate(c=>c.toDataURL());
    await receiver.evaluate(url=>window.__cameraFrame(url),data);
  };
  await transferFrame();await receiver.waitForFunction(()=>document.getElementById('received').textContent==='0 / 8 blocos');
  await page.getByRole('slider').fill('1');
  await page.getByRole('button',{name:'Transmitir',exact:true}).click();
  await page.waitForFunction(()=>Number(document.getElementById('sentBlocks').textContent)>=3);
  await page.getByRole('button',{name:'Pausar',exact:true}).click();await transferFrame();
  await receiver.waitForFunction(()=>document.getElementById('received').textContent==='3 / 8 blocos');
  const missing=await receiver.locator('#missingList').inputValue();if(!missing||await receiver.locator('#missingCount').textContent()!=='5')throw Error('Missing count incorrect: '+missing);
  await page.locator('#autoStart').check();
  await page.getByRole('button',{name:'Criar conexão',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('connectionStatus').textContent.includes('Conexão pronta'));
  await transferFrame(); // Read the pairing QR: no manual code or connection button on receiver.
  await page.waitForFunction(()=>document.getElementById('play').textContent==='Pausar');
  // A manual pause must not be undone by repeated ready messages.
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await page.waitForTimeout(3500);
  await receiver.waitForFunction(()=>document.getElementById('receiveRate').textContent!=='—');
  if(await page.getByRole('button',{name:'Pausar',exact:true}).count())throw Error('Ready message resumed a manual pause');
  await page.waitForFunction(()=>document.getElementById('peerProgress').textContent.includes('priorizados'));
  await page.getByRole('button',{name:'Transmitir',exact:true}).click();
  for(let i=0;i<12;i++){
    await transferFrame();
    if(await receiver.getByRole('button',{name:'Salvar arquivo verificado'}).isEnabled())break;
    await page.waitForTimeout(650);
  }
  await receiver.waitForFunction(()=>!document.getElementById('save').disabled);
  await receiver.waitForFunction(()=>document.getElementById('remainingTime').textContent==='Concluído');
  await page.waitForFunction(()=>document.getElementById('peerProgress').textContent.includes('SHA-256 correto'));
  if(await page.getByRole('button',{name:'Pausar',exact:true}).count())throw Error('Sender did not stop');
  const downloadPromise=receiver.waitForEvent('download');await receiver.getByRole('button',{name:'Salvar arquivo verificado'}).click();const download=await downloadPromise;
  await download.saveAs('output/playwright/farol4-received.bin');
  await page.screenshot({path:'output/playwright/farol4-desktop.png',fullPage:true});
  await receiver.setViewportSize({width:390,height:844});
  if(await receiver.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile horizontal overflow');
  await receiver.screenshot({path:'output/playwright/farol4-mobile.png',fullPage:true});
  await receiver.reload();await receiver.getByRole('button',{name:'Receber arquivo',exact:true}).click();
  await receiver.waitForFunction(()=>!document.getElementById('save').disabled);
  await receiver.close();
  return {mobileReceiverDefault:true,digitalZoom:true,opticalPairing:true,automaticStart:true,manualPauseRespected:true,missingBeforeRecovery:missing,blocks:8,verified:true,automaticStop:true,restored:true};
}
