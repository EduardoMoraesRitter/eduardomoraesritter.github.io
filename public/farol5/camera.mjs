// Image guidance is a heuristic, not a lux meter or a sharpness guarantee.
export function analyzeFrame(data, width, height, location=null) {
  const hist=new Uint32Array(256);let samples=0;
  for(let y=Math.floor(height*.15);y<height*.85;y+=4)for(let x=Math.floor(width*.15);x<width*.85;x+=4){
    const i=(y*width+x)*4;const v=Math.round((data[i]+data[i+1]+data[i+2])/3);hist[v]++;samples++;
  }
  const quantile=q=>{let n=0;for(let i=0;i<256;i++){n+=hist[i];if(n>=samples*q)return i;}return 255;};
  const low=quantile(.1),high=quantile(.9),median=quantile(.5);
  let coverage=0,centered=false;
  if(location){
    const p=[location.topLeftCorner,location.topRightCorner,location.bottomLeftCorner,location.bottomRightCorner];
    const xs=p.map(p=>p.x),ys=p.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    coverage=Math.max((right-left)/width,(bottom-top)/height);
    centered=Math.abs((left+right)/2-width/2)<width*.12&&Math.abs((top+bottom)/2-height/2)<height*.12;
  }
  let message;
  if(location)message=coverage>.84?'QR muito próximo: afaste um pouco ou reduza o zoom.':!centered?'QR reconhecido. Centralize antes de ajustar o zoom.':coverage<.42?'QR pequeno: aproxime ou aumente o zoom.':'QR legível · enquadramento adequado.';
  else if(high<70)message='Imagem escura: aumente o brilho da tela e a iluminação do ambiente.';
  else if(low>225)message='Imagem muito clara: evite reflexos e reduza a exposição ou o brilho.';
  else if(high-low<45)message='Pouco contraste: ajuste a distância, o foco e evite reflexos.';
  else message='Procurando QR: centralize a tela e mantenha a câmera estável.';
  return {message,coverage,centered,low,high,median};
}
export function autoZoom(current,min,max,info){
  if(!info.coverage||!info.centered)return current;
  if(info.coverage>=.45&&info.coverage<=.78)return current;
  // Small steps avoid cropping the QR or oscillating when the camera changes lens.
  return Math.min(max,Math.max(min,current*(info.coverage<.45?1.12:.88)));
}
