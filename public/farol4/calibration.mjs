import {b64,unb64,crc32} from './protocol.mjs';

// Three independent, numbered color channels. Duplicate camera scans never add credit.
export function calibrationRun(fps=6,bs=400,id=crypto.randomUUID().replaceAll('-','')) {
  if(!Number.isInteger(fps)||fps<1||fps>12||![256,400,600].includes(bs)||!/^[a-f0-9]{32}$/.test(id))throw Error('Configuração de teste inválida.');
  const total=fps*8;
  return {id,fps,bs,total,frame(sequence){
    if(!Number.isInteger(sequence)||sequence<0||sequence>=total)throw Error('Quadro de teste inválido.');
    return [0,1,2].map(channel=>{
      const bytes=Uint8Array.from({length:bs},(_,i)=>(i*73+sequence*17+channel*91)%256);
      return `F4|C|${id}|${fps}|${bs}|${total}|${sequence}|${channel}|${crc32(bytes)}|${b64(bytes)}`;
    });
  }};
}

export function readCalibration(packet){
  if(typeof packet!=='string'||packet.length>1200)return null;
  const p=packet.split('|');
  if(p.length!==10||p[0]!=='F4'||p[1]!=='C'||!/^[a-f0-9]{32}$/.test(p[2])||!p.slice(3,8).every(v=>/^\d+$/.test(v)))return null;
  const [fps,bs,total,sequence,channel]=p.slice(3,8).map(Number);
  if(fps<1||fps>12||![256,400,600].includes(bs)||total!==fps*8||sequence>=total||channel>2)return null;
  try{const bytes=unb64(p[9]);if(bytes.length!==bs||crc32(bytes)!==p[8])return null;}catch{return null;}
  return {id:p[2],fps,bs,total,sequence,channel};
}

export class CalibrationSample {
  constructor(){this.run=null;this.seen=new Set();this.frames=new Set();}
  accept(packet){
    const p=readCalibration(packet);if(!p)return false;
    if(this.run&&(p.id!==this.run.id||p.fps!==this.run.fps||p.bs!==this.run.bs||p.total!==this.run.total))return false;
    this.run??=p;
    const key=p.sequence*3+p.channel;
    if(this.seen.has(key))return false;
    this.seen.add(key);this.frames.add(p.sequence);return true;
  }
  result(){
    const expected=(this.run?.total||0)*3,received=this.seen.size,ratio=expected?received/expected:0;
    const enough=this.frames.size>=3&&received>=9;
    return {expected,received,ratio,enough,fps:this.run?.fps||null,bs:this.run?.bs||null,
      suggestedFps:enough?Math.max(1,Math.min(this.run.fps,Math.floor(this.run.fps*(ratio>=.95?1:ratio*.8)))):null};
  }
}

export function createCalibration({render,beforeTest,getFps,getBlockSize,isReceiving,isCameraActive,onFinished=()=>{}}){
  const $=id=>document.getElementById(id);
  let sendTimer=null,receiveTimer=null,sample=null,armed=false;
  function stopSender(message='Teste encerrado. A transmissão permanece pausada.'){
    if(sendTimer)clearInterval(sendTimer);sendTimer=null;
    $('calibrationSend').textContent='Testar QR por 8 segundos';
    if(message)$('calibrationSendStatus').textContent=message;
  }
  function finishReceiver(){
    clearTimeout(receiveTimer);receiveTimer=null;armed=false;$('calibrationReceive').textContent='Medir leitura novamente';
    const r=sample?.result();
    $('calibrationReceiveStatus').textContent=!r?.enough
      ?'Poucos quadros distintos lidos. Aproxime o QR, ajuste o zoom e a luz; repita o teste antes de escolher a velocidade.'
      :`${r.received} de ${r.expected} canais lidos (${Math.round(r.ratio*100)}%). Sugestão inicial: ${r.suggestedFps} quadros/s no transmissor, com ${r.bs} bytes por bloco. ${r.ratio>=.95?'Mantenha o enquadramento.':'Ajuste o zoom para deixar o QR inteiro e nítido; repita o teste.'} Esta medição não garante a velocidade durante todo o arquivo.`;
    $('calibrationReceiveStatus').scrollIntoView({block:'center',behavior:'instant'});
  }
  function cancel(){stopSender(sendTimer?'Teste cancelado. Inicie outro teste para obter uma nova medição.':null);if(armed){clearTimeout(receiveTimer);receiveTimer=null;armed=false;$('calibrationReceive').textContent='Medir leitura';$('calibrationReceiveStatus').textContent='Teste cancelado. Inicie uma nova medição com a câmera ligada.';}}
  $('calibrationSend').onclick=()=>{
    if(sendTimer){stopSender();onFinished();return;}
    beforeTest();
    const run=calibrationRun(Number(getFps()),Number(getBlockSize()));let sequence=0;
    $('calibrationSend').textContent='Parar teste';
    $('calibrationSendStatus').textContent=`Teste a ${run.fps} quadros/s. Confira a sugestão no receptor ao terminar.`;
    const tick=()=>{if(sequence>=run.total){stopSender('Teste concluído. Veja o resultado no receptor, ajuste a velocidade e clique em Transmitir.');onFinished();return;}render(run.frame(sequence++));};
    tick();sendTimer=setInterval(tick,1000/run.fps);
  };
  $('calibrationReceive').onclick=()=>{
    if(armed){finishReceiver();return;}
    if(!isCameraActive()){$('calibrationReceiveStatus').textContent='Ligue a câmera antes de medir a leitura.';return;}
    beforeTest();sample=new CalibrationSample();armed=true;
    $('calibrationReceive').textContent='Encerrar medição';
    $('calibrationReceiveStatus').textContent='Agora inicie o teste no transmissor e mantenha o QR inteiro no enquadramento.';
    receiveTimer=setTimeout(finishReceiver,30000);
  };
  return {cancel,get active(){return !!sendTimer;},receive(packet){
    if(!packet.startsWith('F4|C|'))return false;
    if(!armed||!isReceiving())return true;
    const first=!sample.run;
    if(sample.accept(packet)){
      if(first){clearTimeout(receiveTimer);receiveTimer=setTimeout(finishReceiver,10000);}
      const r=sample.result();$('calibrationReceiveStatus').textContent=`Medindo: ${r.received} de ${r.expected} canais distintos. Mantenha o enquadramento.`;
      if(r.received===r.expected)finishReceiver();
    }
    return true;
  }};
}


