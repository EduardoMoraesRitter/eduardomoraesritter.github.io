import {duration} from './transfer-rate.mjs?v=20260909-8';
import {dataSize} from './transfer-clock.mjs?v=20260909-5';
// Sender view of a transfer. With a return channel the receiver's confirmed count is the
// truth; without one only the blocks already shown on screen are known.
// Each frame carries 3 blocks, except one metadata frame every 12.
export const BLOCKS_PER_FRAME=3*11/12;
// Seconds for one pass over all blocks at this speed: the best case, when the receiver reads every QR.
export function sendEstimate({total,fps}){return fps>0?total/(fps*BLOCKS_PER_FRAME):null;}
// What the sender sees as soon as a file is chosen, before it starts.
export function fileSummary({size,total,bs,fps}){
  const parts=[`Tamanho: ${dataSize(size)}`,`${total} blocos de ${bs} bytes`];
  const seconds=sendEstimate({total,fps});
  if(seconds!==null)parts.push(`Estimativa: ${duration(seconds)} a ${fps} quadros/s, se o receptor ler todos os QR`);
  return parts.join(' · ');
}
export function speedText(rate){return rate>=1024?`${(rate/1024).toFixed(1)} KiB/s`:`${Math.round(rate)} B/s`;}
export function sendProgress({total,size,bs,confirmed=null,covered=0,done=false,running=false,paused=false,fps=0,rate=0,stalled=false}){
  const fromReceiver=Number.isInteger(confirmed);
  const count=done?total:Math.max(0,Math.min(total,fromReceiver?confirmed:covered));
  const bytes=Math.min(size,count*bs);
  const view={count,total,percent:Math.floor(count/total*100),fraction:count/total,
    countLabel:`${count} / ${total} blocos ${fromReceiver||done?'confirmados':'transmitidos'}`,remaining:'Aguardando transmissão',speed:'—'};
  if(done)return {...view,remaining:'Concluído'};
  if(paused)return {...view,remaining:'Pausado'};
  if(!running){
    if(count)return {...view,remaining:'Transmissão parada'};
    const seconds=sendEstimate({total,fps});
    return {...view,remaining:seconds===null?'Aguardando transmissão':`${duration(seconds)} (estimado)`};
  }
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
