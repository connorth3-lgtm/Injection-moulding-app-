/* MouldMaster shared learner scope/token utility — 2026.09.04 */
(function(){
'use strict';
if(window.MM_LEARNER_SCOPE)return;
const VERSION='2026.09.04.1';
const ANONYMOUS='anonymous';
const QUARANTINE_PREFIX='mm_scope_quarantine_v1::';
const registeredPrefixes=new Set();

function text(value){return String(value??'')}
function activeId(){
  try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}
  try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}
  return ANONYMOUS;
}
function legacyTokenFor(raw=ANONYMOUS){
  const value=raw?String(raw):ANONYMOUS;
  let h=2166136261;
  for(const ch of value){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36);
}
function hash128(raw){
  const value=String(raw??'');
  let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;
  for(let i=0;i<value.length;i++){
    const k=value.charCodeAt(i);
    h1=h2^Math.imul(h1^k,597399067);
    h2=h3^Math.imul(h2^k,2869860233);
    h3=h4^Math.imul(h3^k,951274213);
    h4=h1^Math.imul(h4^k,2716044179);
  }
  h1=Math.imul(h3^(h1>>>18),597399067);
  h2=Math.imul(h4^(h2>>>22),2869860233);
  h3=Math.imul(h1^(h3>>>17),951274213);
  h4=Math.imul(h2^(h4>>>19),2716044179);
  h1=(h1^h2^h3^h4)>>>0;h2=(h2^h1)>>>0;h3=(h3^h1)>>>0;h4=(h4^h1)>>>0;
  return [h1,h2,h3,h4].map(x=>x.toString(16).padStart(8,'0')).join('');
}
function tokenFor(raw=ANONYMOUS){const value=raw?String(raw):ANONYMOUS;return hash128(`mm-learner-scope-v2|${value}`)}
function normalizeToken(value){
  const out=text(value).toLowerCase();
  if(!/^[0-9a-z]+$/.test(out))throw new Error('Invalid learner scope token');
  return out;
}
function profileRegistry(){
  try{
    if(typeof db!=='undefined'&&db?.users&&typeof db.users==='object'&&!Array.isArray(db.users)){
      const ids=Object.keys(db.users).map(String).filter(Boolean);
      return {available:true,ids:[...new Set(ids)]};
    }
  }catch(_){}
  return {available:false,ids:[]};
}
function knownIds(){return profileRegistry().ids.slice()}
function legacyOwners(scopeToken){
  const wanted=normalizeToken(scopeToken),registry=profileRegistry();
  if(!registry.available)return [];
  return registry.ids.filter(id=>legacyTokenFor(id)===wanted);
}
function isLegacyToken(value){const out=text(value).toLowerCase();return /^[0-9a-z]{1,7}$/.test(out)}
function migrationPlan(raw=activeId()){
  const learnerId=raw?String(raw):ANONYMOUS,registry=profileRegistry(),currentToken=tokenFor(learnerId),legacyToken=legacyTokenFor(learnerId),owners=registry.available?registry.ids.filter(id=>legacyTokenFor(id)===legacyToken):[];
  const uniqueOwner=registry.available&&owners.length===1&&owners[0]===learnerId;
  return Object.freeze({learnerId,currentToken,legacyToken,registryAvailable:registry.available,legacyOwners:Object.freeze(owners.slice()),uniqueOwner,ambiguous:registry.available&&owners.length>1});
}
function rawStorageKey(prefix,scopeToken){const base=text(prefix);if(!base)throw new Error('Learner-scoped storage key requires a non-empty prefix');return base+normalizeToken(scopeToken)}
function quarantineKey(prefix,legacyToken,payload=''){return `${QUARANTINE_PREFIX}${hash128(`${prefix}|${legacyToken}|${payload}`).slice(0,24)}`}
function quarantineLegacyBucket(prefix,legacyToken,reason){
  try{
    const source=rawStorageKey(prefix,legacyToken),payload=localStorage.getItem(source);if(payload==null)return {status:'absent'};
    const target=quarantineKey(prefix,legacyToken,payload);
    if(localStorage.getItem(target)==null)localStorage.setItem(target,payload);
    if(localStorage.getItem(target)!==payload)return {status:'quarantine-write-failed'};
    localStorage.removeItem(source);
    return {status:'quarantined',reason,target};
  }catch(_){return {status:'quarantine-failed',reason}}
}
function quarantineUnsafeLegacyBuckets(prefix){
  const registry=profileRegistry();if(!registry.available)return [];
  const tokens=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix)){const t=k.slice(prefix.length);if(isLegacyToken(t))tokens.push(t)}}}catch(_){}
  const out=[];
  for(const t of [...new Set(tokens)]){const owners=legacyOwners(t);if(owners.length!==1)out.push({token:t,owners:owners.length,...quarantineLegacyBucket(prefix,t,owners.length>1?'ambiguous-known-owners':'no-known-owner')})}
  return out;
}
function migrateStoragePrefix(prefix,raw=activeId()){
  const plan=migrationPlan(raw);if(!plan.registryAvailable)return {...plan,status:'registry-unavailable',migrated:false};
  if(!plan.uniqueOwner){if(plan.ambiguous)quarantineLegacyBucket(prefix,plan.legacyToken,'ambiguous-known-owners');return {...plan,status:plan.ambiguous?'ambiguous-quarantined':'ownership-unproven',migrated:false}}
  try{
    const currentKey=rawStorageKey(prefix,plan.currentToken),legacyKey=rawStorageKey(prefix,plan.legacyToken),current=localStorage.getItem(currentKey),legacy=localStorage.getItem(legacyKey);
    if(current!=null){if(legacy!=null&&legacy===current)localStorage.removeItem(legacyKey);return {...plan,status:legacy!=null&&legacy!==current?'parallel-stores':'current',migrated:false}}
    if(legacy==null)return {...plan,status:'no-legacy',migrated:false};
    localStorage.setItem(currentKey,legacy);
    if(localStorage.getItem(currentKey)!==legacy)return {...plan,status:'copy-verification-failed',migrated:false};
    localStorage.removeItem(legacyKey);
    return {...plan,status:'migrated',migrated:true};
  }catch(_){return {...plan,status:'migration-failed',migrated:false}}
}
function migrateRegistered(raw=activeId()){for(const prefix of registeredPrefixes)migrateStoragePrefix(prefix,raw)}
function token(raw=activeId()){
  const learnerId=raw?String(raw):ANONYMOUS;
  if(learnerId===activeId())migrateRegistered(learnerId);
  return tokenFor(learnerId);
}
function storageKey(prefix,scopeToken=token()){return rawStorageKey(prefix,scopeToken)}
function registerStoragePrefix(prefix){
  const base=text(prefix);if(!base)throw new Error('Learner-scoped storage prefix must be non-empty');registeredPrefixes.add(base);quarantineUnsafeLegacyBuckets(base);migrateStoragePrefix(base,activeId());return base
}
function includeStorageToken(prefix,scopeToken){
  const t=normalizeToken(scopeToken);if(!isLegacyToken(t))return true;
  const registry=profileRegistry();if(!registry.available)return false;
  const owners=legacyOwners(t);if(owners.length!==1)return false;
  try{const strong=tokenFor(owners[0]);if(localStorage.getItem(rawStorageKey(prefix,strong))!=null)return false}catch(_){}
  return true;
}
function snapshot(raw=activeId()){
  const learnerId=raw?String(raw):ANONYMOUS;
  return Object.freeze({learnerId,learnerToken:tokenFor(learnerId),legacyLearnerToken:legacyTokenFor(learnerId),anonymous:learnerId===ANONYMOUS});
}
function owns(record,scopeToken=token()){return Boolean(record)&&normalizeToken(record.learnerToken)===normalizeToken(scopeToken)}

window.MM_LEARNER_SCOPE=Object.freeze({version:VERSION,anonymousId:ANONYMOUS,activeId,tokenFor,legacyTokenFor,token,normalizeToken,storageKey,snapshot,owns,knownIds,legacyOwners,migrationPlan,migrateStoragePrefix,registerStoragePrefix,includeStorageToken,isLegacyToken,quarantineUnsafeLegacyBuckets,boundary:'Learner storage uses a 128-bit deterministic local token. Legacy 32-bit buckets migrate only when exactly one known local profile owns the old token; ambiguous or unowned legacy buckets are quarantined rather than assigned to a learner.'});
})();