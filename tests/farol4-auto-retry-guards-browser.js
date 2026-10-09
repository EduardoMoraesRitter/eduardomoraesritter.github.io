// Exercise delayed/failed feedback without depending on a network timeout.
async page=>{
 const context=await page.context().browser().newContext(),p=await context.newPage();
 try{
  await p.route('**/farol4/app.mjs*',async route=>{
   const res=await route.fetch();await route.fulfill({response:res,body:await res.text()+`
window.__retry={
 setup:async()=>{
  await initialization;setMode('receive');
  const source=await FileSender.create(new Blob([new Uint8Array(1600)]),'test.bin');
  receiver=new PartReceiver(source.meta,db);stream=new MediaStream();pairTarget=source.meta.id;
  connection.ready=true;connection.roomId='guard-test';
  connection.send=async()=>false;setPaused(true,'stall');
  pauseConfirmed=true;automaticPauseAt=performance.now()-6000;peerLastSeen=Date.now();
 },
 run:retryReception,manual:()=>setPaused(true),
 delayed:()=>{connection.send=()=>new Promise(resolve=>{window.__finishFeedback=resolve;});},
 immediate:()=>{connection.send=async()=>true;},
 state:()=>({paused:pauseState.value.paused,reason:pauseState.value.reason,busy:retryingReception})
};`});
  });
  await p.goto('http://127.0.0.1:4331/farol4/');
  await p.evaluate(async()=>{await window.__retry.setup();await window.__retry.run();});
  if(!(await p.evaluate(()=>window.__retry.state())).paused)throw Error('Failed feedback resumed');
  await p.evaluate(()=>{window.__retry.delayed();window.__pendingRetry=window.__retry.run();});
  await p.waitForFunction(()=>!!window.__finishFeedback);
  await p.evaluate(async()=>{
   const finish=window.__finishFeedback;
   window.__retry.immediate();window.__retry.manual();finish(true);await window.__pendingRetry;
  });
  const state=await p.evaluate(()=>window.__retry.state());
  if(!state.paused||state.reason||state.busy)throw Error('In-flight retry overrode manual pause: '+JSON.stringify(state));
  return {failedFeedbackStaysPaused:true,manualPauseCancelsPendingRetry:true};
 }finally{await context.close();}
}
