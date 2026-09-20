async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.locator('#videoPrintsPanel summary').click();
 await p.locator('#printsVideo').setInputFiles('output/video-prints-test/sample.mp4');
 await p.locator('#printsInterval').fill('2');
 await p.locator('#generatePrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('3 prints'));
 await p.waitForFunction(()=>document.querySelector('#sendName').textContent==='sample-prints.zip');
 if(!await p.locator('#play').isEnabled())throw Error('ZIP not prepared for transmission');
 if(await p.locator('#file').evaluate(el=>el.files[0]?.name)!=='sample-prints.zip')throw Error('ZIP not selected');
 const download=p.waitForEvent('download');await p.locator('#downloadPrints').click();await (await download).saveAs('output/video-prints-test/browser-prints.zip');
 await p.locator('#printsUnit').selectOption('60');await p.locator('#printsFormat').selectOption('png');
 await p.locator('#generatePrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('1 prints'));
 const pngDownload=p.waitForEvent('download');await p.locator('#downloadPrints').click();await (await pngDownload).saveAs('output/video-prints-test/browser-png.zip');
 await p.locator('#printsUnit').selectOption('1');await p.locator('#printsInterval').fill('.1');await p.locator('#generatePrints').click();await p.locator('#cancelPrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent==='Geração cancelada.');
 await p.setViewportSize({width:390,height:844});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await context.close();return {jpeg:true,png:true,seconds:true,minutes:true,zipSelected:true,download:true,cancel:true,mobile:true};
}
