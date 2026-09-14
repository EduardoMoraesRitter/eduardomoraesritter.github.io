async page=>{
 for(const version of [4,5]){
 const ctx=await page.context().browser().newContext(),p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__requests=[];navigator.mediaDevices.getUserMedia=async opts=>{window.__requests.push(opts.video.facingMode.ideal);const c=document.createElement('canvas');c.width=720;c.height=1280;const x=c.getContext('2d');x.fillStyle='#456';x.fillRect(0,0,720,1280);const stream=c.captureStream(8);window.__lastTrack=stream.getVideoTracks()[0];return stream;};});
 await p.setViewportSize({width:390,height:844});await p.goto(`http://127.0.0.1:4330/farol${version}/index.html`);await p.locator('#receiveMode').click();await p.locator('#camera').click();await p.waitForFunction(()=>window.__requests.length===1&&!document.querySelector('#switchCamera').disabled);
 const old=await p.evaluateHandle(()=>window.__lastTrack);await p.locator('#switchCamera').click();await p.waitForFunction(()=>window.__requests.length===2&&!document.querySelector('#switchCamera').disabled);
 if(await old.evaluate(t=>t.readyState)!=='ended')throw Error('Previous camera still running');
 if(await p.evaluate(()=>window.__requests.join(','))!=='environment,user')throw Error('Front camera not requested');
 await p.locator('#switchCamera').click();await p.waitForFunction(()=>window.__requests.length===3&&!document.querySelector('#switchCamera').disabled);
 await p.screenshot({path:`output/playwright/farol${version}-camera-switch.png`,fullPage:true});
 await p.locator('#sendMode').click();await p.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(800)],'arquivo_com_nome_muito_longo_'.repeat(6)+'.bin'));const input=document.querySelector('#file');input.files=dt.files;input.dispatchEvent(new Event('change'));});
 if(version===4){await p.waitForFunction(()=>!document.querySelector('#play').disabled);await p.locator('#play').click();}
 else await p.waitForFunction(()=>!document.querySelector('#qr').hidden);
 for(const width of [320,390,768,1024,1440]){await p.setViewportSize({width,height:720});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(`Overflow farol${version} width ${width}`);}
 await p.setViewportSize({width:1024,height:600});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.screenshot({path:`output/playwright/farol${version}-sender-responsive.png`,fullPage:true});
 if(errors.length)throw Error(errors.join(';'));await ctx.close();
 }
}
