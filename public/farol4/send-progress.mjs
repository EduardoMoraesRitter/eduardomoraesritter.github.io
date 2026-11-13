import {duration} from './transfer-rate.mjs?v=20260909-8';
// Sender view of a transfer. With a return channel the receiver's confirmed count is the
// truth; without one only the blocks already shown on screen are known.
// Each frame carries 3 blocks, except one metadata frame every 12.
export const BLOCKS_PER_FRAME=3*11/12;
export function speedText(rate){return rate>=1024?`${(rate/1024).toFixed(1)} KiB/s`:`${Math.round(rate)} B/s`;}
export function sendProgress({total,size,bs,confirmed=null,covered=0,done=false,running=false,paused=false,fps=0,rate=0,stalled=false}){
  const fromReceiver=Number.isInteger(confirmed);
  const count=done?total:Math.max(0,Math.min(total,fromReceiver?confirmed:covered));
  const bytes=Math.min(size,count*bs);
  const view={count,total,percent:Math.floor(count/total*100),fraction:count/total,
    countLabel:`${count} / ${total} blocos ${fromReceiver||done?'confirmados':'transmitidos'}`,remaining:'Aguardando transmissão',speed:'—'};
  if(done)return {...view,remaining:'Concluído'};
  if(paused)return {...view,remaining:'Pausado'};
  if(!running)return {...view,remaining:count?'Transmissão parada':'Aguardando transmissão'};
  if(fromReceiver){
    if(count===total)return {...view,remaining:'Verificando arquivo'};
    if(stalled)return {...view,remaining:'Sem novos blocos no receptor',speed:'0 B/s'};
    return rate>0?{...view,remaining:duration((size-bytes)/rate),speed:speedText(rate)}:{...view,remaining:'Calculando…'};
  }
  const blocksPerSecond=fps*BLOCKS_PER_FRAME,sendRate=Math.min(size,blocksPerSecond*bs);
  if(blocksPerSecond<=0)return view;
  const speed=`${speedText(sendRate)} na tela`;
  if(count===total)return {...view,remaining:'1ª volta completa · repetindo',speed};
  return {...view,remaining:`${duration((total-count)/blocksPerSecond)} (1ª volta)`,speed};
}
