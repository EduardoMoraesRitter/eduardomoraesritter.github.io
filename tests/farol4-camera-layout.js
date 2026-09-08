// Live portrait and landscape camera layouts, including automatic vision on reopen.
async page=>{
 const results=[];
 for(const [width,height,vw,vh] of [[390,844,720,1280],[320,568,720,1280],[844,390,1280,720]]){
  const p=await page.context().newPage();await p.setViewportSize({width,height});
  await p.addInitScript(({vw,vh})=>{
   const c=document.createElement('canvas');c.width=vw;c.height=vh;
   const ctx=c.getContext('2d');ctx.fillStyle='#425760';ctx.fillRect(0,0,vw,vh);
   ctx.strokeStyle='#83a7b6';ctx.lineWidth=3;
   for(let x=0;x<vw;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,vh);ctx.stroke();}
   for(let y=0;y<vh;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(vw,y);ctx.stroke();}
   ctx.fillStyle='#fff';ctx.font='40px sans-serif';ctx.fillText('CÂMERA DE TESTE',40,vh/2);
   navigator.mediaDevices.getUserMedia=async()=>{const s=c.captureStream(12);setInterval(()=>{ctx.fillRect(0,0,1,1);s.getVideoTracks()[0].requestFrame();},100);return s;};
  },{vw,vh});
  await p.goto('http://127.0.0.1:4322/farol4/index.html');
  await p.getByRole('button',{name:'Receber arquivo',exact:true}).click();
  await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Ligar câmera e escanear',exact:true}).click();
  await p.waitForFunction(()=>!document.getElementById('zoom').disabled);
  const state=await p.evaluate(()=>{
   const video=document.getElementById('video'),r=video.getBoundingClientRect(),auto=document.getElementById('autoZoom').getBoundingClientRect();
   return {height:r.height,fit:getComputedStyle(video).objectFit,autoVisible:auto.top>=0&&auto.bottom<innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  if(state.height<height*.75||state.fit!=='contain'||!state.autoVisible||state.overflow)throw Error(JSON.stringify({width,height,...state}));
  await p.getByLabel('Ajustar visão automaticamente').uncheck();
  await p.getByRole('button',{name:'Parar câmera',exact:true}).click();
  await p.getByRole('button',{name:'Ligar câmera e escanear',exact:true}).click();
  await p.waitForFunction(()=>!document.getElementById('zoom').disabled);
  if(!await p.getByLabel('Ajustar visão automaticamente').isChecked())throw Error('Auto vision not reset');
  await p.screenshot({path:`output/playwright/farol4-camera-${width}.png`});
  results.push({width,height,...state});await p.close();
 }
 return results;
}
