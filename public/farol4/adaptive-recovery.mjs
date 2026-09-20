// No inferred packet-loss percentage: repeated frames are expected during repair.
export function recoveryAction({age,fps,sinceAdjustment}){
 if(!Number.isFinite(age)||age<0||age>86400000)return {};
 if(age>=25000)return {pause:true};
 if(age>=8000&&sinceAdjustment>=6000&&fps>1)return {fps:Math.max(1,Math.floor(fps*.7))};
 return {};
}
