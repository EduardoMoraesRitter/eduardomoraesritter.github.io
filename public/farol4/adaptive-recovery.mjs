// No inferred packet-loss percentage: repeated frames are expected during repair.
export function recoveryAction({age,fps,sinceAdjustment}){
 if(!Number.isFinite(age)||age<0||age>86400000)return {};
 if(age>=25000)return {pause:true};
 if(age>=8000&&sinceAdjustment>=6000&&fps>1)return {fps:Math.max(1,Math.floor(fps*.7))};
 return {};
}

// Only the receiver can resume a confirmed stall pause, after refreshing repairs.
export function canRetryReception({pause,confirmed,waitMs,cameraActive,connected,peerAgeMs,visible,missing,blocked}){
 return pause.paused&&pause.reason==='stall'&&confirmed&&waitMs>=5000&&
  cameraActive&&connected&&peerAgeMs>=0&&peerAgeMs<12000&&visible&&missing>0&&!blocked;
}
