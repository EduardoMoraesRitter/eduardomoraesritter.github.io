import {videoPrints} from '../farol4/video-prints.mjs?v=20260921-1';
import {videoAudio} from '../farol4/video-audio.mjs?v=20260920-6';
const $=id=>document.getElementById(({newSend:'file',blockSize:'chunk'})[id]||id);
let file;const sender=true;
function setPaused(){window.dispatchEvent(new Event('farol3-pause-preparation'));}
function prepare(){
 const transfer=new DataTransfer();transfer.items.add(file);$('file').files=transfer.files;
 $('file').dispatchEvent(new Event('change',{bubbles:true}));
}
let printsController=null,printsDownloadUrl=null;
$('printsDedupe').onchange=()=>{$('printsSensitivity').disabled=!$('printsDedupe').checked;};
$('cancelPrints').onclick=()=>printsController?.abort();
$('generatePrints').onclick=async()=>{
  if(printsController)return;
  const source=$('printsVideo').files[0];
  if(!source){$('printsStatus').textContent='Escolha o vídeo de origem.';return;}
  const controller=new AbortController();printsController=controller;
  if(sender)setPaused(true);
  for(const id of ['generatePrints','extractAudio','previewPrints','file','newSend','blockSize'])$(id).disabled=true;
  $('cancelPrints').hidden=false;
  try{
    const result=await videoPrints(source,{interval:Number($('printsInterval').value)*Number($('printsUnit').value),png:$('printsFormat').value==='png',compact:$('printsCompact').value==='compact',maxDimension:Number($('printsDimension').value),quality:Number($('printsQuality').value),deduplicate:$('printsDedupe').checked,sensitivity:$('printsSensitivity').value,signal:controller.signal,onProgress:text=>{$('printsStatus').textContent=text;}});
    if(printsDownloadUrl)URL.revokeObjectURL(printsDownloadUrl);
    printsDownloadUrl=URL.createObjectURL(result.zip);
    $('downloadPrints').href=printsDownloadUrl;$('downloadPrints').download=result.zip.name;$('downloadPrints').hidden=false;
    file=result.zip;
    try{const transfer=new DataTransfer();transfer.items.add(file);$('file').files=transfer.files;}catch{$('file').value='';}
    $('printsStatus').textContent=`${result.count} prints · ${result.analyzed} analisadas · ${result.discarded} descartadas · economia nas imagens: ${result.originalBytes?Math.round((1-result.imageBytes/result.originalBytes)*100):0}% · ZIP de ${(file.size/1e6).toFixed(1)} MB selecionado para transmitir. Você também pode baixar uma cópia.`;
    await prepare();
  }catch(e){$('printsStatus').textContent=e.name==='AbortError'?'Geração cancelada.':e.message;}
  finally{printsController=null;$('cancelPrints').hidden=true;for(const id of ['generatePrints','extractAudio','previewPrints','file','newSend','blockSize'])$(id).disabled=false;}
};
window.addEventListener('pagehide',()=>{printsController?.abort();if(printsDownloadUrl)URL.revokeObjectURL(printsDownloadUrl);});

$('extractAudio').onclick=async()=>{
  if(printsController)return;
  const source=$('printsVideo').files[0];
  if(!source){$('printsStatus').textContent='Escolha o vídeo de origem.';return;}
  const controller=new AbortController();printsController=controller;if(sender)setPaused(true);
  for(const id of ['generatePrints','extractAudio','previewPrints','file','newSend','blockSize'])$(id).disabled=true;
  $('cancelPrints').hidden=false;$('printsStatus').textContent='Preparando extração de áudio…';
  try{
    const zip=await videoAudio(source,{signal:controller.signal,onProgress:text=>{$('printsStatus').textContent=text;}});
    if(printsDownloadUrl)URL.revokeObjectURL(printsDownloadUrl);printsDownloadUrl=URL.createObjectURL(zip);
    $('downloadPrints').href=printsDownloadUrl;$('downloadPrints').download=zip.name;$('downloadPrints').hidden=false;
    file=zip;try{const transfer=new DataTransfer();transfer.items.add(file);$('file').files=transfer.files;}catch{$('file').value='';}
    $('printsStatus').textContent=`Áudio em ZIP · ${(zip.size/1e6).toFixed(1)} MB · selecionado para transmitir. Baixe uma cópia para conferir o som.`;
    await prepare();
  }catch(e){$('printsStatus').textContent=e.name==='AbortError'?'Extração cancelada.':e.message;}
  finally{printsController=null;$('cancelPrints').hidden=true;for(const id of ['generatePrints','extractAudio','previewPrints','file','newSend','blockSize'])$(id).disabled=false;}
};

let previewUrls=[];
function clearPrintsPreview(){for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls=[];$('printsPreview').hidden=true;}
for(const id of ['printsVideo','printsFormat','printsCompact','printsDimension','printsQuality','printsInterval','printsUnit'])$(id).addEventListener('change',clearPrintsPreview);
$('previewPrints').onclick=async()=>{
 if(printsController)return;
 const source=$('printsVideo').files[0];if(!source){$('printsStatus').textContent='Escolha o vídeo de origem.';return;}
 const controller=new AbortController();printsController=controller;$('cancelPrints').hidden=false;
 for(const id of ['generatePrints','extractAudio','previewPrints'])$(id).disabled=true;
 clearPrintsPreview();$('printsStatus').textContent='Preparando prévia…';
 try{
  const result=await videoPrints(source,{previewOnly:true,interval:Number($('printsInterval').value)*Number($('printsUnit').value),png:$('printsFormat').value==='png',compact:$('printsCompact').value==='compact',maxDimension:Number($('printsDimension').value),quality:Number($('printsQuality').value),signal:controller.signal});
  previewUrls=[URL.createObjectURL(result.original),URL.createObjectURL(result.optimized)];
  $('previewBefore').src=previewUrls[0];$('previewAfter').src=previewUrls[1];
  $('previewSize').textContent=`Antes: ${(result.original.size/1024).toFixed(1)} KB (${result.originalWidth}×${result.originalHeight}). Depois: ${(result.optimized.size/1024).toFixed(1)} KB (${result.width}×${result.height}). Economia: ${Math.round((1-result.optimized.size/result.original.size)*100)}%. Estimativa para ${result.captures} capturas: ${(result.estimatedBytes/1e6).toFixed(1)} MB, baseada apenas no primeiro print e sem descontar semelhantes.`;
  $('printsPreview').hidden=false;$('printsStatus').textContent='Prévia pronta. Confira a qualidade antes de gerar o ZIP.';
 }catch(e){$('printsStatus').textContent=e.name==='AbortError'?'Prévia cancelada.':e.message;}
 finally{printsController=null;$('cancelPrints').hidden=true;for(const id of ['generatePrints','extractAudio','previewPrints'])$(id).disabled=false;}
};
window.addEventListener('pagehide',clearPrintsPreview);

$('openAudioTools').onclick=()=>{$('videoPrintsPanel').open=true;$('printsVideo').scrollIntoView({block:'center'});$('printsVideo').focus();};
