async page => {
 const results=[];
 for(const [width,height,zoom] of [[1366,768,1],[320,568,1],[390,844,2],[844,390,1]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4322/farol4/index.html');
  await page.evaluate(z=>document.documentElement.style.zoom=z,zoom);
  for(const mode of ['send','receive']){
   await page.locator('#'+mode+'Mode').click();
   await page.locator('#connectionDetails').evaluate(e=>e.open=true);
   await page.locator('#configuration').evaluate(e=>e.open=true);
   const value=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).map(e=>e.id||e.className).slice(0,10)}));
   if(value.scroll>width||value.overflow.length)throw Error(JSON.stringify(value));results.push({width,height,zoom,mode,...value});
   await page.evaluate(()=>scrollTo(0,0));
   if(zoom===2)await page.screenshot({path:`output/playwright/farol4-a11y-${mode}-200.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:4322/farol4/index.html');
 await page.keyboard.press('Tab');
 const skip=await page.evaluate(()=>document.activeElement.className);
 await page.keyboard.press('Enter');
 const target=await page.evaluate(()=>document.activeElement.id);
 if(skip!=='skipLink'||target!=='workspaceStart')throw Error('Keyboard skip link did not reach transfer controls: '+JSON.stringify({skip,target}));
 await page.locator('#sendMode').click();await page.locator('#sendSettings').evaluate(e=>e.open=false);await page.locator('#sendSettings summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('sendSettings').open);
 const details=await page.locator('#sendSettings').evaluate(e=>e.open);
 return {results,keyboard:{skip,target,details}};
}
