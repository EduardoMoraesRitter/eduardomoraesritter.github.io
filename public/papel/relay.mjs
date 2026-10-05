import {roomKeys,seal,open} from './crypto.mjs';
import {validNote} from './model.mjs';
export class Relay {
  constructor(createClient,onNote,onState){this.createClient=createClient;this.onNote=onNote;this.onState=onState;this.identity=crypto.randomUUID();this.epoch=0;this.sequence=0;this.peers=new Map();this.outbox=Promise.resolve();this.inbox=Promise.resolve();this.ready=false;}
  async connect(config,secret){
    this.close();const epoch=this.epoch;
    const keys=await roomKeys(secret);if(epoch!==this.epoch)return;
    this.keys=keys;this.onState('connecting',0);
    this.client=this.createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    this.channel=this.client.channel(keys.topic,{config:{broadcast:{ack:true,self:false}}});
    this.channel.on('broadcast',{event:'paper'},({payload})=>{
      this.inbox=this.inbox.then(async()=>{
        if(epoch!==this.epoch)return;
        try{
          const m=await open(keys.key,payload);
          if(epoch!==this.epoch||!this.valid(m))return;
          const previous=this.peers.get(m.from);
          if(m.seq<=(previous?.seq||0))return;
          if(!previous&&this.peers.size>=16)return;
          this.peers.set(m.from,{seq:m.seq,time:Date.now()});
          this.report();
          if(m.type==='hello'){this.send('hello_ack');this.onNote(null);}
          else if(m.type==='hello_ack')this.onNote(null);
          else if(m.type==='note')this.onNote(m.note);
          else if(!previous)this.onNote(null);
        }catch{/* Invalid ciphertext never changes notes. */}
      });
    }).subscribe(state=>{
      if(epoch!==this.epoch)return;
      this.ready=state==='SUBSCRIBED';
      if(this.ready){this.report();this.send('hello');this.onNote(null);}
      else{this.peers.clear();this.onState(state==='CHANNEL_ERROR'||state==='TIMED_OUT'?'error':'connecting',0);}
    });
    this.heartbeat=setInterval(()=>{
      if(epoch!==this.epoch)return;
      for(const [id,peer] of this.peers)if(Date.now()-peer.time>25000)this.peers.delete(id);
      if(this.ready){this.report();this.send('ping');}
    },8000);
  }
  valid(m){return m&&m.v===1&&typeof m.from==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(m.from)&&m.from!==this.identity&&Number.isSafeInteger(m.seq)&&m.seq>0&&Number.isFinite(m.time)&&Math.abs(Date.now()-m.time)<60000&&['hello','hello_ack','ping','note'].includes(m.type)&&(m.type!=='note'||validNote(m.note));}
  report(){this.onState('ready',this.peers.size);}
  send(type,note){
    const epoch=this.epoch;
    const job=this.outbox.then(async()=>{
      if(epoch!==this.epoch||!this.ready)return false;
      const payload=await seal(this.keys.key,{v:1,type,note,from:this.identity,seq:++this.sequence,time:Date.now()});
      if(epoch!==this.epoch||!this.ready)return false;
      const result=await this.channel.send({type:'broadcast',event:'paper',payload});
      if(result!=='ok'&&epoch===this.epoch){this.needsSync=true;this.onState('send_error',this.peers.size);}
      else if(epoch===this.epoch&&this.needsSync){this.needsSync=false;this.onNote(null);}
      return result==='ok';
    }).catch(()=>{if(epoch===this.epoch)this.onState('send_error',this.peers.size);return false;});
    this.outbox=job;return job;
  }
  close(){
    this.epoch++;this.ready=false;this.needsSync=false;clearInterval(this.heartbeat);this.peers.clear();
    const client=this.client;this.client=null;this.channel=null;
    if(client){client.removeAllChannels().catch(()=>{});client.realtime.disconnect();}
  }
}
