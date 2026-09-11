
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
const hasOwnSource=extractFunction('pvHasOwnLearner');
const buildSource=extractFunction('pvBuildImportedUsers');
const api=new Function('normaliseImportedUser',`${canonicalSource}\n${requireSource}\n${hasOwnSource}\n${buildSource}\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvHasOwnLearner,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));

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
assert.throws(()=>api.pvBuildImportedUsers({activeUser:'constructor',users:{'learner-1':{}}}),/Missing active learner/,'prototype property names must not satisfy learner membership');
const prototypeNamed=api.pvBuildImportedUsers({activeUser:'constructor',users:{constructor:{name:'Legacy'}}});
assert.equal(prototypeNamed.activeUser,'constructor','an explicitly owned safe legacy prototype-name ID remains supported');
assert.equal(Object.prototype.hasOwnProperty.call(prototypeNamed.users,'constructor'),true);

assert(!source.includes(`onclick="switchUser('${'${u.id}'})"`),'learner IDs must never be interpolated into inline JavaScript handlers');
assert.equal((source.match(/data-mm-switch-user="\$\{userIndex\}"/g)||[]).length,2,'both instructor renderers must use inert index tokens');
assert.equal((source.match(/pvWireInstructorSwitches\(users\);/g)||[]).length,2,'both instructor renderers must wire DOM events after rendering');

const wireSource=extractFunction('pvWireInstructorSwitches');
let switchedTo='';
const clickHandlers=[];
const buttons=[
  {dataset:{mmSwitchUser:'1'},addEventListener:(type,handler)=>{assert.equal(type,'click');clickHandlers.push(handler)}},
  {dataset:{mmSwitchUser:'99'},addEventListener:(type,handler)=>{assert.equal(type,'click');clickHandlers.push(handler)}}
];
const host={querySelectorAll(selector){assert.equal(selector,'[data-mm-switch-user]');return buttons}};
const wire=new Function('$','switchUser',`${wireSource}\nreturn pvWireInstructorSwitches;`)(selector=>selector==='#instructor'?host:null,id=>{switchedTo=id});
wire([{id:'learner-1'},{id:'legacy.ID-3'}]);
assert.equal(clickHandlers.length,2,'both rendered switch controls must receive click handlers');
clickHandlers[0]();
assert.equal(switchedTo,'legacy.ID-3','inert index token must resolve to the intended learner ID at click time');
switchedTo='';clickHandlers[1]();
assert.equal(switchedTo,'','out-of-range inert index must not switch a learner');

const switchSource=extractFunction('switchUser');
let switchState={db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1'}}},persistCalls:0,toasts:[]};
const guardedSwitch=new Function(`${canonicalSource}\n${hasOwnSource}\nlet db=arguments[0].db,user=db.users[db.activeUser];const persist=()=>arguments[0].persistCalls++;const updateGlobalProgress=()=>{};const renderInstructor=()=>{};const toast=m=>arguments[0].toasts.push(m);${switchSource}\nreturn switchUser;`)(switchState);
guardedSwitch('constructor');
assert.equal(switchState.db.activeUser,'learner-1','prototype property names must not switch without an owned learner record');
assert.equal(switchState.persistCalls,0,'rejected prototype-name switch must not persist');
assert.equal(switchState.toasts.at(-1),'Learner profile unavailable');

const strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);
const strict=source.slice(strictStart);
assert(strict.includes('const keyId=pvRequireLearnerId(id);'),'strict normaliser must validate the registry key');
assert(strict.includes('if(embeddedId!==keyId)throw new Error("Learner identifier mismatch");'),'strict normaliser must reject embedded/key identity mismatch');
assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');
assert(strict.includes('pvHasOwnLearner(users,active)'),'strict import must require own learner membership for the active ID');
assert(!strict.includes('!x.users[x.activeUser]'),'strict structural gate must not use inherited learner lookup');
assert(!strict.includes('users[pvCleanString(id,160)]=normaliseImportedUser(u,id)'),'strict import must not truncate unsafe learner IDs into registry keys');
console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching resolves inert index tokens without learner-ID inline-code sinks.');
