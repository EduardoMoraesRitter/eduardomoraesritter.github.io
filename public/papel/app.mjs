import {Notebook, readSignal} from './model.mjs';
import {Relay} from './relay.mjs';
import {newSecret,validSecret,namedSecret,normalizeRoom} from './crypto.mjs';
const $ = id => document.getElementById(id);
let storageKey = 'papel-notes-v1';
let saved = [];
try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!Array.isArray(saved)) saved=[]; } catch {}
let book = new Notebook(crypto.randomUUID(), saved);
let namedRoom=null,joining=false;
let room=1, pc=null, channel=null, generation=0, timer;
let relayState='off',relayPeers=0,p2pState='off',secret='';
const relay=new Relay((...args)=>window.supabase.createClient(...args),note=>{
  if(note)accept(note);else book.notes.forEach(n=>relay.send('note',n));
},(state,peers)=>{relayState=state;relayPeers=peers;connectionStatus();});
function accept(note){if(book.receive(note)){persist();render();send(note);relay.send('note',note);}}
function connectionStatus(){
  const states=[];
  if(p2pState==='ready')states.push('P2P conectado');
  else if(p2pState==='error')states.push('P2P interrompido');
  if(relayState==='ready')states.push(relayPeers?`Sala ${namedRoom?.name||'online'} · ${relayPeers} outro(s) dispositivo(s)`:`Sala ${namedRoom?.name||'online'} · aguardando outro dispositivo`);
  else if(relayState==='connecting')states.push('Conectando sala online…');
  else if(relayState==='error'||relayState==='send_error')states.push('Sala online indisponível · tente reconectar');
  status(states.join(' · ')||'Só neste dispositivo',p2pState==='ready'||(relayState==='ready'&&relayPeers>0));
  $('relayStatus').textContent=relayState==='ready'?(relayPeers?'Conectado. As três folhas estão sincronizadas.':namedRoom?'Sala aberta. No outro aparelho, informe o mesmo nome e tipo de sala'+(namedRoom.protected?' e a mesma senha. Senhas diferentes não se conectam.':'.'):'Sala aberta. Envie o link e aguarde o outro dispositivo.'):
    relayState==='connecting'?'Conectando…':relayState==='off'?'Crie uma sala ou cole o link recebido.':'Não foi possível conectar ou enviar. Confira a internet e clique em Entrar na sala para tentar novamente.';
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(book.notes)); $('saved').textContent='Salvo neste navegador'; }
  catch { $('saved').textContent='Não foi possível salvar. Baixe uma cópia .txt.'; }
}
function render() { $('text').value=book.notes[room-1].text; count(); }
function count() { $('count').textContent=$('text').value.length.toLocaleString('pt-BR')+' / 12.000'; }
function status(text, connected=false) { $('status').textContent=text; $('status').dataset.connected=connected; }
function send(note) {
  if (channel?.readyState !== 'open') return;
  if(channel.bufferedAmount>256000){clearTimeout(timer);timer=setTimeout(flush,300);return;}
  channel.send(JSON.stringify(note));
}
function flush() { clearTimeout(timer); book.notes.forEach(n=>{send(n);relay.send('note',n);}); }
function close() {
  generation++; clearTimeout(timer); channel?.close(); pc?.close(); channel=null; pc=null;
  p2pState='off';connectionStatus();
}
function wire(data, epoch) {
  channel=data;
  data.onopen=()=>{if(epoch!==generation)return;p2pState='ready';connectionStatus();$('pairStatus').textContent='Conectado! Feche esta janela e escreva em qualquer uma das três folhas.';flush();};
  data.onmessage=e=>{
    if(epoch!==generation || typeof e.data!=='string' || e.data.length>100000)return;
    try {accept(JSON.parse(e.data));}
    catch {}
  };
  data.onclose=()=>{if(epoch===generation){p2pState='error';connectionStatus();}};
  data.onerror=()=>{if(epoch===generation){p2pState='error';connectionStatus();}};
}
function create() {
  close(); const epoch=generation;
  pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  pc.ondatachannel=e=>{if(epoch===generation)wire(e.channel,epoch);};
  pc.onconnectionstatechange=()=>{if(epoch!==generation)return;if(['failed','disconnected'].includes(pc.connectionState)){p2pState='error';connectionStatus();$('pairStatus').textContent='Conexão interrompida. Tente um novo convite ou outra rede.';}};
  return {connection:pc,epoch};
}
async function signal(connection, epoch) {
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{cleanup();reject(Error('A rede não respondeu. Tente novamente.'));},20000);
    function cleanup(){clearTimeout(timeout);connection.removeEventListener('icegatheringstatechange',check);}
    function check(){if(connection.iceGatheringState==='complete'){cleanup();resolve();}}
    connection.addEventListener('icegatheringstatechange',check);check();
  });
  if(epoch!==generation)throw Error('Conexão cancelada.');
  $('outgoing').value=JSON.stringify({v:1,type:connection.localDescription.type,sdp:connection.localDescription.sdp});
  $('pairStatus').textContent=connection.localDescription.type==='offer'?'Envie este convite ao segundo dispositivo. Aguarde a resposta e aplique aqui.':'Envie esta resposta ao primeiro dispositivo para concluir a conexão.';
}
async function action(fn) {
  const buttons=['invite','join','finish'];buttons.forEach(id=>$(id).disabled=true);
  $('pairStatus').textContent='Preparando conexão…';
  try {await fn();} catch(e){$('pairStatus').textContent=e.message;}
  finally{buttons.forEach(id=>$(id).disabled=false);}
}
$('invite').onclick=()=>action(async()=>{const {connection,epoch}=create();$('outgoing').value='';wire(connection.createDataChannel('papel'),epoch);await connection.setLocalDescription(await connection.createOffer());await signal(connection,epoch);});
$('join').onclick=()=>action(async()=>{const offer=readSignal($('incoming').value,'offer');const {connection,epoch}=create();$('outgoing').value='';await connection.setRemoteDescription(offer);await connection.setLocalDescription(await connection.createAnswer());await signal(connection,epoch);});
$('finish').onclick=()=>action(async()=>{if(!pc || pc.localDescription?.type!=='offer')throw Error('Crie um convite neste dispositivo primeiro.');await pc.setRemoteDescription(readSignal($('incoming').value,'answer'));$('pairStatus').textContent='Aguardando conexão direta. Se não conectar, tente outra rede.';});
$('disconnect').onclick=()=>{close();$('outgoing').value='';$('incoming').value='';$('pairStatus').textContent='Desconectado. As cópias locais foram preservadas.';};
$('connect').onclick=()=>$('pair').showModal();
function roomLink(value){const url=new URL(location.href);url.hash='sala='+value;return url.href;}
async function connectRelay(value,named=null){
  if(!validSecret(value))throw Error('Cole um link de sala válido.');
  relay.close();persist();close();namedRoom=named;
  const nextKey=named?'papel-named-notes:'+named.name+':'+(named.protected?'password':'public')+':'+value:'papel-link-notes:'+value;
  if(storageKey!==nextKey){storageKey=nextKey;let notes=[];try{notes=JSON.parse(localStorage.getItem(storageKey)||'[]');if(!Array.isArray(notes))notes=[];}catch{}book=new Notebook(crypto.randomUUID(),notes);render();}
  secret=value;
  const hash=named?'#nome='+named.name+'&tipo='+(named.protected?'senha':'publica'):'#sala='+secret;
  history.replaceState(null,'',hash);$('roomLink').value=named?location.href:roomLink(secret);
  relayState='connecting';connectionStatus();
  try{
    if(!window.supabase)throw Error('Biblioteca de conexão indisponível. Recarregue a página.');
    const response=await fetch('../farol4/config.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Configuração indisponível.');
    const config=await response.json();await relay.connect(config,secret);
  }catch(e){relayState='error';connectionStatus();$('relayStatus').textContent=e.message;}
}
$('newRoom').onclick=()=>connectRelay(newSecret());
$('joinRoom').onclick=()=>{
  try{const url=new URL($('roomLink').value.trim());const value=new URLSearchParams(url.hash.slice(1)).get('sala');connectRelay(value).catch(e=>$('relayStatus').textContent=e.message);}
  catch{$('relayStatus').textContent='Cole o link completo da sala.';}
};
$('leaveRoom').onclick=()=>{relay.close();relayState='off';secret='';history.replaceState(null,'',location.pathname+location.search);$('roomLink').value='';connectionStatus();};
$('copyLink').onclick=()=>copy($('roomLink').value,$('copyLink'));
function rememberedRooms(){try{const list=JSON.parse(localStorage.getItem('papel-room-list')||'[]');return Array.isArray(list)?list.filter(r=>r&&typeof r.name==='string'&&/^[a-z0-9][a-z0-9-]{1,23}$/.test(r.name)&&typeof r.protected==='boolean').slice(0,20):[];}catch{return [];}}
function showRooms(){
  $('recentRooms').replaceChildren();
  for(const entry of rememberedRooms()){
    const button=document.createElement('button');button.type='button';button.textContent=entry.name+(entry.protected?' · com senha':' · pública');
    button.onclick=()=>{$('roomName').value=entry.name;$('roomType').value=entry.protected?'password':'public';$('roomPassword').value='';togglePassword();$('roomName').focus();};
    $('recentRooms').append(button);
  }
}
function togglePassword(){$('passwordField').hidden=$('roomType').value!=='password';}
$('roomType').onchange=togglePassword;
$('enterNamed').onclick=async()=>{
  if(joining)return;joining=true;$('enterNamed').disabled=true;
  try{
    const name=normalizeRoom($('roomName').value),protectedRoom=$('roomType').value==='password';
    $('relayStatus').textContent='Preparando sala…';
    const value=await namedSecret(name,protectedRoom?$('roomPassword').value:null);
    $('roomPassword').value='';
    await connectRelay(value,{name,protected:protectedRoom});
    try{const list=rememberedRooms().filter(r=>r.name!==name||r.protected!==protectedRoom);localStorage.setItem('papel-room-list',JSON.stringify([{name,protected:protectedRoom},...list].slice(0,20)));showRooms();}catch{}
  }catch(e){$('relayStatus').textContent=e.message;}
  finally{joining=false;$('enterNamed').disabled=false;}
};
$('clearRooms').onclick=()=>{try{localStorage.removeItem('papel-room-list');showRooms();}catch{}};
$('text').oninput=()=>{book.edit(room,$('text').value);persist();count();clearTimeout(timer);timer=setTimeout(flush,150);};
document.querySelectorAll('[data-room]').forEach(button=>button.onclick=()=>{flush();room=Number(button.dataset.room);document.querySelectorAll('[data-room]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render();});
async function copy(value,button){const label=button.textContent;try{await navigator.clipboard.writeText(value);button.textContent='Copiado!';setTimeout(()=>button.textContent=label,1500);}catch{$('pairStatus').textContent='Selecione e copie manualmente.';$('relayStatus').textContent='Selecione e copie o link manualmente.';}}
$('copy').onclick=()=>copy($('text').value,$('copy'));
$('copyCode').onclick=()=>copy($('outgoing').value,$('copyCode'));
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([$('text').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`papel-${room}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('pagehide',()=>{persist();close();relay.close();});
render();
showRooms();togglePassword();
const initialParams=new URLSearchParams(location.hash.slice(1));
const initialSecret=initialParams.get('sala');
if(initialSecret)connectRelay(initialSecret).catch(e=>$('relayStatus').textContent=e.message);
if(initialParams.has('nome')){
  $('roomName').value=initialParams.get('nome');$('roomType').value=initialParams.get('tipo')==='senha'?'password':'public';togglePassword();$('pair').showModal();
  if($('roomType').value==='public')$('enterNamed').click();
}
if(!initialSecret&&!initialParams.has('nome')){
  $('roomName').value='papel-publico';$('roomType').value='public';togglePassword();
  $('text').disabled=true;
  namedSecret('papel-publico').then(value=>connectRelay(value,{name:'papel-publico',protected:false}))
    .catch(e=>$('relayStatus').textContent=e.message).finally(()=>$('text').disabled=false);
}
