/* MouldMaster shared learner scope/token utility — 2026.09.03 */
(function(){
'use strict';
if(window.MM_LEARNER_SCOPE)return;
const VERSION='2026.09.03.1';
const ANONYMOUS='anonymous';

function clean(value){return String(value??'').trim()}
function activeId(){
  try{if(typeof db!=='undefined'&&db?.activeUser)return clean(db.activeUser)||ANONYMOUS}catch(_){}
  try{if(typeof user!=='undefined'&&user?.id)return clean(user.id)||ANONYMOUS}catch(_){}
  return ANONYMOUS;
}
function tokenFor(raw=ANONYMOUS){
  const value=clean(raw)||ANONYMOUS;
  let h=2166136261;
  for(const ch of value){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36);
}
function token(raw=activeId()){return tokenFor(raw)}
function normalizeToken(value){
  const out=clean(value).toLowerCase();
  if(!/^[0-9a-z]+$/.test(out))throw new Error('Invalid learner scope token');
  return out;
}
function storageKey(prefix,scopeToken=token()){
  const base=clean(prefix);
  if(!base)throw new Error('Learner-scoped storage key requires a non-empty prefix');
  return base+normalizeToken(scopeToken);
}
function snapshot(raw=activeId()){
  const learnerId=clean(raw)||ANONYMOUS;
  return Object.freeze({learnerId,learnerToken:tokenFor(learnerId),anonymous:learnerId===ANONYMOUS});
}
function owns(record,scopeToken=token()){
  return Boolean(record)&&normalizeToken(record.learnerToken)===normalizeToken(scopeToken);
}

window.MM_LEARNER_SCOPE=Object.freeze({version:VERSION,anonymousId:ANONYMOUS,activeId,tokenFor,token,normalizeToken,storageKey,snapshot,owns});
})();
