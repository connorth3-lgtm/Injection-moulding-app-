/* MouldMaster shared learner scope/token utility — 2026.09.03 */
(function(){
'use strict';
if(window.MM_LEARNER_SCOPE)return;
const VERSION='2026.09.03.2';
const ANONYMOUS='anonymous';

function text(value){return String(value??'')}
function activeId(){
  try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}
  try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}
  return ANONYMOUS;
}
function tokenFor(raw=ANONYMOUS){
  const value=raw?String(raw):ANONYMOUS;
  let h=2166136261;
  for(const ch of value){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36);
}
function token(raw=activeId()){return tokenFor(raw)}
function normalizeToken(value){
  const out=text(value).toLowerCase();
  if(!/^[0-9a-z]+$/.test(out))throw new Error('Invalid learner scope token');
  return out;
}
function storageKey(prefix,scopeToken=token()){
  const base=text(prefix);
  if(!base)throw new Error('Learner-scoped storage key requires a non-empty prefix');
  return base+normalizeToken(scopeToken);
}
function snapshot(raw=activeId()){
  const learnerId=raw?String(raw):ANONYMOUS;
  return Object.freeze({learnerId,learnerToken:tokenFor(learnerId),anonymous:learnerId===ANONYMOUS});
}
function owns(record,scopeToken=token()){
  return Boolean(record)&&normalizeToken(record.learnerToken)===normalizeToken(scopeToken);
}

window.MM_LEARNER_SCOPE=Object.freeze({version:VERSION,anonymousId:ANONYMOUS,activeId,tokenFor,token,normalizeToken,storageKey,snapshot,owns});
})();
