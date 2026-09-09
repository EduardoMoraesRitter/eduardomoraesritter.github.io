class FarolInput extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Float32Array(1024);this.used=0;}
 process(inputs){const data=inputs[0]?.[0];if(data)for(const sample of data){this.samples[this.used++]=sample;if(this.used===1024){this.port.postMessage(this.samples);this.samples=new Float32Array(1024);this.used=0;}}return true;}
}
registerProcessor('farol-input',FarolInput);
