async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.locator('#videoPrintsPanel summary').click();await p.locator('#printsVideo').setInputFiles('output/video-prints-test/audio.mp4');
 await p.locator('#extractAudio').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('Áudio em ZIP'));
 await p.waitForFunction(()=>document.querySelector('#sendName').textContent==='audio-audio.zip');
 const download=p.waitForEvent('download');await p.locator('#downloadPrints').click();await (await download).saveAs('output/video-prints-test/browser-audio.zip');
 await p.locator('#extractAudio').click();await p.locator('#cancelPrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent==='Extração cancelada.');
 await context.close();return {audioZip:true,selected:true,cancellation:true};
}
