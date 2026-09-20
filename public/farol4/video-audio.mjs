import {imagesZip} from './video-prints.mjs?v=20260920-5';
export async function videoAudio(file,{signal,onProgress=()=>{}}={}){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio||!window.MediaRecorder)throw Error('Este navegador não oferece extração de áudio. Tente Chrome ou Safari atualizado.');
 const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime)throw Error('Nenhum formato de gravação de áudio compatível neste navegador.');
 const context=new Audio(),video=document.createElement('video'),url=URL.createObjectURL(file);
 video.playsInline=true;video.preload='auto';
 const source=context.createMediaElementSource(video),destination=context.createMediaStreamDestination();source.connect(destination);
 let recorder,timer,watchdog;const chunks=[];let bytes=0;
 try{
  await context.resume();
  await new Promise((resolve,reject)=>{
   let finished=false,recordingStarted=false;
   const cleanup=()=>{clearInterval(timer);clearTimeout(watchdog);signal?.removeEventListener('abort',abort);};
   const fail=e=>{if(finished)return;finished=true;cleanup();video.pause();if(recorder?.state==='recording')recorder.stop();reject(e);};
   const abort=()=>fail(new DOMException('Cancelado','AbortError'));
   signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}
   video.onerror=()=>fail(Error('Não foi possível abrir o vídeo ou seu áudio neste navegador.'));
   watchdog=setTimeout(()=>fail(Error('O vídeo demorou demais para carregar. Tente outro formato.')),30000);
   video.onloadedmetadata=async()=>{
    if(finished||recordingStarted)return;recordingStarted=true;
    if(!Number.isFinite(video.duration)||video.duration<=0){fail(Error('Duração inválida.'));return;}
    if(video.duration*16000>95_000_000){fail(Error('Áudio muito longo para o limite de 100 MB. Escolha um vídeo menor.'));return;}
    clearTimeout(watchdog);
    try{
     recorder=new MediaRecorder(destination.stream,{mimeType:mime,audioBitsPerSecond:128000});
     recorder.ondataavailable=e=>{if(e.data.size){bytes+=e.data.size;chunks.push(e.data);if(bytes>99_000_000)fail(Error('O áudio ultrapassa o limite do Farol.'));}};
     recorder.onerror=()=>fail(Error('A gravação de áudio falhou.'));
     recorder.onstop=()=>{if(finished)return;finished=true;cleanup();resolve();};
     video.onended=()=>{if(recorder.state==='recording')recorder.stop();};
     let lastTime=0,lastAdvance=Date.now();
     timer=setInterval(()=>{if(video.currentTime>lastTime){lastTime=video.currentTime;lastAdvance=Date.now();}if(Date.now()-lastAdvance>30000){fail(Error('A extração parou. Mantenha a aba ativa e tente novamente.'));return;}onProgress(`Extraindo áudio: ${Math.floor(video.currentTime)} de ${Math.ceil(video.duration)} segundos. Mantenha esta aba ativa.`);},500);
     recorder.start(1000);await video.play();
    }catch(e){fail(e);}
   };
   video.src=url;video.load();
  });
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  if(!bytes)throw Error('Nenhum áudio foi gerado.');
  const extension=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';
  const base=file.name.replace(/\.[^.]+$/,'');
  onProgress('Criando ZIP do áudio…');
  const zip=await imagesZip([{name:`audio.${extension}`,blob:new Blob(chunks,{type:mime})},{name:'LEIA-ME.json',blob:new Blob([JSON.stringify({source:file.name,format:mime,note:'Áudio recodificado no navegador, sem imagens. Vídeos sem faixa de áudio podem gerar silêncio.'},null,2)])}],base+'-audio.zip');
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  return zip;
 }finally{
  clearInterval(timer);clearTimeout(watchdog);video.pause();video.removeAttribute('src');video.load();
  if(recorder?.state==='recording')recorder.stop();source.disconnect();destination.stream.getTracks().forEach(t=>t.stop());await context.close();URL.revokeObjectURL(url);
 }
}
