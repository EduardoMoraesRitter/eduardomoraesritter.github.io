// Lamport-ordered state converges despite delayed/repeated control messages.
// Concurrent pause wins over resume; file and room checks happen in the caller.
export class PauseState {
  constructor(author){this.author=author;this.reset();}
  reset(){this.value={revision:0,author:'',paused:false};}
  change(paused){this.value={revision:this.value.revision+1,author:this.author,paused};return this.value;}
  accept(next){
    if(!next||!Number.isSafeInteger(next.revision)||next.revision<1||typeof next.author!=='string'||next.author.length>64||!next.author||typeof next.paused!=='boolean')return false;
    const old=this.value;
    const newer=next.revision>old.revision||(next.revision===old.revision&&(Number(next.paused)>Number(old.paused)||(next.paused===old.paused&&next.author>old.author)));
    if(!newer)return false;
    this.value={revision:next.revision,author:next.author,paused:next.paused};return true;
  }
  matches(other){return other?.revision===this.value.revision&&other?.author===this.value.author&&other?.paused===this.value.paused;}
}
