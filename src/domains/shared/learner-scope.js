/* MouldMaster learner identity/storage boundary — 2026.09.08.27 */
(function(){
'use strict';
if(window.MM_LEARNER_SCOPE?.version==='2026.09.08.27')return;
if(typeof Storage==='undefined'||typeof localStorage==='undefined')throw new Error('MouldMaster learner boundary requires localStorage');
const VERSION='2026.09.08.27';
const ANONYMOUS='anonymous';
const REGISTRY_KEY='mm_learner_scope_registry_v3';
const QUARANTINE_PREFIX='mm_scope_quarantine_v27::';
const EXACT_BASES=new Set(['mm_seen_v1','mm_quiz_v1','mm_path_v1','mm_streak_v1','mm_practice_scenario_rotation_v1']);
const WEAK_BASES=['mm_multimodal_assessment_v1','mm_real_measured_assessment_v1'];
const P=Storage.prototype;
const rawGet=P.getItem,rawSet=P.setItem,rawRemove=P.removeItem,rawKey=P.key;
const registeredPrefixes=new Set();
function text(v){return String(v??'')}
function currentDb(){try{if(typeof db!=='undefined'&&db)return db}catch(_){}return window.db||null}
function currentUser(){try{if(typeof user!=='undefined'&&user)return user}catch(_){}return window.user||null}
function persistNow(){try{if(typeof persist==='function'){persist();return true}}catch(_){}try{if(typeof window.persist==='function'){window.persist();return true}}catch(_){}return false}
function activeId(){const d=currentDb(),u=currentUser();if(d?.activeUser)return String(d.activeUser);if(u?.id)return String(u.id);return ANONYMOUS}
function profileRegistry(){try{const d=currentDb();if(d?.users&&typeof d.users==='object'&&!Array.isArray(d.users))return {available:true,ids:[...new Set(Object.keys(d.users).map(String).filter(Boolean))]}}catch(_){}return {available:false,ids:[]}}
function knownIds(){return profileRegistry().ids.slice()}
function previousHash128(raw){const value=String(raw??'');let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;for(let i=0;i<value.length;i++){const k=value.charCodeAt(i);h1=h2^Math.imul(h1^k,597399067);h2=h3^Math.imul(h2^k,2869860233);h3=h4^Math.imul(h3^k,951274213);h4=h1^Math.imul(h4^k,2716044179)}h1=Math.imul(h3^(h1>>>18),597399067);h2=Math.imul(h4^(h2>>>22),2869860233);h3=Math.imul(h1^(h3>>>17),951274213);h4=Math.imul(h2^(h4>>>19),2716044179);h1=(h1^h2^h3^h4)>>>0;h2=(h2^h1)>>>0;h3=(h3^h1)>>>0;h4=(h4^h1)>>>0;return[h1,h2,h3,h4].map(x=>x.toString(16).padStart(8,'0')).join('')}
function previousTokenFor(raw=ANONYMOUS){const value=raw?String(raw):ANONYMOUS;return previousHash128(`mm-learner-scope-v2|${value}`)}
function legacyTokenFor(raw=ANONYMOUS){const value=raw?String(raw):ANONYMOUS;let h=2166136261;for(const ch of value){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function strongRandomToken(){const c=window.crypto;if(!c)throw new Error('Web Crypto is required for learner identity isolation');if(typeof c.randomUUID==='function')return c.randomUUID().replace(/-/g,'').toLowerCase();if(typeof c.getRandomValues==='function'){const bytes=new Uint8Array(16);c.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}throw new Error('Web Crypto random generator is unavailable')}
function readRegistry(){try{const x=JSON.parse(rawGet.call(localStorage,REGISTRY_KEY)||'{}');const entries=x&&typeof x.entries==='object'&&!Array.isArray(x.entries)?x.entries:{};return {version:3,entries:{...entries}}}catch(_){return {version:3,entries:{}}}}
function writeRegistry(reg){rawSet.call(localStorage,REGISTRY_KEY,JSON.stringify({version:3,entries:reg.entries}))}
function validStrong(v){return /^[0-9a-f]{32}$/.test(String(v||''))}
function tokenFor(raw=ANONYMOUS){const id=raw?String(raw):ANONYMOUS;const reg=readRegistry();let t=reg.entries[id];if(!validStrong(t)){t=strongRandomToken();reg.entries[id]=t;writeRegistry(reg)}return t}
function normalizeToken(value){const out=text(value).toLowerCase();if(!/^[0-9a-z]+$/.test(out))throw new Error('Invalid learner scope token');return out}
function previousOwners(scopeToken){const wanted=normalizeToken(scopeToken),r=profileRegistry();if(!r.available)return[];return r.ids.filter(id=>previousTokenFor(id)===wanted)}
function legacyOwners(scopeToken){const wanted=normalizeToken(scopeToken),r=profileRegistry();if(!r.available)return[];return r.ids.filter(id=>legacyTokenFor(id)===wanted)}
function rawStorageKey(prefix,scopeToken){const base=text(prefix);if(!base)throw new Error('Learner-scoped storage key requires a non-empty prefix');return base+normalizeToken(scopeToken)}
function quarantineKey(source,payload=''){return `${QUARANTINE_PREFIX}${previousHash128(`${source}|${payload}`).slice(0,24)}`}
function quarantineRawKey(source,reason){try{const payload=rawGet.call(localStorage,source);if(payload==null)return {status:'absent',reason};const target=quarantineKey(source,payload);if(rawGet.call(localStorage,target)==null)rawSet.call(localStorage,target,JSON.stringify({reason,source,payload}));if(rawGet.call(localStorage,target)==null)return {status:'quarantine-write-failed',reason};rawRemove.call(localStorage,source);return {status:'quarantined',reason,target}}catch(_){return {status:'quarantine-failed',reason}}}
function currentOwners(scopeToken){const wanted=normalizeToken(scopeToken),r=profileRegistry();if(!r.available)return[];return r.ids.filter(id=>tokenFor(id)===wanted)}
function candidateOwners(tokenValue){const prev=previousOwners(tokenValue),legacy=legacyOwners(tokenValue);return [...new Set([...prev,...legacy])]}
function migrateStoragePrefix(prefix,raw=activeId()){
 const id=raw?String(raw):ANONYMOUS,r=profileRegistry(),current=tokenFor(id),target=rawStorageKey(prefix,current);
 if(!r.available)return {learnerId:id,currentToken:current,status:'registry-unavailable',migrated:false};
 const candidates=[previousTokenFor(id),legacyTokenFor(id)];
 for(const oldToken of candidates){const source=rawStorageKey(prefix,oldToken),payload=rawGet.call(localStorage,source);if(payload==null)continue;const owners=candidateOwners(oldToken);if(owners.length!==1||owners[0]!==id){quarantineRawKey(source,owners.length>1?'ambiguous-known-owners':'ownership-unproven');continue}const existing=rawGet.call(localStorage,target);if(existing==null){rawSet.call(localStorage,target,payload);if(rawGet.call(localStorage,target)===payload){rawRemove.call(localStorage,source);return {learnerId:id,currentToken:current,status:'migrated',migrated:true,from:oldToken}}return {learnerId:id,currentToken:current,status:'copy-verification-failed',migrated:false}}if(existing===payload){rawRemove.call(localStorage,source);return {learnerId:id,currentToken:current,status:'duplicate-removed',migrated:false}}return {learnerId:id,currentToken:current,status:'parallel-stores',migrated:false}}
 return {learnerId:id,currentToken:current,status:'no-legacy',migrated:false}
}
function migrateRegistered(raw=activeId()){for(const prefix of registeredPrefixes)migrateStoragePrefix(prefix,raw)}
function token(raw=activeId()){const id=raw?String(raw):ANONYMOUS;if(id===activeId())migrateRegistered(id);return tokenFor(id)}
function storageKey(prefix,scopeToken=token()){return rawStorageKey(prefix,scopeToken)}
function registerStoragePrefix(prefix){const base=text(prefix);if(!base)throw new Error('Learner-scoped storage prefix must be non-empty');registeredPrefixes.add(base);migrateStoragePrefix(base,activeId());return base}
function includeStorageToken(prefix,scopeToken){const t=normalizeToken(scopeToken);if(validStrong(t))return true;const owners=candidateOwners(t);if(owners.length!==1)return false;try{if(rawGet.call(localStorage,rawStorageKey(prefix,tokenFor(owners[0])))!=null)return false}catch(_){}return true}
function snapshot(raw=activeId()){const id=raw?String(raw):ANONYMOUS;return Object.freeze({learnerId:id,learnerToken:tokenFor(id),previousLearnerToken:previousTokenFor(id),legacyLearnerToken:legacyTokenFor(id),anonymous:id===ANONYMOUS})}
function owns(record,scopeToken=token()){return Boolean(record)&&normalizeToken(record.learnerToken||record.learnerRef)===normalizeToken(scopeToken)}
function ensureProfileRefs(){try{const d=currentDb();if(!d?.users)return false;let changed=false;for(const [id,u] of Object.entries(d.users)){if(!u||typeof u!=='object')continue;const ref=tokenFor(id);if(u.learnerRef!==ref){u.learnerRef=ref;changed=true}}if(changed)persistNow();return changed}catch(_){return false}}
function migrateExactBase(base){const target=`${base}::${token()}`,raw=rawGet.call(localStorage,base);if(raw-=null)return target;const r=profileRegistry();if(!r.available||r.ids.length!==1){quarantineRawKey(base,r.available?'ambiguous-global-store':'registry-unavailable');return target}const existing=rawGet.call(localStorage,target);if(existing=null){rawSet.call(localStorage,target,raw);if(rawGet.call(localStorage,target)===raw)rawRemove.call(localStorage,base)}else if(existing===raw)rawRemove.call(localStorage,base);else quarantineRawKey(base,'scoped-conflict');return target}
function mapScopedKey(base,key){const prefix=base+'::';if(!rawStorageKey(prefix,'ignore').startsWith(prefix)&&!key.startsWith(prefix))return null;const suffix=key.slice(prefix.length),id=activeId(),strong=tokenFor(id),target=prefix+strong;if(suffix===strong)return target;const liveOwners=currentOwners(suffix);if(liveOwners.length){return liveOwners.length===1&&liveOwners[0]===id?key:target}const owners=candidateOwners(suffix);if(owners.length===1&&owners[0]!==id)return target;if(owners.length===1&&owners[0]===id){const payload=rawGet.call(localStorage,key),existing=rawGet.call(localStorage,target);if(payload!=null&&existing==null){rawSet.call(localStorage,target,payload);if(rawGet.call(localStorage,target)===payload)rawRemove.call(localStorage,key);else quarantineRawKey(key,'copy-verification-failed')}else if(payload!=null&&existing===payload)rawRemove.call(localStorage,key);else if(payload!=null&&existing!==payload)quarantineRawKey(key,'scoped-conflict');return target}if(rawGet.call(localStorage,key)!=null)quarantineRawKey(key,owners.length>1?'ambiguous-known-owners':'ownership-unproven');return target}
function mappedKey(key){const k=String(key);if(EXACT_BASES.has(k)||WEAK_BASES.includes(k))return migrateExactBase(k);for(const base of EXACT_BASES){const mapped=mapScopedKey(base,k);if(mapped)return mapped}for(const base of WEAK_BASES){const mapped=mapScopedKey(base,k);if(mapped)return mapped}return k}
if(!P.__mmLearnerBoundaryV27){Object.defineProperty(P,'getItem',{configurable:true,writable:true,value:function(key){return rawGet.call(this,this===localStorage?mappedKey(key):key)}});Object.defineProperty(P,'setItem',{configurable:true,writable:true,value:function(key,value){return rawSet.call(this,this===localStorage?mappedKey(key):key,value)}});Object.defineProperty(P,'removeItem',{configurable:true,writable:true,value:function(key){return rawRemove.call(this,this===localStorage?mappedKey(key):key)}});Object.defineProperty(P,'__mmLearnerBoundaryV27',{configurable:false,writable:false,value:true})}
window.MM_LEARNER_SCOPE=Object.freeze({version:VERSION,anonymousId:ANONYMOUS,activeId,tokenFor,previousTokenFor,legacyTokenFor,token,normalizeToken,storageKey,snapshot,owns,knownIds,currentOwners,legacyOwners,previousOwners,migrateStoragePrefix,registerStoragePrefix,includeStorageToken,ensureProfileRefs,boundary:'Learner identity uses persistent cryptographically random opaque 128-bit local references keyed by stable profile id. Display names never define identity. Previous deterministic or legacy buckets migrate only when ownership is uniquely provable; ambiguous data is quarantined instead of assigned.'});
ensureProfileRefs();window.addEventListener?.('mm:domains-ready',ensureProfileRefs,{once:true});
})();
