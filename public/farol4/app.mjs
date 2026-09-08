import {Sender,Receiver,readMeta,ranges,parseRanges,newPairCode,MAX_BYTES} from './protocol.mjs';
import {ReturnChannel} from './realtime.mjs';
import {analyzeFrame,autoZoom} from './camera.mjs';
import {pairPacket,readPair} from './pairing.mjs';
import {TransferRate,duration} from './transfer-rate.mjs';
const $=id=>document.getElementById(id);
const notice=text=>{$('notice').textContent=text;};
let mode='send',sender=null,receiver=null,file=null,timer=null,frame=0,stream=null,raf=0;
let loadGeneration=0,verification=null,dirty=false,db=null,storageReady=false,storageTouched=false;
let peerLastSeen=0,feedbackPeer=null;
let connectionState='IDLE',opticalBlocked=false,lastPairAttempt=0,sameRole=false;
let autoArmed=false,pairDisplayPending=false,pairTarget=null,lastPairCode='',zoom=1,digitalZoom=1,hardwareZoom=null,zoomBusy=false;
let lastGuidance=0,lastAutoZoom=0,lastDecoded=0;
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
function stop(){if(timer)clearInterval(timer);timer=null;autoArmed=false;$('play').textContent='Transmitir';}
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
$('autoStart').onchange=()=>{if(!$('autoStart').checked)autoArmed=false;};
function showPair(){
  if(!sender||!connection.ready){notice('Escolha um arquivo e crie uma conexão primeiro.');return;}
  stop();autoArmed=$('autoStart').checked;
  render([pairPacket({url:config.url,code:$('pairCode').value.trim(),file:sender.meta.id})]);
  notice(autoArmed?'No celular, ligue a câmera e leia este QR. A transmissão inicia após a confirmação.':'Leia este QR para conectar o receptor. Depois clique em Transmitir.');
}
$('showPair').onclick=showPair;
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
  for(const id of ['play','restart','repair','showPair'])$(id).disabled=true;
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
    $('showPair').disabled=!connection.ready;
    await initialization;
    if(generation!==loadGeneration)return;
    notice('Criando sala. O primeiro QR conecta os aparelhos.');await connect(true);
  }catch(e){notice('Falha ao preparar: '+e.message);}
}
$('file').onchange=()=>{file=$('file').files[0];prepare();};$('blockSize').onchange=prepare;
function setMode(value){mode=value;stop();stopCamera();$('sendView').hidden=value!=='send';$('receiveView').hidden=value!=='receive';$('createPair').hidden=value!=='send';$('joinPair').hidden=value!=='receive';$('connectionDetails').open=value==='send';$('sendMode').setAttribute('aria-pressed',String(value==='send'));$('receiveMode').setAttribute('aria-pressed',String(value==='receive'));feedback();}
$('sendMode').onclick=()=>setMode('send');$('receiveMode').onclick=()=>setMode('receive');

let rateMeter=new TransferRate(),rateReceiver=null,rateStream=null;
function updateTiming(){
  if(rateReceiver!==receiver||rateStream!==stream){rateMeter=new TransferRate();rateReceiver=receiver;rateStream=stream;}
  let text='Aguardando blocos',speed='—';
  if(receiver?.verified)text='Concluído';
  else if(receiver&&receiver.count===receiver.meta.total)text='Verificando arquivo';
  else if(receiver&&!stream)text='Câmera pausada';
  else if(receiver){
    const {meta,flags,count}=receiver;
    const bytes=count*meta.bs-(flags[meta.total-1]?meta.total*meta.bs-meta.size:0);
    const {rate,stalled}=rateMeter.observe(bytes,performance.now());
    text=stalled?'Sem novos blocos':rate>0?duration((meta.size-bytes)/rate):'Calculando…';
    if(rate>0)speed=rate>=1024?`${(rate/1024).toFixed(1)} KiB/s`:`${Math.round(rate)} B/s`;
    else if(stalled)speed='0 B/s';
  }
  $('remainingTime').textContent=text;$('receiveRate').textContent=speed;
}
setInterval(updateTiming,1000);

function updateReceiver(){
  if(!receiver)return;const r=receiver;
  $('receiveName').textContent=r.meta.name;$('received').textContent=`${r.count} / ${r.meta.total} blocos`;
  $('percent').textContent=`${Math.floor(r.count/r.meta.total*100)}%`;$('progress').value=r.count/r.meta.total*100;
  $('missingCount').textContent=r.meta.total-r.count;$('missingList').value=ranges(r.missing());
  $('copyMissing').disabled=r.count===r.meta.total;$('discard').disabled=false;$('save').disabled=!r.verified;
  if(!r.verified)$('integrity').textContent=`${r.duplicates} repetidos ignorados · ${r.corrupt} inválidos descartados. SHA-256 será conferido ao completar.`;
  updateTiming();
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
  const pair=readPair(packet);
  if(pair){
    if(receiver&&receiver.meta.id!==pair.file){notice('Descarte a recepção anterior antes de receber outro arquivo.');return;}
    // Optical data cannot silently redirect the browser to another Supabase project.
    if(pair.url!==config.url){notice('O QR usa outro projeto. Confira a configuração antes de conectar.');return;}
    pairTarget=pair.file;
    const different=lastPairCode!==pair.code;
    const retry=!opticalBlocked&&!connection.ready&&['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(connectionState)&&Date.now()-lastPairAttempt>8000;
    if((different||retry)&&!connecting){lastPairCode=pair.code;lastPairAttempt=Date.now();opticalBlocked=false;$('pairCode').value=pair.code;connect(false);notice('QR de conexão lido. Avisando o transmissor…');}
    else if(connection.ready)announceReady();
    return;
  }
  const meta=readMeta(packet);
  if(meta){
    if(receiver&&receiver.meta.id!==meta.id){notice('Outro arquivo detectado. Descarte a recepção atual antes de trocar.');return;}
    if(!receiver){receiver=new Receiver(meta);storageTouched=true;dirty=true;updateReceiver();notice('Arquivo reconhecido. Recebendo blocos RGB.');feedback();}
    pairTarget=meta.id;
    return;
  }
  if(receiver&&!receiver.verified){
    if(receiver.accept(packet)){dirty=true;updateReceiver();if(receiver.count===receiver.meta.total)verifyReceiver();}
  }
}
function stopCamera(){
  document.body.classList.remove('camera-active');
  cancelAnimationFrame(raf);raf=0;
  if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;
  $('video').srcObject=null;$('video').style.display='none';$('receivePlaceholder').hidden=false;
  $('camera').textContent='Ligar câmera e escanear';$('zoom').disabled=true;
  $('cameraQuality').textContent='Câmera desligada.';
  updateTiming();
}
async function applyZoom(value){
  if(!stream||zoomBusy)return;zoomBusy=true;
  const track=stream.getVideoTracks()[0];
  try{
    if(hardwareZoom){
      const step=hardwareZoom.step||.1;
      const requested=Math.max(hardwareZoom.min,Math.min(hardwareZoom.max,hardwareZoom.min+Math.round((value-hardwareZoom.min)/step)*step));
      await track.applyConstraints({advanced:[{zoom:requested}]});
      if(!stream||stream.getVideoTracks()[0]!==track)return;
      zoom=track.getSettings().zoom??requested;digitalZoom=1;
    }else{zoom=Math.max(1,Math.min(3,value));digitalZoom=zoom;}
    $('zoom').value=zoom;$('zoomValue').textContent=zoom.toFixed(1)+'×';
    $('video').style.transform=`scale(${digitalZoom})`;
  }catch{
    hardwareZoom=null;zoom=1;digitalZoom=1;$('zoom').min='1';$('zoom').max='3';$('zoom').step='.1';$('zoom').value='1';$('zoomValue').textContent='1.0×';$('video').style.transform='';
    $('zoomKind').textContent='Zoom digital · o controle da câmera não respondeu.';
  }finally{zoomBusy=false;}
}
$('zoom').oninput=()=>{$('autoZoom').checked=false;applyZoom(Number($('zoom').value));};
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
    document.body.classList.add('camera-active');$('autoZoom').checked=true;window.scrollTo(0,0);
    const track=stream.getVideoTracks()[0],caps=track.getCapabilities?.()||{};
    hardwareZoom=caps.zoom&&caps.zoom.max>caps.zoom.min?caps.zoom:null;
    zoom=hardwareZoom?(track.getSettings().zoom||hardwareZoom.min):1;digitalZoom=1;
    $('video').style.transform='';$('zoom').min=hardwareZoom?.min||1;$('zoom').max=hardwareZoom?.max||3;$('zoom').step=hardwareZoom?.step||.1;$('zoom').value=zoom;$('zoom').disabled=false;$('zoomValue').textContent=zoom.toFixed(1)+'×';
    $('zoomKind').textContent=hardwareZoom?'Zoom da câmera · ajuste automático após reconhecer o QR.':'Zoom digital · aproxima a imagem, mas não recupera detalhes fora de foco.';
    const supported=['focusMode','exposureMode','whiteBalanceMode'].filter(name=>caps[name]?.includes('continuous'));
    for(const name of supported)track.applyConstraints({advanced:[{[name]:'continuous'}]}).catch(()=>{});
    $('cameraLimits').textContent=supported.length?'Ajustes contínuos solicitados à câmera. Iluminação e nitidez ainda dependem do ambiente.':'Este navegador não oferece controle contínuo de foco/exposição. Ajuste a distância se necessário.';
    lastDecoded=0;lastGuidance=0;lastAutoZoom=0;announceReady();
    raf=requestAnimationFrame(scanFrame);
  }catch(e){stopCamera();notice('Não foi possível ligar a câmera: '+e.message);}finally{cameraStarting=false;}
};
let lastScan=0;
function scanFrame(time){
  if(!stream)return;
  try{
    const video=$('video');
    if(time-lastScan>100&&video.readyState>=2&&video.videoWidth){
      lastScan=time;const vw=video.videoWidth,vh=video.videoHeight;
      const sw=vw/digitalZoom,sh=vh/digitalZoom,scale=Math.min(1,1100/sw);
      scan.width=Math.round(sw*scale);scan.height=Math.round(sh*scale);
      scanCtx.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,scan.width,scan.height);const img=scanCtx.getImageData(0,0,scan.width,scan.height);
      let location=null,validRead=false;
      for(let ch=0;ch<3;ch++){
        const pixels=new Uint8ClampedArray(img.data.length);
        for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=img.data[i+ch];pixels[i+3]=255;}
        const qr=window.jsQR(pixels,scan.width,scan.height,{inversionAttempts:'attemptBoth'});if(qr&&qr.data.startsWith('F4|')){location=qr.location;validRead=true;receivePacket(qr.data);}
      }
      if(validRead)lastDecoded=time;
      if(time-lastGuidance>900&&stream){
        lastGuidance=time;const info=analyzeFrame(img.data,scan.width,scan.height,location);
        $('cameraQuality').textContent=info.message;
        if(lastDecoded&&time-lastDecoded>4000)$('cameraQuality').textContent+=' Sem leitura recente; estabilize e ajuste a distância.';
        if($('autoZoom').checked&&location&&time-lastAutoZoom>1800){
          const target=autoZoom(zoom,Number($('zoom').min),Math.min(Number($('zoom').max),3),info);
          if(Math.abs(target-zoom)>.05){lastAutoZoom=time;applyZoom(target);}
        }
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
  updateTiming();
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
let lastReadySent=0;
function announceReady(){
  const id=pairTarget||receiver?.meta.id;
  if(mode!=='receive'||!stream||!connection.ready||!id||receiver?.verified||Date.now()-lastReadySent<1500)return;
  lastReadySent=Date.now();connection.send({type:'ready',role:'receive',file:id});
}
function publicConfig(){
  const url=$('supabaseUrl').value.trim().replace(/\/$/,''),key=$('supabaseKey').value.trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Informe a URL HTTPS do projeto Supabase.');
  if(!key.startsWith('sb_publishable_')){
    try{const claims=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(claims.role!=='anon')throw Error();}
    catch{throw Error('Use somente chave publishable ou anon, nunca secret/service_role.');}
  }
  return {url,key};
}
function updateLinkStatus(){
  const live=connection.ready&&peerLastSeen&&Date.now()-peerLastSeen<12000;
  const errors=['CHANNEL_ERROR','TIMED_OUT','CLOSED','ERROR'];
  $('serviceStatus').textContent=connection.ready?'Supabase · conectado':connectionState==='CONNECTING'?'Supabase · conectando…':errors.includes(connectionState)?'Supabase · conexão interrompida':'Supabase · não conectado';
  $('roomLabel').textContent='Sala: '+(connection.roomId||'—');
  $('peerStatus').textContent=sameRole?'Os dois aparelhos estão no mesmo modo. Troque um deles.':live?(mode==='send'?'Receptor confirmado nesta sala':'Transmissor confirmado nesta sala'):connection.ready?(peerLastSeen?'Outro aparelho sem resposta recente':'Aguardando o outro aparelho nesta sala'):connection.roomId?'Reconecte para confirmar o outro aparelho.':mode==='send'?'Escolha um arquivo para criar a sala.':'Ligue a câmera e leia o QR de conexão.';
  $('linkStatus').dataset.state=live?'paired':connection.ready?'waiting':errors.includes(connectionState)?'error':'offline';
  $('retryConnection').disabled=connecting||! /^[a-f0-9]{64}$/i.test($('pairCode').value.trim());
}
function onConnectionState(state){
  connectionState=state;if(state!=='SUBSCRIBED'){peerLastSeen=0;sameRole=false;}updateLinkStatus();
  const labels={SUBSCRIBED:'Conexão pronta · aguardando o outro aparelho',CHANNEL_ERROR:'Falha na conexão · confira a configuração e tente novamente',TIMED_OUT:'Tempo esgotado · tentando reconectar',CLOSED:'Desconectado · transmissão óptica continua disponível'};
  $('connectionStatus').textContent=labels[state]||state;
  $('showPair').disabled=!connection.ready||!sender;
  if(state==='SUBSCRIBED'){
    connection.send({type:'hello',role:mode});feedback();announceReady();
    if(pairDisplayPending&&mode==='send'&&sender&&!timer)showPair();
    pairDisplayPending=false;
  }
}
function onControl(m){
  if(!['send','receive'].includes(m.role))return;
  if(m.role===mode){sameRole=true;updateLinkStatus();return;}
  sameRole=false;
  if(m.type==='hello'||m.type==='hello_ack'){
    peerLastSeen=Date.now();updateLinkStatus();$('connectionStatus').textContent='Outro aparelho conectado';
    if(m.type==='hello')connection.send({type:'hello_ack',role:mode});
    feedback();announceReady();return;
  }
  if(mode!=='send'||!sender||m.role!=='receive'||m.file!==sender.meta.id)return;
  if(feedbackPeer&&feedbackPeer!==m.from)return;
  if(m.type==='ready'){
    peerLastSeen=Date.now();updateLinkStatus();$('connectionStatus').textContent='Câmera do receptor pronta · QR reconhecido';
    if(autoArmed&&$('autoStart').checked&&!timer){autoArmed=false;feedbackPeer=m.from;play();notice('Receptor reconheceu o QR. Transmissão iniciada automaticamente.');}
    return;
  }
  if(!Number.isInteger(m.count)||m.count<0||m.count>sender.meta.total)return;
  if(m.type==='missing'){
    if(m.count===sender.meta.total||!sender.request(m.indices))return;
    feedbackPeer=m.from;peerLastSeen=Date.now();updateLinkStatus();$('connectionStatus').textContent='Receptor conectado · recuperação automática ativa';
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
setInterval(()=>{feedback();announceReady();if(connection.ready&&peerLastSeen&&Date.now()-peerLastSeen>12000)$('connectionStatus').textContent='Sem confirmação recente · QR continua; aguardando receptor';},3000);
setInterval(()=>{updateLinkStatus();if(connection.ready)connection.send({type:'hello',role:mode});},3000);
async function connect(create){
  if(connecting)return;connecting=true;
  opticalBlocked=false;
  try{
    config=publicConfig();const code=create?newPairCode():$('pairCode').value.trim().toLowerCase();
    $('pairCode').value=code;feedbackPeer=null;peerLastSeen=0;lastReadySent=0;pairDisplayPending=mode==='send';
    $('connectionStatus').textContent='Conectando…';await connection.connect(config.url,config.key,code);
    try{localStorage.setItem('farol4-config',JSON.stringify(config));}catch{}
    $('copyPair').disabled=false;$('disconnect').disabled=false;
  }catch(e){connectionState='ERROR';$('connectionStatus').textContent=e.message;$('configuration').open=true;$('connectionDetails').open=true;notice('Não foi possível conectar: '+e.message);}finally{connecting=false;updateLinkStatus();}
}
$('createPair').onclick=()=>connect(true);$('joinPair').onclick=()=>connect(false);
$('retryConnection').onclick=()=>connect(false);
$('disconnect').onclick=async()=>{opticalBlocked=true;autoArmed=false;pairDisplayPending=false;await connection.close();connectionState='CLOSED';peerLastSeen=0;updateLinkStatus();$('disconnect').disabled=true;$('copyPair').disabled=true;$('showPair').disabled=true;$('connectionStatus').textContent='Modo óptico · sem conexão de retorno';feedbackPeer=null;};
$('copyPair').onclick=async()=>{
  const url=new URL(location.href);url.hash=new URLSearchParams({...config,code:$('pairCode').value,mode:mode==='send'?'receive':'send'}).toString();
  try{await navigator.clipboard.writeText(url.href);notice('Convite copiado. Abra no outro aparelho e clique em Entrar na conexão.');}catch{notice('Não foi possível copiar. Copie o código de conexão manualmente.');}
};
async function initialize(){
  if(matchMedia('(max-width: 720px), (pointer: coarse)').matches||/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))setMode('receive');
  try{config=JSON.parse(localStorage.getItem('farol4-config')||'null')||config;}catch{}
  if(!config.url){try{const res=await fetch('./config.json');if(res.ok)config=await res.json();}catch{}}
  const fragment=new URLSearchParams(location.hash.slice(1));
  if(fragment.has('code')){
    config={url:fragment.get('url')||config.url,key:fragment.get('key')||config.key};$('pairCode').value=fragment.get('code');
    setMode(fragment.get('mode')==='send'?'send':'receive');history.replaceState(null,'',location.pathname+location.search);
    notice('Convite recebido. Clique em Entrar na conexão para parear os aparelhos.');
  }
  $('supabaseUrl').value=config.url||'';$('supabaseKey').value=config.key||'';
    if(!config.url){$('configuration').open=true;$('connectionDetails').open=true;}
  await restore();
}
const initialization=initialize();
