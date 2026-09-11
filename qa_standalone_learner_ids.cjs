
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
const vm=require('node:vm');
const bridgeSource=fs.readFileSync('training-qa-fix.js','utf8');
assert(bridgeSource.includes("const sid=requireCoreLearnerId(id);"),'hosted import bridge must use the canonical core learner-ID validator');
assert(bridgeSource.includes("if(hasOwnCoreLearner(users,sid))"),'hosted import bridge must use own-property duplicate membership');
assert(bridgeSource.includes("if(!hasOwnCoreLearner(users,active))"),'hosted import bridge must use own-property active membership');
assert(!bridgeSource.includes("String(id).slice(0,160)"),'hosted import bridge must not truncate learner IDs');
assert(!bridgeSource.includes("!x.users[x.activeUser]"),'hosted import bridge must not trust inherited active-user lookup');
assert(!bridgeSource.includes("clean.id=sid"),'hosted import bridge must not rewrite an inconsistent embedded learner ID');

function runBridgeImport(payload){
  const storageMap=new Map([['mouldmasterProDB',JSON.stringify({activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}})]]);
  const writes=[];
  const alerts=[];
  const toasts=[];
  const storage={
    get length(){return storageMap.size},
    key(i){return [...storageMap.keys()][i]??null},
    getItem(k){return storageMap.has(k)?storageMap.get(k):null},
    setItem(k,v){writes.push([String(k),String(v)]);storageMap.set(String(k),String(v))},
    removeItem(k){storageMap.delete(String(k))}
  };
  class FakeFileReader{
    readAsText(file){this.result=file.contents;this.onload()}
  }
  const sandbox={
    console,
    localStorage:storage,
    FileReader:FakeFileReader,
    alert:m=>alerts.push(String(m)),
    confirm:()=>true,
    setTimeout,
    clearTimeout,
    db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}},
    user:{id:'learner-1',name:'Existing'},
    updateGlobalProgress:()=>{},
    switchView:()=>{},
    normaliseImportedUser:(u,id)=>{
      const embedded=u&&u.id!=null&&String(u.id)!==''?api.pvRequireLearnerId(u.id):id;
      if(embedded!==id)throw new Error('Learner identifier mismatch');
      return {id,name:String(u?.name||'Learner'),certificates:['old'],certificateMeta:{old:true},examPassStatus:{Advanced:true}};
    }
  };
  sandbox.window=sandbox;
  sandbox.window.pvRequireLearnerId=api.pvRequireLearnerId;
  sandbox.window.pvHasOwnLearner=api.pvHasOwnLearner;
  sandbox.window.toast=m=>toasts.push(String(m));
  vm.createContext(sandbox);
  vm.runInContext(bridgeSource,sandbox,{filename:'training-qa-fix.js'});
  const beforeWrites=writes.length;
  sandbox.window.importData({size:JSON.stringify(payload).length,contents:JSON.stringify(payload)});
  return {sandbox,writes:writes.slice(beforeWrites),alerts,toasts,storageMap};
}

for(const badId of ["bad'id",'<tag>','bad\\id','bad\nid','bad id']){
  const result=runBridgeImport({activeUser:badId,users:{[badId]:{id:badId,name:'Bad'}}});
  assert.equal(result.writes.length,0,`unsafe hosted-bridge learner ID must be rejected before staged storage writes: ${JSON.stringify(badId)}`);
  assert.equal(result.sandbox.db.activeUser,'learner-1');
  assert.match(result.alerts.at(-1)||'',/not a valid MouldMaster backup/);
}
{
  const result=runBridgeImport({activeUser:'constructor',users:{'learner-1':{id:'learner-1',name:'Existing'}}});
  assert.equal(result.writes.length,0,'prototype property name must not satisfy hosted-bridge active learner membership');
  assert.equal(result.sandbox.db.activeUser,'learner-1');
}
{
  const result=runBridgeImport({activeUser:'legacy.ID-3',users:{'legacy.ID-3':{id:'learner-1',name:'Mismatch'}}});
  assert.equal(result.writes.length,0,'embedded/key learner-ID mismatch must be rejected before hosted-bridge storage writes');
  assert.equal(result.sandbox.db.activeUser,'learner-1');
}
{
  const result=runBridgeImport({activeUser:'constructor',users:{constructor:{id:'constructor',name:'Owned legacy'}}});
  assert.equal(result.alerts.length,0,'explicitly owned safe legacy prototype-name ID should remain importable');
  assert.equal(result.sandbox.db.activeUser,'constructor');
  assert(result.writes.some(([key])=>key==='mouldmasterProDB'),'valid hosted-bridge import must stage learner progress');
  const saved=JSON.parse(result.storageMap.get('mouldmasterProDB'));
  assert.equal(saved.activeUser,'constructor');
  assert.equal(Object.prototype.hasOwnProperty.call(saved.users,'constructor'),true);
  assert.deepEqual(saved.users.constructor.certificates,[],'imported certificates must still be stripped');
}

console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching resolves inert index tokens without learner-ID inline-code sinks.');
