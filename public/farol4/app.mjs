import {Sender,Receiver,readMeta,ranges,parseRanges,newPairCode,MAX_BYTES} from './protocol.mjs';
import {ReturnChannel} from './realtime.mjs';
const $=id=>document.getElementById(id);
const notice=text=>{$('notice').textContent=text;};
let mode='send',sender=null,receiver=null,file=null,timer=null,frame=0,stream=null,raf=0;
let loadGeneration=0,verification=null,dirty=false,db=null,storageReady=false,storageTouched=false;
let peerLastSeen=0,feedbackPeer=null;
const rgb=$('rgbCanvas'),rgbCtx=rgb.getContext('2d');
const scan=document.createElement('canvas'),scanCtx=scan.getContext('2d',{willReadFrequently:true});
const CELL=6,QUIET=4;

function render(texts) {
  const grids=texts.map(text=>{const qr=window.qrcode(0,'M');qr.addData(text);qr.make();return qr;});
  const count=Math.max(...grids.map(q=>q.getModuleCount())),size=(count+QUIET*2)*CELL;
  rgb.width=rgb.height=size;
  const pixels=rgbCtx.createImageData(size,size);pixels.data.fill(255);
  for(let channel=0;channel<3;channel++){
    const q=grids[channel]||grids[0],offset=QUIET+Math.floor((count-q.getModuleCount())/2);
    for(let y=0;y<q.getModuleCount();y++)for(let x=0;x<q.getModuleCount();x++)if(q.isDark(y,x))
      for(let dy=0;dy<CELL;dy++)for(let dx=0;dx<CELL;dx++)pixels.data[(((y+offset)*CELL+dy)*size+(x+offset)*CELL+dx)*4+channel]=0;
  }
  rgbCtx.putImageData(pixels,0,0);rgb.style.display='block';$('sendPlaceholder').hidden=true;
}
function stop(){if(timer)clearInterval(timer);timer=null;$('play').textContent='Transmitir';}
function nextFrame(){
  if(!sender)return;
  try{
    if(frame++%12===0)render([sender.metadata()]);
    else render([sender.next(),sender.next(),sender.next()]);
    $('sentBlocks').textContent=sender.sent;
    $('nextBlock').textContent=(sender.repairs[0]??sender.cursor%sender.meta.total)+1;
  }catch(e){stop();notice('Não foi possível gerar o QR: '+e.message);}
}
function play(){if(!sender||timer)return;frame=0;nextFrame();timer=setInterval(nextFrame,1000/Number($('fps').value));$('play').textContent='Pausar';}
$('play').onclick=()=>timer?stop():play();
$('fps').oninput=()=>{$('fpsValue').textContent=$('fps').value;if(timer){stop();play();}};
$('startBlock').onchange=()=>{
  if(!sender)return;const n=Number($('startBlock').value);
  if(!Number.isInteger(n)||n<1||n>sender.meta.total){notice(`Escolha um bloco de 1 a ${sender.meta.total}.`);return;}
  stop();sender.cursor=n-1;sender.repairs=[];$('nextBlock').textContent=n;render([sender.metadata()]);notice(`Pronto para transmitir do bloco ${n}.`);
};
$('restart').onclick=()=>{if(sender){stop();sender.cursor=0;sender.repairs=[];sender.sent=0;$('startBlock').value='1';$('sentBlocks').textContent='0';$('nextBlock').textContent='1';render([sender.metadata()]);notice('Pronto para recomeçar do bloco 1.');}};
$('repair').onclick=()=>{
  if(!sender)return;try{sender.request(parseRanges($('repairInput').value,sender.meta.total));notice(`${sender.repairs.length} blocos priorizados. Clique em Transmitir se estiver pausado.`);}catch(e){notice(e.message);}
};
async function prepare(){
  const generation=++loadGeneration;stop();sender=null;feedbackPeer=null;
  for(const id of ['play','restart','repair'])$(id).disabled=true;
  if(!file)return;
  if(file.size>MAX_BYTES){notice('Escolha um arquivo de até 32 MiB.');return;}
  notice('Preparando arquivo e calculando sua identificação…');
  try{
    const candidate=await Sender.create(new Uint8Array(await file.arrayBuffer()),file.name,Number($('blockSize').value));
    if(generation!==loadGeneration)return;sender=candidate;
    $('sendName').textContent=file.name;$('totalBlocks').textContent=sender.meta.total;
    $('nextBlock').textContent='1';$('sentBlocks').textContent='0';$('startBlock').max=sender.meta.total;$('startBlock').value='1';
    $('peerProgress').textContent='Aguardando confirmação do receptor.';
    for(const id of ['play','restart','repair'])$(id).disabled=false;
    render([sender.metadata()]);notice('Pronto. Ligue a câmera no receptor e clique em Transmitir.');
  }catch(e){notice('Falha ao preparar: '+e.message);}
}
$('file').onchange=()=>{file=$('file').files[0];prepare();};$('blockSize').onchange=prepare;
function setMode(value){mode=value;stop();stopCamera();$('sendView').hidden=value!=='send';$('receiveView').hidden=value!=='receive';$('sendMode').setAttribute('aria-pressed',String(value==='send'));$('receiveMode').setAttribute('aria-pressed',String(value==='receive'));feedback();}
$('sendMode').onclick=()=>setMode('send');$('receiveMode').onclick=()=>setMode('receive');

function updateReceiver(){
  if(!receiver)return;const r=receiver;
  $('receiveName').textContent=r.meta.name;$('received').textContent=`${r.count} / ${r.meta.total} blocos`;
  $('percent').textContent=`${Math.floor(r.count/r.meta.total*100)}%`;$('progress').value=r.count/r.meta.total*100;
  $('missingCount').textContent=r.meta.total-r.count;$('missingList').value=ranges(r.missing());
  $('copyMissing').disabled=r.count===r.meta.total;$('discard').disabled=false;$('save').disabled=!r.verified;
  if(!r.verified)$('integrity').textContent=`${r.duplicates} repetidos ignorados · ${r.corrupt} inválidos descartados. SHA-256 será conferido ao completar.`;
}
async function verifyReceiver(){
  if(!receiver||receiver.count!==receiver.meta.total||verification)return;
  const r=receiver;verification=r;$('integrity').textContent='Conferindo SHA-256 do arquivo…';
  try{
    if(await r.verify()){
      if(receiver!==r)return;stopCamera();$('save').disabled=false;
      $('integrity').textContent='SHA-256 confirmado · arquivo íntegro.';
      $('receivePlaceholder').textContent='Arquivo verificado. Você já pode salvar.';
      notice('Recepção completa e integridade confirmada.');dirty=true;feedback();
    }else if(receiver===r){
      // A complete but wrong file must not be saved or acknowledged. Ask for all blocks again.
      receiver=new Receiver(r.meta);updateReceiver();dirty=true;
      notice('A verificação falhou. Os blocos serão solicitados novamente; mantenha a câmera ligada.');
    }
  }catch(e){notice('Não foi possível verificar: '+e.message);}finally{verification=null;}
}
function receivePacket(packet){
  if(mode!=='receive')return;
  const meta=readMeta(packet);
  if(meta){
    if(receiver&&receiver.meta.id!==meta.id){notice('Outro arquivo detectado. Descarte a recepção atual antes de trocar.');return;}
    if(!receiver){receiver=new Receiver(meta);storageTouched=true;dirty=true;updateReceiver();notice('Arquivo reconhecido. Recebendo blocos RGB.');feedback();}
    return;
  }
  if(receiver&&!receiver.verified){
    if(receiver.accept(packet)){dirty=true;updateReceiver();if(receiver.count===receiver.meta.total)verifyReceiver();}
  }
}
function stopCamera(){
  cancelAnimationFrame(raf);raf=0;
  if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;
  $('video').srcObject=null;$('video').style.display='none';$('receivePlaceholder').hidden=false;
  $('camera').textContent='Ligar câmera';$('zoomWrap').hidden=true;
}
let cameraStarting=false;
$('camera').onclick=async()=>{
  if(cameraStarting)return;if(stream){stopCamera();return;}
  if(!navigator.mediaDevices?.getUserMedia){notice('A câmera requer HTTPS ou localhost.');return;}
  cameraStarting=true;
  try{
    const candidate=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    if(mode!=='receive'){candidate.getTracks().forEach(t=>t.stop());return;}
    stream=candidate;$('video').srcObject=stream;await $('video').play();
    $('video').style.display='block';$('receivePlaceholder').hidden=true;$('camera').textContent='Parar câmera';
    const track=stream.getVideoTracks()[0],caps=track.getCapabilities?.()||{};
    if(caps.zoom){$('zoomWrap').hidden=false;$('zoom').min=caps.zoom.min;$('zoom').max=caps.zoom.max;$('zoom').step=caps.zoom.step||0.1;$('zoom').value=track.getSettings().zoom||caps.zoom.min;
      $('zoom').oninput=()=>{const z=Number($('zoom').value);$('zoomValue').textContent=z.toFixed(1)+'×';track.applyConstraints({advanced:[{zoom:z}]}).catch(()=>notice('Zoom não disponível nesta câmera.'));};}
    raf=requestAnimationFrame(scanFrame);
  }catch(e){stopCamera();notice('Não foi possível ligar a câmera: '+e.message);}finally{cameraStarting=false;}
};
let lastScan=0;
function scanFrame(time){
  if(!stream)return;
  try{
    const video=$('video');
    if(time-lastScan>100&&video.readyState>=2&&video.videoWidth){
      lastScan=time;const scale=Math.min(1,1100/video.videoWidth);scan.width=Math.round(video.videoWidth*scale);scan.height=Math.round(video.videoHeight*scale);
      scanCtx.drawImage(video,0,0,scan.width,scan.height);const img=scanCtx.getImageData(0,0,scan.width,scan.height);
      for(let ch=0;ch<3;ch++){
        const pixels=new Uint8ClampedArray(img.data.length);
        for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=img.data[i+ch];pixels[i+3]=255;}
        const qr=window.jsQR(pixels,scan.width,scan.height,{inversionAttempts:'attemptBoth'});if(qr)receivePacket(qr.data);
      }
    }
  }catch(e){notice('Leitura interrompida: '+e.message);stopCamera();return;}
  if(stream)raf=requestAnimationFrame(scanFrame);
}
$('copyMissing').onclick=async()=>{try{await navigator.clipboard.writeText($('missingList').value);notice('Lote de faltantes copiado.');}catch{ $('missingList').select();notice('Selecione e copie a lista de faltantes.');}};
$('save').onclick=()=>{
  if(!receiver?.verified)return;
  const url=URL.createObjectURL(new Blob([receiver.bytes],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download=receiver.meta.name||'arquivo';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
$('discard').onclick=async()=>{
  if(receiver&&!confirm('Descartar os blocos recebidos deste arquivo?'))return;
  stopCamera();receiver=null;storageTouched=true;dirty=false;await saveSnapshot(null);
  $('receiveName').textContent='Aguardando arquivo';$('received').textContent='0 blocos';$('percent').textContent='0%';$('progress').value=0;$('missingCount').textContent='—';$('missingList').value='';
  $('receivePlaceholder').textContent='Ligue a câmera para receber';$('integrity').textContent='O arquivo completo será conferido com SHA-256.';
  for(const id of ['save','discard','copyMissing'])$(id).disabled=true;notice('Recepção descartada.');
};
async function openStore(){
  return new Promise(resolve=>{
    const request=indexedDB.open('farol4',1);request.onupgradeneeded=()=>request.result.createObjectStore('sessions');
    request.onerror=()=>resolve(null);request.onsuccess=()=>resolve(request.result);
  });
}
async function saveSnapshot(value){
  if(!db)return;
  return new Promise(resolve=>{const tx=db.transaction('sessions','readwrite');const store=tx.objectStore('sessions');value?store.put(value,'current'):store.delete('current');tx.oncomplete=()=>resolve();tx.onerror=()=>{notice('Não foi possível salvar o progresso neste navegador.');resolve();};});
}
async function persist(){if(dirty&&storageReady&&receiver){dirty=false;await saveSnapshot(receiver.snapshot());}}
async function restore(){
  try{
    db=await openStore();storageReady=true;if(!db)return;
    const saved=await new Promise(resolve=>{const q=db.transaction('sessions').objectStore('sessions').get('current');q.onsuccess=()=>resolve(q.result);q.onerror=()=>resolve(null);});
    if(saved&&!storageTouched&&!receiver){receiver=Receiver.restore(saved);updateReceiver();notice('Recepção anterior restaurada. Use o mesmo arquivo e tamanho de bloco no transmissor.');if(receiver.count===receiver.meta.total)verifyReceiver();}
  }catch{storageReady=true;notice('Progresso local indisponível; mantenha esta página aberta.');}
}
setInterval(persist,2500);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});window.addEventListener('pagehide',persist);

const connection=new ReturnChannel(onControl,onConnectionState,(...args)=>window.supabase.createClient(...args));
let config={url:'',key:''},connecting=false,feedbackBusy=false;
function publicConfig(){
  const url=$('supabaseUrl').value.trim().replace(/\/$/,''),key=$('supabaseKey').value.trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Informe a URL HTTPS do projeto Supabase.');
  if(!key.startsWith('sb_publishable_')){
    try{const claims=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(claims.role!=='anon')throw Error();}
    catch{throw Error('Use somente chave publishable ou anon, nunca secret/service_role.');}
  }
  return {url,key};
}
function onConnectionState(state){
  const labels={SUBSCRIBED:'Conexão pronta · aguardando o outro aparelho',CHANNEL_ERROR:'Falha na conexão · confira a configuração e tente novamente',TIMED_OUT:'Tempo esgotado · tentando reconectar',CLOSED:'Desconectado · transmissão óptica continua disponível'};
  $('connectionStatus').textContent=labels[state]||state;
  if(state==='SUBSCRIBED'){connection.send({type:'hello',role:mode});feedback();}
}
function onControl(m){
  if(m.role===mode)return;
  if(m.type==='hello'){peerLastSeen=Date.now();$('connectionStatus').textContent='Outro aparelho conectado';feedback();return;}
  if(mode!=='send'||!sender||m.role!=='receive'||m.file!==sender.meta.id)return;
  if(feedbackPeer&&feedbackPeer!==m.from)return;
  if(!Number.isInteger(m.count)||m.count<0||m.count>sender.meta.total)return;
  if(m.type==='missing'){
    if(m.count===sender.meta.total||!sender.request(m.indices))return;
    feedbackPeer=m.from;peerLastSeen=Date.now();$('connectionStatus').textContent='Receptor conectado · recuperação automática ativa';
    $('peerProgress').textContent=`Receptor: ${m.count} / ${sender.meta.total} blocos · ${sender.repairs.length} priorizados neste lote.`;
  }else if(m.type==='done'&&m.count===sender.meta.total&&m.hash===sender.meta.hash){
    feedbackPeer=m.from;peerLastSeen=Date.now();stop();$('peerProgress').textContent='Receptor confirmou arquivo completo e SHA-256 correto.';notice('Transferência concluída. Transmissão parada automaticamente.');
  }
}
async function feedback(){
  if(feedbackBusy||!connection.ready||mode!=='receive'||!receiver)return;
  feedbackBusy=true;
  try{await connection.send(receiver.verified?{type:'done',role:mode,file:receiver.meta.id,count:receiver.count,hash:receiver.meta.hash}:{type:'missing',role:mode,file:receiver.meta.id,count:receiver.count,indices:receiver.missing()});}finally{feedbackBusy=false;}
}
setInterval(()=>{feedback();if(connection.ready&&peerLastSeen&&Date.now()-peerLastSeen>12000)$('connectionStatus').textContent='Sem confirmação recente · QR continua; aguardando receptor';},3000);
setInterval(()=>{if(connection.ready)connection.send({type:'hello',role:mode});},10000);
async function connect(create){
  if(connecting)return;connecting=true;
  try{
    config=publicConfig();const code=create?newPairCode():$('pairCode').value.trim().toLowerCase();
    $('pairCode').value=code;feedbackPeer=null;peerLastSeen=0;
    $('connectionStatus').textContent='Conectando…';await connection.connect(config.url,config.key,code);
    try{localStorage.setItem('farol4-config',JSON.stringify(config));}catch{}
    $('copyPair').disabled=false;$('disconnect').disabled=false;
  }catch(e){$('connectionStatus').textContent=e.message;$('configuration').open=true;}finally{connecting=false;}
}
$('createPair').onclick=()=>connect(true);$('joinPair').onclick=()=>connect(false);
$('disconnect').onclick=async()=>{await connection.close();$('disconnect').disabled=true;$('copyPair').disabled=true;$('connectionStatus').textContent='Modo óptico · sem conexão de retorno';feedbackPeer=null;};
$('copyPair').onclick=async()=>{
  const url=new URL(location.href);url.hash=new URLSearchParams({...config,code:$('pairCode').value,mode:mode==='send'?'receive':'send'}).toString();
  try{await navigator.clipboard.writeText(url.href);notice('Convite copiado. Abra no outro aparelho e clique em Entrar na conexão.');}catch{notice('Não foi possível copiar. Copie o código de conexão manualmente.');}
};
async function initialize(){
  try{config=JSON.parse(localStorage.getItem('farol4-config')||'null')||config;}catch{}
  if(!config.url){try{const res=await fetch('./config.json');if(res.ok)config=await res.json();}catch{}}
  const fragment=new URLSearchParams(location.hash.slice(1));
  if(fragment.has('code')){
    config={url:fragment.get('url')||config.url,key:fragment.get('key')||config.key};$('pairCode').value=fragment.get('code');
    setMode(fragment.get('mode')==='send'?'send':'receive');history.replaceState(null,'',location.pathname+location.search);
    notice('Convite recebido. Clique em Entrar na conexão para parear os aparelhos.');
  }
  $('supabaseUrl').value=config.url||'';$('supabaseKey').value=config.key||'';
  if(!config.url)$('configuration').open=true;
  await restore();
}
initialize();
