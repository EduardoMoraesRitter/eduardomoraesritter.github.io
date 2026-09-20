// Compare with the last KEPT image. Local tiles help retain small text changes.
export function similarFrames(previous,current,width,height,level='careful'){
 if(!previous||previous.length!==current.length)return false;
 const thresholds={careful:[.003,.015],balanced:[.01,.045],strong:[.025,.10]};
 const [globalLimit,localLimit]=thresholds[level]||thresholds.careful;
 let total=0,peak=0;
 for(let y=0;y<height;y+=16)for(let x=0;x<width;x+=16){
  let sum=0,n=0;
  for(let j=y;j<Math.min(y+16,height);j++)for(let i=x;i<Math.min(x+16,width);i++){
   const at=(j*width+i)*4;
   for(let c=0;c<3;c++)sum+=Math.abs(previous[at+c]-current[at+c]);
   n+=3;
  }
  total+=sum;peak=Math.max(peak,sum/(n*255));
 }
 return total/(width*height*3*255)<=globalLimit&&peak<=localLimit;
}
