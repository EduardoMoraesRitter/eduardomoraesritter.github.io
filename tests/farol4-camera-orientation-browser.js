// Browser regression: retain all four edges at zoom 1 and follow camera rotation.
async page => {
 const results=[];
 for(const [width,height,vw,vh] of [[390,844,720,1280],[320,568,1080,1440],[390,844,1280,720],[844,390,1280,720]]){
  const p=await page.context().newPage();await p.setViewportSize({width,height});
  await p.addInitScript(({vw,vh})=>{
   const c=document.createElement('canvas');c.width=vw;c.height=vh;window.testCamera=c;
   const ctx=c.getContext('2d');
   const paint=()=>{
    ctx.fillStyle='#213b42';ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#eea240';ctx.fillRect(0,0,30,c.height);
    ctx.fillStyle='#55cda0';ctx.fillRect(c.width-30,0,30,c.height);
    ctx.fillStyle='#fff';ctx.fillRect(30,0,c.width-60,20);ctx.fillRect(30,c.height-20,c.width-60,20);
    ctx.font='36px sans-serif';ctx.fillText('QUADRO INTEIRO',40,c.height/2);
   };
   navigator.mediaDevices.getUserMedia=async constraints=>{
    window.testConstraints=constraints;paint();const stream=c.captureStream(12);
    setInterval(()=>{paint();stream.getVideoTracks()[0].requestFrame();},100);return stream;
   };
  },{vw,vh});
  await p.goto('http://127.0.0.1:4322/farol4/index.html');
  await p.getByRole('button',{name:'Receber arquivo',exact:true}).click();
  await p.getByRole('button',{name:'Ligar câmera e escanear',exact:true}).click();
  await p.waitForFunction(()=>!document.getElementById('zoom').disabled);
  const measure=()=>p.evaluate(()=>{
   const video=document.getElementById('video'),stage=video.parentElement;
   const r=video.getBoundingClientRect(),s=stage.getBoundingClientRect(),css=getComputedStyle(video);
   const fit=Math.min(s.width/video.videoWidth,s.height/video.videoHeight);
   return {width:innerWidth,height:innerHeight,sourceWidth:video.videoWidth,sourceHeight:video.videoHeight,
    previewWidth:r.width,previewHeight:r.height,stageWidth:s.width,stageHeight:s.height,
    fit:css.objectFit,transform:css.transform,zoom:document.getElementById('zoom').value,
    fullFrameFits:video.videoWidth*fit<=s.width+.1&&video.videoHeight*fit<=s.height+.1,
    requested:window.testConstraints.video,overflow:document.documentElement.scrollWidth>innerWidth,
    aspect:stage.style.getPropertyValue('--camera-aspect')};
  });
  const state=await measure();
  if(state.fit!=='contain'||state.transform!=='none'||state.zoom!=='1'||!state.fullFrameFits||state.overflow)throw Error(JSON.stringify(state));
  if(state.requested.resizeMode.ideal!=='none')throw Error('Camera crop requested');
  if(width<height&&state.requested.width.ideal>=state.requested.height.ideal)throw Error('Portrait still requests landscape');
  if(width<height&&Math.abs(state.stageWidth/state.stageHeight-vw/vh)>.005)throw Error('Preview does not follow source aspect');
  await p.screenshot({path:`output/playwright/staging-camera-${width}-${vw}x${vh}.png`,fullPage:true});
  if(vw<vh){
   await p.evaluate(()=>{window.testCamera.width=1280;window.testCamera.height=720;});
   await p.waitForFunction(()=>document.getElementById('video').parentElement.style.getPropertyValue('--camera-aspect')==='1280 / 720');
   const rotated=await measure();
   if(Math.abs(rotated.stageWidth/rotated.stageHeight-1280/720)>.005)throw Error('Camera resize not followed');
   state.rotationFollowsSource=true;
  }
  results.push(state);await p.close();
 }
 return results;
}
