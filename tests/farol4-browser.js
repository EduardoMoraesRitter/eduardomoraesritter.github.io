// Run with playwright-cli run-code --filename tests/farol4-browser.js.
// Synthetic camera exercises the real RGB renderer, scanner and live return channel.
async (page) => {
  const base='http://127.0.0.1:4322/farol4/index.html';
  for(const tab of page.context().pages())if(tab!==page)await tab.close();
  await page.goto(base);
  const receiver=await page.context().newPage();
  await receiver.addInitScript(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=900;
    window.__cameraFrame=async url=>{const image=new Image();image.src=url;await image.decode();const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,900,900);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,50,50,800,800);};
    navigator.mediaDevices.getUserMedia=async()=>canvas.captureStream(12);
  });
  await receiver.goto(base);await receiver.getByRole('button',{name:'Receber arquivo',exact:true}).click();
  await receiver.waitForTimeout(400);receiver.on('dialog',dialog=>dialog.accept());
  if(await receiver.getByRole('button',{name:'Descartar recepção'}).isEnabled())await receiver.getByRole('button',{name:'Descartar recepção'}).click();
  await receiver.getByRole('button',{name:'Ligar câmera',exact:true}).click();
  await page.getByLabel('Arquivo · até 32 MiB').setInputFiles('output/playwright/farol4-source.bin');
  await page.getByRole('button',{name:'Transmitir',exact:true}).waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.getElementById('play').disabled);
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
  const missing=await receiver.locator('#missingList').inputValue();if(missing!=='4-8')throw Error('Missing list incorrect: '+missing);
  await page.getByRole('button',{name:'Criar conexão',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('connectionStatus').textContent.includes('Conexão pronta'));
  const code=await page.getByLabel('Código de conexão').inputValue();
  await receiver.getByLabel('Código de conexão').fill(code);await receiver.getByRole('button',{name:'Entrar na conexão',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('peerProgress').textContent.includes('priorizados'));
  await page.getByRole('button',{name:'Transmitir',exact:true}).click();
  for(let i=0;i<12;i++){
    await transferFrame();
    if(await receiver.getByRole('button',{name:'Salvar arquivo verificado'}).isEnabled())break;
    await page.waitForTimeout(650);
  }
  await receiver.waitForFunction(()=>!document.getElementById('save').disabled);
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
  return {missingBeforeRecovery:missing,blocks:8,verified:true,automaticStop:true,restored:true};
}
