/* MouldMaster runtime-v2 learner-scope bridge — 2026.09.08.27 */
(function(){
'use strict';
const VERSION='2026.09.08.27',R=window.MM_RUNTIME_V2,S=window.MM_LEARNER_SCOPE;if(!R||!S)throw new Error('runtime-v2-scope-bridge-v27 requires MM_RUNTIME_V2 and MM_LEARNER_SCOPE');
const storage=Object.freeze({key(base){return `${String(base)}::${S.token()}`},get(base,fallback=null){try{const raw=localStorage.getItem(this.key(base));return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}},set(base,value){try{localStorage.setItem(this.key(base),JSON.stringify(value));return true}catch(_){return false}},remove(base){try{localStorage.removeItem(this.key(base));return true}catch(_){return false}},learnerToken:()=>S.token()});
const originalSnapshot=typeof R.snapshot==='function'?R.snapshot.bind(R):()=>({});
const next=Object.freeze({...R,version:R.version,storage,snapshot(){const x=originalSnapshot()||{};return {...x,learnerToken:S.token(),scopeProvider:'MM_LEARNER_SCOPE',scopeBridgeVersion:VERSION}},scopeBridgeVersion:VERSION,policy:`${R.policy||''} Learner storage is bound to MM_LEARNER_SCOPE opaque references in release ${VERSION}.`.trim()});
window.MM_RUNTIME_V2=next;try{R.registerModule?.('runtime-v2-scope-bridge-v27',{version:VERSION,type:'learner-scope-bridge',status:'active'})}catch(_){}
})();
