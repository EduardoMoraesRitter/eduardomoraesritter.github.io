// Pure presentation of observed state. Ages are milliseconds, on any consistent
// caller clock. null means the event has never been observed in this session.
export const DIAGNOSTIC_DELAYS = Object.freeze({peer:12000, optical:8000});

export function diagnoseTransfer(s={}) {
  const result=(code,title,action='',tone='info')=>({code,title,action,tone,text:[title,action].filter(Boolean).join(' · ')});
  const receiving=s.mode==='receive';
  const connected=s.connectionState==='SUBSCRIBED';
  const peerRecent=connected&&Number.isFinite(s.peerAgeMs)&&s.peerAgeMs>=0&&s.peerAgeMs<DIAGNOSTIC_DELAYS.peer;
  if(s.complete)return result('complete',receiving?'Arquivo verificado':'Arquivo entregue',receiving?'Salve o arquivo neste aparelho.':'O receptor confirmou a integridade.','success');
  if(s.verifying)return result('verifying','Todos os blocos recebidos','Verificando a integridade do arquivo.');
  if(s.paused){
    const confirmed=s.pauseConfirmed&&s.online!==false&&peerRecent;
    return result(confirmed?'paused':'pause-pending',confirmed?'Pausado nos dois aparelhos':'Pausado aqui',confirmed?'Continue em qualquer aparelho.':'Aguardando confirmação do outro aparelho.',confirmed?'info':'warning');
  }
  if(s.online===false)return result('offline','O navegador informa que está sem internet','A leitura por câmera pode continuar; a confirmação e os pedidos de blocos aguardam conexão.','warning');
  if(s.sameRole)return result('same-role','Os dois aparelhos estão no mesmo modo','Escolha Transmitir em um e Receber no outro.','warning');
  if(['ERROR','CHANNEL_ERROR','TIMED_OUT'].includes(s.connectionState))return result('connection-error','Não foi possível confirmar a conexão com o Supabase','Abra Conexão e ajustes e tente reconectar.','warning');
  if(s.connectionState==='CONNECTING')return result('connecting','Conectando ao Supabase','Aguarde a confirmação da sala.');
  if(s.connectionState==='CLOSED'&&s.hasRoom)return result('connection-closed','Conexão de retorno encerrada','Reconecte para confirmar o outro aparelho e pedir blocos faltantes.','warning');
  if(connected&&!peerRecent)return result('peer-missing','Sem confirmação recente do outro aparelho',receiving?'Confira se o transmissor está aberto na mesma sala.':'Abra o receptor e leia o QR de conexão.','warning');
  if(receiving){
    if(!s.cameraActive)return result('camera-off','Câmera desligada','Ligue a câmera para ler o QR do transmissor.');
    const recentQr=Number.isFinite(s.qrAgeMs)&&s.qrAgeMs>=0&&s.qrAgeMs<DIAGNOSTIC_DELAYS.optical;
    if(!recentQr&&s.cameraAgeMs>=DIAGNOSTIC_DELAYS.optical)return result('no-qr','Sem leitura recente de QR','Enquadre o código inteiro, estabilize o celular e ajuste a distância.','warning');
    if(recentQr&&s.hasFile&&s.progressAgeMs>=DIAGNOSTIC_DELAYS.optical&&!s.verifying)return result('no-new-blocks','QR reconhecido, mas sem blocos novos','Confira se o transmissor está enviando; mantenha a câmera ligada para recuperar os faltantes.','warning');
    return result(recentQr?'receiving':'camera-ready',recentQr?'QR reconhecido':'Câmera pronta',recentQr?'Mantenha o código enquadrado.':'Aponte para o QR do transmissor.',recentQr?'success':'info');
  }
  if(s.transmitting)return result('transmitting','Transmitindo',peerRecent?'Receptor confirmado nesta sala.':'Aguardando confirmação do receptor.');
  return result('ready',s.hasFile?'Arquivo pronto':'Pronto para começar',s.hasFile?'Mostre o QR ao receptor e inicie a transmissão.':'Escolha o arquivo que deseja transmitir.');
}
