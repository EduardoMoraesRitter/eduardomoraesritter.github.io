// Copy only file progress; production room secrets and databases are not modified.
export async function readProductionProgress(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('farol4');
  request.onupgradeneeded=()=>{request.transaction.abort();};
  request.onerror=()=>request.error?.name==='AbortError'?resolve(null):reject(request.error);
  request.onsuccess=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('sessions')){db.close();resolve(null);return;}
   const tx=db.transaction('sessions','readonly'),q=tx.objectStore('sessions').get('current');
   q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();
  };
 });
}
