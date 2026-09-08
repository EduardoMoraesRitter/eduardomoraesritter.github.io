// Run with playwright-cli run-code --filename tests/farol4-mobile.js.
async page => {
  const results=[];
  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[844,390]]){
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:4322/farol4/index.html');
    await page.getByRole('button',{name:'Receber arquivo',exact:true}).click();
    await page.evaluate(()=>scrollTo(0,0));
    const inspect=()=>page.evaluate(()=>{
      const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
      return {overflow:document.documentElement.scrollWidth>innerWidth,camera:rect('camera'),save:rect('save'),eta:rect('remainingTime'),viewport:innerHeight};
    });
    let state=await inspect();
    if(state.overflow)throw Error(`Overflow at ${width}×${height}`);
    for(const name of ['camera'])if(state[name].top<0||state[name].bottom>height||state[name].height<44)throw Error(`Unreachable ${name} at ${width}×${height}`);
    await page.locator('#remainingTime').scrollIntoViewIfNeeded();
    state=await inspect();
    if(width<650&&state.eta.bottom>state.camera.top){await page.evaluate(()=>scrollBy(0,80));state=await inspect();}
    if(width<650&&state.eta.bottom>state.camera.top)throw Error(`ETA unreachable at ${width}×${height}`);
    await page.screenshot({path:`output/playwright/farol4-${width}x${height}.png`});
    await page.getByText('Conexão entre os aparelhos',{exact:true}).click();
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    state=await inspect();
    if(state.overflow||(width<650&&(state.camera.bottom>height||state.camera.top<0)))throw Error(`Controls lost on scroll at ${width}`);
    results.push({width,height,actionsVisible:true,etaVisible:true,noOverflow:true});
  }
  return results;
}
