async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.route('**/farol3/index.html*',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:(await res.text()).replace('  restoreSession();',`window.__roundtrip=async function(){var d=new Decoder(K,blockSize);for(var n=0;n<K*20+100&&!d.done();n++)d.add(n,makeDroplet(n,blocks,K,blockSize,cdf));if(!d.done())throw Error('Decoder incomplete');var out=d.assemble(packed.length);if(packed.length<origSize)out=pako.ungzip(out);var input=new Uint8Array(await fileInput.files[0].arrayBuffer());if(out.length!==input.length||out.some((b,i)=>b!==input[i]))throw Error('File differs');return {bytes:out.length,gzip:packed.length<origSize};};\n  restoreSession();`)});});
 await p.goto('http://127.0.0.1:4331/farol3/index.html');
 await p.locator('#openAudioTools').click();await p.locator('#printsVideo').setInputFiles('output/video-prints-test/repeated.mp4');
 await p.locator('#printsDedupe').check();await p.locator('#printsCompact').selectOption('compact');await p.locator('#printsDimension').selectOption('800');
 await p.locator('#generatePrints').click();await p.waitForFunction(()=>document.querySelector('#fileName').textContent==='repeated-prints.zip'&&!document.querySelector('#playBtn').disabled);
 if(!(await p.locator('#printsStatus').textContent()).includes('4 descartadas'))throw Error('Dedupe missing');
 await p.locator('#previewPrints').click();await p.waitForFunction(()=>!document.querySelector('#printsPreview').hidden);
 await p.setViewportSize({width:390,height:844});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 const prints=await p.evaluate(()=>window.__roundtrip());
 await p.locator('#printsVideo').setInputFiles('output/video-prints-test/audio.mp4');await p.locator('#extractAudio').click();
 await p.waitForFunction(()=>document.querySelector('#fileName').textContent==='audio-audio.zip'&&!document.querySelector('#playBtn').disabled);
 const audio=await p.evaluate(()=>window.__roundtrip());
 await p.evaluate(()=>{const bytes=crypto.getRandomValues(new Uint8Array(2000)),dt=new DataTransfer();dt.items.add(new File([bytes],'random.bin'));const input=document.querySelector('#file');input.files=dt.files;input.dispatchEvent(new Event('change'));});
 await p.waitForFunction(()=>document.querySelector('#fileName').textContent==='random.bin');
 const random=await p.evaluate(()=>window.__roundtrip());if(random.gzip)throw Error('Random data should remain uncompressed');
 await context.close();return {prints,audio,random};
}
