import {TransferStats,validStats,statsText} from './transfer-stats.mjs?v=20260921-4';
import {ReturnChannel} from './realtime.mjs?v=20260921-3';
import {PauseState} from '../farol4/pause-state.mjs?v=20260909-3';
import {digest,newPairCode,b64,unb64} from '../farol4/protocol.mjs?v=20260920-1';
const $=id=>document.getElementById(id),engine=window.farol3Engine;
const pause=new PauseState(crypto.randomUUID());
let config,target='',code='',connecting=false,epoch=0,lastPeer=0,peer='',armed=false,verified='',verifying=false,ack=false,lastTry=0,completed=false;
let resetting=false,resetAck=null;
const stats=new TransferStats();let lastStats=null,remoteStatsAt=0;
function clearStats(){stats.reset();lastStats=null;remoteStatsAt=0;$('transferStats').hidden=true;}
function renderStats(value){$('transferStats').hidden=false;$('transferStats').textContent=statsText(value);}
function receiverStats(){
 const s=engine.state();if(s.role!=='receive'||!s.total)return null;
 const value=stats.update({id:s.receivedId||'legacy',count:s.count,total:s.total,bs:s.receiveBS,size:s.receiveSize,active:s.camera&&!pause.value.paused,done:s.done},performance.now());
 if(value){lastStats=value;renderStats(value);}return value;
}
setInterval(()=>{
 if(resetting)return;
 if(engine.state().role==='receive'){if(!engine.state().total){clearStats();return;}receiverStats();}
 else if(remoteStatsAt&&Date.now()-remoteStatsAt>12000&&lastStats&&!lastStats.done){$('transferStats').textContent='Sem atualização do receptor · previsão indisponível. Último progresso: '+(lastStats.bytes/1000000).toFixed(2)+' MB';}
},1000);
const channel=new ReturnChannel(onMessage,onState,(...args)=>window.supabase.createClient(...args));
const configuration=fetch('../farol4/config.json').then(r=>{if(!r.ok)throw Error('Configuração do Supabase indisponível.');return r.json();});
// The request can fail before the user starts a transfer; connect() displays that failure.
configuration.catch(()=>{});
const validId=id=>typeof id==='string'&&/^[a-f0-9]{64}:\d{3}$/.test(id)&&Number(id.split(':')[1])>=100&&Number(id.split(':')[1])<=800;
function error(message){$('roomError').hidden=false;$('roomError').textContent=message;}
function status(){
 const role=engine.state().role;
 $('roomStatus').textContent=`Supabase · ${channel.ready?'conectado':connecting?'conectando…':'não conectado'} · Sala: ${channel.roomId||'—'}`;
 $('roomReconnect').disabled=connecting;
 $('roomQr').disabled=!code||role!=='send'||!target;
 $('roomPause').disabled=!target;$('roomCameraStop').disabled=!engine.state().camera;$('roomCameraStop').hidden=role!=='receive';
 $('roomPause').textContent=pause.value.paused?'Continuar nos dois aparelhos':'Pausar nos dois aparelhos';
 if(pause.value.paused)$('roomPeer').textContent=ack?'Pausado nos dois aparelhos':'Pausa local · aguardando confirmação do outro aparelho';
 else if(!lastPeer||Date.now()-lastPeer>12000)$('roomPeer').textContent=channel.ready?'Aguardando o outro aparelho nesta sala. Leia o QR de conexão.':'Escolha um arquivo ou leia o QR de conexão.';
}
function send(type,extra={}){return channel.send({type,role:engine.state().role,file:target,...extra});}
function syncPause(){if(pause.value.revision)return send('pause_state',pause.value);}
function changePause(value){pause.change(value);ack=false;if(value)engine.stop();else if(engine.state().role==='send'&&target)engine.start();status();syncPause();}
function showQr(){
 if(!code||!target||engine.state().role!=='send')return;
 engine.stop();engine.show('F3|P|'+b64(new TextEncoder().encode(JSON.stringify({url:config.url,code,file:target}))));
 $('roomPeer').textContent='Leia este QR no receptor para entrar na mesma sala.';
}
async function connect(){
 if(connecting||resetting)return;
 connecting=true;lastTry=Date.now();status();
 try{
  config=await configuration;if(resetting)return;
  if(navigator.onLine===false)throw Error('Sem internet neste aparelho.');
  if(!/^[a-f0-9]{64}$/.test(code))throw Error('Leia o QR de conexão ou informe o código da sala.');
  $('roomCode').value=code;
  await channel.connect(config.url,config.key,code);
 }catch(e){error('Não foi possível conectar: '+e.message);}
 finally{connecting=false;status();}
}
function onState(state,reason){
 status();
 if(state==='SUBSCRIBED'){$('roomError').hidden=true;send('hello');syncPause();ready();if(engine.state().role==='send'&&!engine.state().sending&&!pause.value.paused)showQr();}
 else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state)){
  error(`Conexão interrompida (${state}). ${reason?'O serviço recusou ou interrompeu o canal.':'O navegador não informou a causa exata.'} Confira a internet e tente reconectar.`);
 }
}
async function prepared(){
 const generation=++epoch,source=engine.source();
 if(!source)return;
 clearStats();armed=false;engine.stop();target='';peer='';lastPeer=0;pause.reset();verified='';ack=false;completed=false;
 try{
  const hash=await digest(source);if(generation!==epoch)return;
  target=hash+':'+engine.state().bs;engine.identify(target);code=newPairCode();armed=true;
  await connect();if(generation!==epoch)return;showQr();
 }catch(e){error('Não foi possível preparar a sala: '+e.message);}
}
function ready(){const state=engine.state();if(state.role==='receive'&&state.camera&&target&&!pause.value.paused)send('ready',{count:state.receivedId===target?state.count:0});}
async function readPair(text){
 if(resetting)return;const revision=epoch;
 try{
  if(text.length>3000)return;
  const data=JSON.parse(new TextDecoder().decode(unb64(text.slice(5))));
  const expected=await configuration;if(resetting||revision!==epoch)return;
  if(data.url!==expected.url||!/^[a-f0-9]{64}$/.test(data.code)||!validId(data.file))return;
  if(engine.state().role!=='receive')return;
  if(code===data.code&&target===data.file){ready();return;}
  const previous=engine.state();
  if(previous.count&&previous.receivedId!==data.file){
   if(!confirm('Começar outro arquivo? Salve o anterior antes de continuar. Os blocos anteriores serão removidos.'))return;
   engine.discard();
  }
  if(target!==data.file)clearStats();++epoch;target=data.file;code=data.code;peer='';lastPeer=0;pause.reset();verified='';ack=false;completed=false;
  await connect();ready();
 }catch{/* A damaged optical QR must not change the current room. */}
}
async function report(){
 const state=engine.state();if(state.role!=='receive'||!target||state.receivedId!==target||!channel.ready)return;
 if(state.done){
  if(verified===target){send('done',{count:state.count,hash:target.split(':')[0],stats:receiverStats()});return;}
  if(verifying)return;verifying=true;const id=target;
  try{const hash=await digest(engine.receiveBytes());if(target!==id)return;if(hash===id.split(':')[0]){verified=id;$('saveBtn').disabled=false;send('done',{count:state.count,hash,stats:receiverStats()});$('roomPeer').textContent='Arquivo completo · SHA-256 confirmado.';}else{changePause(true);error('A integridade do arquivo não confere. Descarte a recepção e tente novamente.');}}
  catch(e){changePause(true);error('Não foi possível conferir o arquivo: '+e.message);}
  finally{verifying=false;}
 }else send('missing',{count:state.count,total:state.total,drops:state.count,stats:receiverStats()});
}
function onMessage(m){
 if(resetting&&m.type!=='reset_ack')return;
 const state=engine.state();if(!['send','receive'].includes(m.role)||m.role===state.role)return;
 // Manual joining learns the file only from an authenticated sender in this room.
 if(!target&&state.role==='receive'&&validId(m.file))target=m.file;
 if(m.file!==target||!target)return;
 if(peer&&peer!==m.from&&Date.now()-lastPeer<12000)return;
 if(m.type==='reset_ack'){resetAck?.();return;}
 if(m.type==='reset'){resetAll(false);return;}
 peer=m.from;lastPeer=Date.now();status();
 if(m.type==='pause_state'){
  if(pause.accept(m)){ack=true;if(m.paused)engine.stop();else if(state.role==='send')engine.start();}
  if(pause.matches(m))send('pause_ack',pause.value);status();return;
 }
 if(m.type==='pause_ack'){if(pause.matches(m)){ack=true;status();}return;}
 if(m.type==='hello'||m.type==='hello_ack'){
  if(m.type==='hello')send('hello_ack');syncPause();ready();report();
  if(!pause.value.paused)$('roomPeer').textContent=completed||verified===target?'Arquivo completo · SHA-256 confirmado.':'Outro aparelho confirmado nesta sala.';return;
 }
 if(state.role!=='send')return;
 if(['missing','done'].includes(m.type)&&validStats(m.stats)){lastStats=m.stats;remoteStatsAt=Date.now();renderStats(m.stats);}
 if(m.type==='ready'){
  $('roomPeer').textContent='Receptor conectado · câmera pronta.';
  if(armed&&$('roomAuto').checked&&!pause.value.paused){armed=false;engine.start();}
 }else if(m.type==='missing'&&Number.isInteger(m.count)&&m.count>=0&&m.count<=state.totalSend){
  $('roomPeer').textContent=`Receptor reconstruiu ${m.count} de ${state.totalSend} blocos. Enviando novas gotas.`;
 }else if(m.type==='done'&&m.hash===target.split(':')[0]&&m.count===state.totalSend){
  completed=true;armed=false;engine.stop();$('roomPeer').textContent='Receptor confirmou arquivo completo e SHA-256 correto.';
 }
}
window.farol3Link={
 hasTarget:()=>!!target,beforeModeChange:()=>{if(target)changePause(true);},readPair,paused:()=>pause.value.paused,
 acceptMeta:meta=>!target||(meta.id===target&&Number.isInteger(meta.K)&&meta.K>0&&meta.K<=1000000&&meta.bs>=100&&meta.bs<=800&&meta.size>=0&&meta.size<=100000000),
 toggle:()=>{armed=false;if(target)changePause(engine.state().sending||!pause.value.paused&&engine.state().role==='receive');else if(engine.state().sending)engine.stop();else engine.start();},
 cameraStopped:()=>{if(target&&!resetting)changePause(true);},cameraReady:ready
};
async function resetAll(local=true){
 if(resetting)return;
 if(local&&!confirm('Começar do zero nos dois aparelhos? Isso encerra a sala e remove os blocos recebidos. Salve o arquivo antes de continuar.'))return;
 resetting=true;++epoch;armed=false;$('roomReset').disabled=true;
 let confirmed=false;
 try{
  engine.stop();
  if(local&&channel.ready&&target){
   const response=new Promise(resolve=>{resetAck=()=>resolve(true);});
   pause.change(true);await syncPause();await send('reset');
   confirmed=await Promise.race([response,new Promise(resolve=>setTimeout(()=>resolve(false),2000))]);
  }else if(!local){await send('reset_ack');confirmed=true;}
  target='';code='';peer='';lastPeer=0;verified='';completed=false;pause.reset();ack=false;
  await channel.close();channel.roomId=null;await engine.reset();clearStats();
  $('roomCode').value='';$('roomError').hidden=true;status();
  $('roomPeer').textContent=confirmed?'Sala encerrada. Pronto para começar do zero nos dois aparelhos.':'Limpeza local concluída. Sem confirmação do outro aparelho; use Começar do zero nele também.';
 }catch(e){error('Não foi possível concluir a limpeza: '+e.message);}
 finally{resetAck=null;resetting=false;$('roomReset').disabled=false;}
}
$('roomReset').onclick=()=>resetAll(true);
window.addEventListener('farol3-loading',()=>{clearStats();++epoch;armed=false;if(target)changePause(true);target='';peer='';lastPeer=0;channel.close();status();});
window.addEventListener('farol3-prepared',prepared);
window.addEventListener('farol3-pause-preparation',()=>{if(target)changePause(true);});
$('roomPause').onclick=()=>{armed=false;changePause(!pause.value.paused);};
$('roomQr').onclick=()=>{changePause(true);showQr();};
$('roomReconnect').onclick=()=>{if(engine.state().role==='send'&&!code&&engine.source())prepared();else connect();};
$('roomJoin').onclick=()=>{
 const next=$('roomCode').value.trim().toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(next)){error('Código da sala inválido. Copie o código completo ou leia o QR.');return;}
 if(next!==code){
  if(engine.state().role==='receive'&&engine.state().count){if(!confirm('Entrar em outra sala e descartar a recepção atual? Salve o arquivo antes.'))return;engine.discard();}
  pause.reset();peer='';lastPeer=0;verified='';if(engine.state().role==='receive')target='';code=next;
 }
 connect();
};
$('roomCameraStop').onclick=()=>engine.cameraStop();
setInterval(()=>{
 if(resetting)return;
 if(lastPeer&&Date.now()-lastPeer>12000&&engine.state().sending){changePause(true);error('Contato com o receptor perdido. Transmissão pausada.');}
 if(channel.ready){send('hello');syncPause();ready();report();}
 else if(code&&Date.now()-lastTry>10000&&!connecting)connect();
 status();
},3000);
status();
