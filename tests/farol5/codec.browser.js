async (page) => {
 await page.reload();
 console.log(await page.evaluate(async()=>{
 const {AcousticPackets}=await import('/farol5/acoustic-packets.mjs');
 const a=await AcousticPackets.create('ab'.repeat(32)),b=await AcousticPackets.create('ab'.repeat(32));
 const text=await a.encode({type:1,count:900,indices:Array.from({length:16},(_,i)=>900+i)});
 const g=await ggwave_factory(),p=g.getDefaultParameters();p.sampleRateInp=48000;p.sampleRateOut=48000;
 const enc=g.init(p),dec=g.init(p),raw=g.encode(enc,text,g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,15);
 const pcm=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));let result=null;
 for(let i=0;i<pcm.length+48000;i+=1024){const chunk=new Float32Array(1024);chunk.set(pcm.subarray(i,Math.min(i+1024,pcm.length)));const out=g.decode(dec,new Int8Array(chunk.buffer));if(out?.length)result=new TextDecoder().decode(out);}
 g.free(enc);g.free(dec);if(result!==text)throw Error('Audio roundtrip failed');
 return {payloadBytes:text.length,audioSeconds:pcm.length/48000,decoded:await b.decode(result)};
 }));
}
