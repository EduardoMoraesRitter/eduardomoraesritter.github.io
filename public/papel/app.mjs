import {Notebook, readSignal} from './model.mjs';
const $ = id => document.getElementById(id);
const storageKey = 'papel-notes-v1';
let saved = [];
try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!Array.isArray(saved)) saved=[]; } catch {}
const book = new Notebook(crypto.randomUUID(), saved);
let room=1, pc=null, channel=null, generation=0, timer;
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
function flush() { clearTimeout(timer); book.notes.forEach(send); }
function close() {
  generation++; clearTimeout(timer); channel?.close(); pc?.close(); channel=null; pc=null;
  status('Só neste dispositivo');
}
function wire(data, epoch) {
  channel=data;
  data.onopen=()=>{if(epoch!==generation)return;status('Conectado · texto sincronizado',true);$('pairStatus').textContent='Conectado! Feche esta janela e escreva em qualquer uma das três folhas.';flush();};
  data.onmessage=e=>{
    if(epoch!==generation || typeof e.data!=='string' || e.data.length>100000)return;
    try {if(book.receive(JSON.parse(e.data))){persist();render();}}
    catch {}
  };
  data.onclose=()=>{if(epoch===generation)status('Desconectado · cópia local preservada');};
  data.onerror=()=>{if(epoch===generation)status('Falha na conexão · reconecte');};
}
function create() {
  close(); const epoch=generation;
  pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  pc.ondatachannel=e=>{if(epoch===generation)wire(e.channel,epoch);};
  pc.onconnectionstatechange=()=>{if(epoch!==generation)return;if(['failed','disconnected'].includes(pc.connectionState)){status('Conexão interrompida · cópia local preservada');$('pairStatus').textContent='Conexão interrompida. Tente um novo convite ou outra rede.';}};
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
$('text').oninput=()=>{book.edit(room,$('text').value);persist();count();clearTimeout(timer);timer=setTimeout(flush,150);};
document.querySelectorAll('[data-room]').forEach(button=>button.onclick=()=>{flush();room=Number(button.dataset.room);document.querySelectorAll('[data-room]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render();});
async function copy(value,button){try{await navigator.clipboard.writeText(value);button.textContent='Copiado!';setTimeout(()=>button.textContent=button.id==='copyCode'?'Copiar código':'Copiar texto',1500);}catch{$('pairStatus').textContent='Selecione o código e copie manualmente.';}}
$('copy').onclick=()=>copy($('text').value,$('copy'));
$('copyCode').onclick=()=>copy($('outgoing').value,$('copyCode'));
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([$('text').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`papel-${room}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('pagehide',()=>{persist();close();});
render();
