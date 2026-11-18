// Advice on the sender's frame rate, from what both sides measure.
// frames/codes: what the sender's screen really shows per second.
// scans: camera frames the receiver analyses per second. fresh: new blocks it accepts per second.
export const FPS_MIN=1,FPS_MAX=12;
export function clampFps(value){return Math.min(FPS_MAX,Math.max(FPS_MIN,Math.round(Number(value)||FPS_MIN)));}
export function speedAdvice({fps,frames=0,codes=0,scans=0,fresh=0,sinceAdjustment=0,active=false}={}){
  const result=(action,text,target=fps)=>({action,target,text});
  if(!active)return result('wait','');
  // Near the end the sender shows few codes; the ratio is too noisy to judge.
  if(sinceAdjustment<6000||!(scans>0)||!(codes>=frames*1.4))return result('wait','Medindo a leitura…');
  const captured=Math.min(1,fresh/codes),percent=Math.round(captured*100);
  // Each frame must be seen at least once: more frames than scans always loses data.
  if(frames>scans*.95&&fps>FPS_MIN)
    return result('down',`Diminua a velocidade: a câmera analisa ${scans.toFixed(1)} imagens/s e a tela troca ${frames.toFixed(1)} vezes/s.`,Math.max(FPS_MIN,Math.min(fps-1,Math.floor(scans*.8))));
  if(captured<.55){
    // Seen twice or more and still unread: slowing down will not fix it.
    if(frames<=scans*.5||fps<=FPS_MIN)return result('frame',`Só ${percent}% dos QR viram blocos novos, e não é a velocidade: ajuste distância, foco e brilho.`);
    return result('down',`Diminua a velocidade: só ${percent}% dos QR viram blocos novos.`,fps-1);
  }
  if(captured>=.9&&fps<FPS_MAX&&scans>=(fps+1)*1.3)
    return result('up',`Pode aumentar a velocidade: ${percent}% dos QR viram blocos novos e a câmera tem folga.`,Math.min(FPS_MAX,fps+2,Math.max(fps+1,Math.floor(scans/1.3))));
  return result('keep',`Velocidade boa: ${percent}% dos QR viram blocos novos.`);
}
// Short label for the corner badge.
export function adviceBadge(fps,action){
  const hint={up:'pode aumentar',down:'diminua',frame:'ajuste o enquadramento',keep:'boa',auto:'automático'}[action];
  return `${fps} quadros/s`+(hint?` · ${hint}`:'');
}
