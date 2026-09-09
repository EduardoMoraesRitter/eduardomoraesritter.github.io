export class AcousticAudio {
 constructor(onText,onStatus){this.onText=onText;this.onStatus=onStatus;this.busy=false;this.stream=null;}
 async enable(listen=false){
  if(!this.context){this.context=new AudioContext({sampleRate:48000});this.modulePromise=window.ggwave_factory({print:()=>{},printErr:()=>{}});}
  await this.context.resume();this.g=await this.modulePromise;
  if(this.instance===undefined){const p=this.g.getDefaultParameters();p.sampleRateInp=this.context.sampleRate;p.sampleRateOut=this.context.sampleRate;this.instance=this.g.init(p);if(this.instance<0)throw Error('Não foi possível iniciar o modem de som');}
  if(listen&&!this.stream){
   await this.context.audioWorklet.addModule('./audio-input.js?v=5-1');
   this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
   this.input=this.context.createMediaStreamSource(this.stream);this.node=new AudioWorkletNode(this.context,'farol-input');this.node.port.onmessage=e=>this.feed(e.data);this.mute=this.context.createGain();this.mute.gain.value=0;this.input.connect(this.node).connect(this.mute).connect(this.context.destination);
  }
  this.onStatus(listen?'Microfone ativo · aguardando bipes':'Som ativado · pronto para responder');
 }
 feed(samples){if(!this.g||this.instance===undefined)return;const result=this.g.decode(this.instance,new Int8Array(samples.buffer,samples.byteOffset,samples.byteLength));if(result?.length)this.onText(new TextDecoder().decode(result));}
 encode(text){const raw=this.g.encode(this.instance,text,this.g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,15);if(!raw?.length)throw Error('Não foi possível gerar o sinal');return new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));}
 async play(text){
  if(!this.context||this.context.state!=='running')throw Error('Ative o som para enviar a resposta');
  if(this.busy)return false;this.busy=true;
  try{const pcm=this.encode(text),buffer=this.context.createBuffer(1,pcm.length,this.context.sampleRate);buffer.copyToChannel(pcm,0);const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);this.onStatus('Emitindo retorno por som…');await new Promise((resolve,reject)=>{source.onended=resolve;try{source.start();}catch(e){reject(e);}});this.onStatus('Retorno emitido · aguardando próximos blocos');return true;}finally{this.busy=false;}
 }
 stopListening(){this.stream?.getTracks().forEach(t=>t.stop());this.input?.disconnect();this.node?.disconnect();this.mute?.disconnect();this.stream=null;}
}
