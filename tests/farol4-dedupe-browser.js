async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.locator('#videoPrintsPanel summary').click();
 await p.locator('#printsVideo').setInputFiles('output/video-prints-test/repeated.mp4');
 await p.locator('#printsDedupe').check();
 await p.locator('#generatePrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('2 prints · 6 analisadas · 4 descartadas'));
 await p.waitForFunction(()=>document.querySelector('#sendName').textContent==='repeated-prints.zip');
 const download=p.waitForEvent('download');await p.locator('#downloadPrints').click();await (await download).saveAs('output/video-prints-test/deduped.zip');
 await p.locator('#printsDedupe').uncheck();await p.locator('#generatePrints').click();
 await p.waitForFunction(()=>document.querySelector('#printsStatus').textContent.includes('6 prints · 6 analisadas · 0 descartadas'));
 await context.close();return {keepsFirst:true,discardsRepeats:true,keepsSceneChange:true,optional:true};
}
