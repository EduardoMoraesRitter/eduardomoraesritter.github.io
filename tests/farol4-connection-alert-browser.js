async page=>{
 const context=await page.context().browser().newContext();const p=await context.newPage();
 await p.route('**/farol4/realtime.mjs*',async route=>{
  const res=await route.fetch();await route.fulfill({response:res,body:(await res.text()).replace('this.createClient=createClient;',`this.createClient=()=>({channel:()=>({on(){return this;},subscribe(cb){window.__connectionCallback=cb;setTimeout(()=>cb('CHANNEL_ERROR',new Error('Teste: conexão recusada')),30);return this;}}),removeAllChannels:async()=>{},realtime:{disconnect(){}}});`)});
 });
 await p.goto('http://127.0.0.1:4331/farol4/index.html');
 await p.locator('#retryConnection').click();
 await p.waitForFunction(()=>document.querySelector('#connectionAlert').textContent.includes('Teste: conexão recusada'));
 if(!await p.locator('#connectionAlert').isVisible())throw Error('Error hidden');
 const code=await p.locator('#pairCode').inputValue();
 await p.locator('#retryConnection').click();
 if(await p.locator('#pairCode').inputValue()!==code)throw Error('Retry changed room');
 await p.waitForTimeout(100);
 await p.evaluate(()=>window.__connectionCallback('SUBSCRIBED'));
 if(await p.locator('#connectionAlert').isVisible())throw Error('Error not cleared');
 await p.evaluate(()=>window.__connectionCallback('TIMED_OUT'));
 if(!(await p.locator('#connectionAlert').textContent()).includes('não respondeu'))throw Error('Timeout missing');
 await p.setViewportSize({width:390,height:844});
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await p.screenshot({path:'output/playwright/farol4-connection-alert.png',fullPage:true});
 await context.setOffline(true);await p.locator('#retryConnection').click();
 await p.waitForFunction(()=>document.querySelector('#connectionAlert').textContent.includes('sem internet'));
 await context.close();return {error:true,retrySameRoom:true,successClearsAlert:true,timeout:true,offline:true,mobile:true};
}
