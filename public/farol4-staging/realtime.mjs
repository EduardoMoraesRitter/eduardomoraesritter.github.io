import {controlKey,digest,seal,open} from './protocol.mjs?v=staging-20260909-1';

// A random 256-bit pairing secret authenticates/encrypts control messages.
// Public Broadcast is a transport only; no file bytes enter its payload.
export class ReturnChannel {
  constructor(onMessage,onState,createClient) {
    this.onMessage=onMessage;this.onState=onState;this.createClient=createClient;
    this.client=null;this.channel=null;this.ready=false;this.sequence=0;
    this.identity=crypto.randomUUID();this.peers=new Map();this.generation=0;
  }
  async connect(url,key,code) {
    await this.close(); const generation=this.generation;
    this.key=await controlKey(code);
    const hash=await digest(new TextEncoder().encode(code));
    const topic='farol4-staging:'+hash;
    if(generation!==this.generation)return;
    this.roomId=hash.slice(0,12).toUpperCase().match(/.{4}/g).join('-');this.onState('CONNECTING');
    this.client=this.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    this.channel=this.client.channel(topic,{config:{broadcast:{ack:true,self:false}}});
    this.channel.on('broadcast',{event:'control'},async ({payload})=>{
      if(generation!==this.generation)return;
      try {
        const m=await open(this.key,payload);
        if(generation!==this.generation||m.v!==4||typeof m.from!=='string'||m.from.length>64||m.from===this.identity||
          !Number.isSafeInteger(m.seq)||m.seq<=0||!Number.isFinite(m.time)||Math.abs(Date.now()-m.time)>60000||
          !['missing','done','hello','hello_ack','ready','pause_state','pause_ack'].includes(m.type))return;
        if(m.seq<=(this.peers.get(m.from)||0))return;
        if(this.peers.size>32&&!this.peers.has(m.from))return;
        this.peers.set(m.from,m.seq);this.onMessage(m);
      }catch{/* Unpaired, corrupted or invalid envelopes never affect transmission. */}
    }).subscribe(status=>{
      if(generation!==this.generation)return;
      this.ready=status==='SUBSCRIBED';this.onState(status);
    });
  }
  async send(message) {
    if(!this.ready||!this.channel)return false;
    const channel=this.channel,generation=this.generation;
    const payload=await seal(this.key,{...message,v:4,from:this.identity,seq:++this.sequence,time:Date.now()});
    if(generation!==this.generation)return false;
    try{return await channel.send({type:'broadcast',event:'control',payload})==='ok';}catch{return false;}
  }
  async close() {
    this.generation++;this.ready=false;this.peers.clear();
    const client=this.client;this.client=null;this.channel=null;
    if(client){await client.removeAllChannels();client.realtime.disconnect();}
  }
}
