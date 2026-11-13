// Outline of the QR the scanner found, drawn over the camera preview.
// The scan image is the centre crop shown on screen (digital zoom scales the video by the
// same factor), so scan coordinates map straight onto the contain-fitted video rectangle.
export function overlayQuad(location,scanWidth,scanHeight,boxWidth,boxHeight){
  if(!location||!(scanWidth>0)||!(scanHeight>0)||!(boxWidth>0)||!(boxHeight>0))return null;
  const fit=Math.min(boxWidth/scanWidth,boxHeight/scanHeight);
  const left=(boxWidth-scanWidth*fit)/2,top=(boxHeight-scanHeight*fit)/2;
  return [location.topLeftCorner,location.topRightCorner,location.bottomRightCorner,location.bottomLeftCorner]
    .map(p=>({x:left+p.x*fit,y:top+p.y*fit}));
}
// good: readable and well framed · adjust: found, but off-centre, too small or too close.
export function overlayState(info){
  if(!info?.coverage)return 'adjust';
  return info.centered&&info.coverage>=.42&&info.coverage<=.84?'good':'adjust';
}
const COLORS={good:'#35d07f',adjust:'#ffb020'};
export function drawOverlay(canvas,quad,state='good'){
  const ratio=globalThis.devicePixelRatio||1,width=canvas.clientWidth,height=canvas.clientHeight;
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
  const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  if(!quad)return;
  const color=COLORS[state]||COLORS.adjust;
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.beginPath();quad.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  ctx.fillStyle=color+'22';ctx.fill();ctx.strokeStyle=color+'88';ctx.lineWidth=1.5;ctx.stroke();
  // Thick corner brackets make the outline readable over a busy RGB code.
  ctx.strokeStyle=color;ctx.lineWidth=5;
  quad.forEach((p,i)=>{
    const prev=quad[(i+3)%4],next=quad[(i+1)%4];
    const toward=(q,share=.2)=>({x:p.x+(q.x-p.x)*share,y:p.y+(q.y-p.y)*share});
    const a=toward(prev),b=toward(next);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  });
}
