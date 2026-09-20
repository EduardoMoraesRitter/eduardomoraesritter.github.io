import {similarFrames} from './frame-similarity.mjs?v=20260920-5';
import {crc32} from './protocol.mjs?v=20260920-1';
const LIMIT=100_000_000;
const encoder=new TextEncoder();
// ZIP STORE: JPEG and PNG are already compressed. Keep image Blobs, not one huge byte array.
export async function imagesZip(entries,name='prints.zip'){
 const body=[],directory=[];let offset=0;
 for(const entry of entries){
  const path=encoder.encode(entry.name),bytes=new Uint8Array(await entry.blob.arrayBuffer());
  const crc=parseInt(crc32(bytes),16),size=bytes.length;
  const local=new Uint8Array(30+path.length),v=new DataView(local.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);
  v.setUint32(14,crc,true);v.setUint32(18,size,true);v.setUint32(22,size,true);v.setUint16(26,path.length,true);local.set(path,30);
  const central=new Uint8Array(46+path.length),c=new DataView(central.buffer);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);
  c.setUint32(16,crc,true);c.setUint32(20,size,true);c.setUint32(24,size,true);c.setUint16(28,path.length,true);c.setUint32(42,offset,true);central.set(path,46);
  body.push(local,entry.blob);directory.push(central);offset+=local.length+size;
 }
 const dirSize=directory.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,dirSize,true);e.setUint32(16,offset,true);
 if(offset+dirSize+22>LIMIT)throw Error('O ZIP ultrapassa 100 MB. Aumente o intervalo ou escolha JPEG.');
 return new File([...body,...directory,end],name,{type:'application/zip'});
}
function waitMedia(video,event,signal,action){
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);};
  const ok=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(Error('Não foi possível decodificar este vídeo. Tente um MP4 H.264 compatível com o navegador.'));};
  const abort=()=>{cleanup();reject(new DOMException('Cancelado','AbortError'));};
  const timer=setTimeout(fail,30000);
  video.addEventListener(event,ok,{once:true});video.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}try{action?.();}catch(e){cleanup();reject(e);}
 });
}
export async function videoPrints(file,{interval=1,png=false,deduplicate=false,sensitivity='careful',signal,onProgress=()=>{}}={}){
 if(!Number.isFinite(interval)||interval<=0)throw Error('Informe um intervalo maior que zero.');
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';
 const url=URL.createObjectURL(file),entries=[],times=[];
 try{
  await waitMedia(video,'loadeddata',signal,()=>{video.src=url;video.load();});
  const duration=video.duration,count=Math.ceil(duration/interval);
  if(!Number.isFinite(duration)||duration<=0||!video.videoWidth)throw Error('Duração do vídeo inválida.');
  if(count>5000)throw Error(`Seriam ${count} prints. Aumente o intervalo para gerar até 5.000 imagens.`);
  const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  const context=canvas.getContext('2d');let size=0,previous=null,discarded=0;
  const compare=document.createElement('canvas'),scale=Math.min(1,960/canvas.width);
  compare.width=Math.max(1,Math.round(canvas.width*scale));compare.height=Math.max(1,Math.round(canvas.height*scale));
  const compareContext=compare.getContext('2d',{willReadFrequently:true});
  for(let i=0;i<count;i++){
   if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
   const at=i*interval;
   if(at!==video.currentTime)await waitMedia(video,'seeked',signal,()=>{video.currentTime=at;});
   context.drawImage(video,0,0);
   if(deduplicate){
    compareContext.drawImage(canvas,0,0,compare.width,compare.height);
    const current=compareContext.getImageData(0,0,compare.width,compare.height).data;
    if(similarFrames(previous,current,compare.width,compare.height,sensitivity)){
     discarded++;onProgress(`${i+1}/${count} capturas analisadas · ${times.length} mantidas · ${discarded} descartadas`);
     await new Promise(resolve=>setTimeout(resolve,0));continue;
    }
    previous=current;
   }
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,png?'image/png':'image/jpeg',.92));
   if(!blob)throw Error('O navegador não conseguiu gerar a imagem.');
   size+=blob.size+200;
   if(size>LIMIT-100000)throw Error('Os prints ultrapassam 100 MB. Aumente o intervalo ou escolha JPEG.');
   entries.push({name:`prints/print-${String(i+1).padStart(6,'0')}.${png?'png':'jpg'}`,blob});times.push(at);
   onProgress(`${i+1}/${count} capturas analisadas · ${times.length} mantidas · ${discarded} descartadas · ${(size/1e6).toFixed(1)} MB`);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  entries.push({name:'LEIA-ME.json',blob:new Blob([JSON.stringify({video:file.name,interval_seconds:interval,duration_seconds:duration,timestamps_seconds:times,deduplicate,sensitivity,analyzed:count,kept:times.length,discarded,note:'Capturas sem áudio; quadros intermediários não incluídos.'},null,2)])});
  onProgress('Preparando ZIP…');
  const zip=await imagesZip(entries,file.name.replace(/\.[^.]+$/,'')+'-prints.zip');
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  return {zip,count:times.length,analyzed:count,discarded};
 }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
}
