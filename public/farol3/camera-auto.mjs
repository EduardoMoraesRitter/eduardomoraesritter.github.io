import {analyzeFrame,autoZoom} from '../farol4/camera.mjs?v=20260909-3';
let last=0;
window.farol3Camera={guide(image,location){
 const now=performance.now();if(now-last<1500)return;last=now;
 const info=analyzeFrame(image.data,image.width,image.height,location);
 document.getElementById('cameraGuidance3').textContent=info.message;
 if(document.getElementById('autoZoom3').checked){
  const engine=window.farol3Engine,current=engine.zoom();
  engine.zoom(autoZoom(current,1,3,info));
 }
}};
