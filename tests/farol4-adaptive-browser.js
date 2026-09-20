async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.route('**/farol4/app.mjs*',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:await res.text()+`
 window.__adaptive={receiverStall:()=>{mode='receive';receiver=new PartReceiver(sender.meta,db);stream={};pauseState.reset();cameraStartedAt=performance.now()-26000;lastProgressAt=0;},setup:async()=>{await initialization;sender=await FileSender.create(new Blob([new Uint8Array(4000)]),'test.bin');mode='send';play();},report:age=>{lastSpeedAdjustment=performance.now()-10000;onControl({type:'missing',role:'receive',from:'test-peer',file:sender.meta.id,count:1,indices:[1,2],cameraActive:true,paused:false,progressAgeMs:age});},state:()=>({fps:Number($('fps').value),paused:pauseState.value.paused,running:!!timer,repairs:sender.repairs.slice()})};`});});
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.evaluate(()=>window.__adaptive.setup());
 await p.evaluate(()=>window.__adaptive.report(9000));
 let state=await p.evaluate(()=>window.__adaptive.state());if(state.fps!==4||!state.running||!state.repairs.includes(2))throw Error(JSON.stringify(state));
 await p.evaluate(()=>window.__adaptive.report(26000));
 state=await p.evaluate(()=>window.__adaptive.state());if(!state.paused||state.running)throw Error(JSON.stringify(state));
 await p.evaluate(()=>window.__adaptive.receiverStall());
 await p.waitForFunction(()=>window.__adaptive.state().paused);
 if(!(await p.locator('#notice').textContent()).includes('25 segundos'))throw Error('Receiver did not explain pause');
 await context.close();return {reducedTo4:true,targetedRepairs:true,paused:true};
}
