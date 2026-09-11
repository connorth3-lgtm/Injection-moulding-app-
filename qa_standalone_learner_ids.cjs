
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('MouldMaster_Core_App.html','utf8');
function extractFunction(name){
  const start=source.indexOf(`function ${name}(`);assert(start>=0,`missing ${name}`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape){escape=false;continue}if(ch==='\\'){escape=true;continue}if(ch===quote)quote=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated ${name}`);
}
const canonicalSource=extractFunction('pvCanonicalLearnerId');
const requireSource=extractFunction('pvRequireLearnerId');
const buildSource=extractFunction('pvBuildImportedUsers');
const api=new Function('normaliseImportedUser',`${canonicalSource}\n${requireSource}\n${buildSource}\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));

for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example'])assert.equal(api.pvCanonicalLearnerId(id),id,`benign legacy ID should survive unchanged: ${id}`);
for(const id of ['',"bad'id",'bad"id','<tag>','bad\\id','bad/id','bad\nid','bad\rid','bad id','bad;id','bad(id)','-leading'])assert.equal(api.pvCanonicalLearnerId(id),'',`unsafe learner ID must be rejected: ${JSON.stringify(id)}`);
assert.equal(api.pvCanonicalLearnerId('a'.repeat(160)),'a'.repeat(160));
assert.equal(api.pvCanonicalLearnerId('a'.repeat(161)),'');

let registry=api.pvBuildImportedUsers({activeUser:'learner-1',users:{'learner-1':{name:'A'},'legacy.ID-3':{name:'B'}}});
assert.equal(registry.activeUser,'learner-1');assert.deepEqual(Object.keys(registry.users),['learner-1','legacy.ID-3']);
for(const bad of ["bad'id",'<tag>','bad\\id','bad\nid','bad id']){
  assert.throws(()=>api.pvBuildImportedUsers({activeUser:bad,users:{[bad]:{}}}),/Invalid learner identifier/);
}
assert.throws(()=>api.pvBuildImportedUsers({activeUser:'missing',users:{'learner-1':{}}}),/Missing active learner/);

assert(!source.includes(`onclick="switchUser('${'${u.id}'})"`),'learner IDs must never be interpolated into inline JavaScript handlers');
assert.equal((source.match(/data-mm-switch-user="\$\{userIndex\}"/g)||[]).length,2,'both instructor renderers must use inert index tokens');
assert.equal((source.match(/pvWireInstructorSwitches\(users\);/g)||[]).length,2,'both instructor renderers must wire DOM events after rendering');
const strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);
const strict=source.slice(strictStart);
assert(strict.includes('const keyId=pvRequireLearnerId(id);'),'strict normaliser must validate the registry key');
assert(strict.includes('if(embeddedId!==keyId)throw new Error("Learner identifier mismatch");'),'strict normaliser must reject embedded/key identity mismatch');
assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');
assert(!strict.includes('users[pvCleanString(id,160)]=normaliseImportedUser(u,id)'),'strict import must not truncate unsafe learner IDs into registry keys');
console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching contains no learner-ID inline-code sink.');
