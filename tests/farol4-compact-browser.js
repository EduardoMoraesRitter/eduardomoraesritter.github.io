async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.locator('#openAudioTools').click();if(!await p.locator('#extractAudio').isVisible())throw Error('Audio hidden');
 await p.locator('#printsVideo').setInputFiles('output/video-prints-test/large.mp4');
 if(await p.locator('#printsCompact').inputValue()!=='original')throw Error('Original not default');
 await p.locator('#printsCompact').selectOption('compact');await p.locator('#printsDimension').selectOption('800');await p.locator('#printsQuality').selectOption('0.65');await p.locator('#previewPrints').click();
 await p.waitForFunction(()=>!document.querySelector('#printsPreview').hidden);
 if(!(await p.locator('#previewSize').textContent()).includes('800×450'))throw Error('Preview not resized');
 await p.locator('#generatePrints').click();await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('selecionado para transmitir'));
 const download=p.waitForEvent('download');await p.locator('#downloadPrints').click();await (await download).saveAs('output/video-prints-test/compact.zip');
 await p.setViewportSize({width:390,height:844});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');
 await context.close();return {audioVisible:true,originalDefault:true,preview:true,resized:true,zip:true,mobile:true};
}
