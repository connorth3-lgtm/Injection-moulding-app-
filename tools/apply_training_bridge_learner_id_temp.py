#!/usr/bin/env python3
"""Temporary deterministic helper to align the hosted import bridge with the canonical learner-ID contract."""
from pathlib import Path


def once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


once(
    "training-qa-fix.js",
    "const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), clamp=(n,a,b,d=0)=>Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d;\n",
    "const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), clamp=(n,a,b,d=0)=>Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d;\n"
    "function requireCoreLearnerId(v){const fn=window.pvRequireLearnerId;if(typeof fn!=='function')throw new Error('Core learner-ID validator unavailable');return fn(v)}\n"
    "function hasOwnCoreLearner(users,id){const fn=window.pvHasOwnLearner;if(typeof fn!=='function')throw new Error('Core learner-ID membership validator unavailable');return fn(users,id)}\n",
    "bridge canonical learner-ID adapters",
)

old_import = """   if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string'||!x.users[x.activeUser])throw new Error('Invalid backup structure');
   if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');
   const users={};
   for(const [id,u] of Object.entries(x.users).slice(0,500)){
    const sid=String(id).slice(0,160),clean=normaliseImportedUser(u,id);
    if(!sid||users[sid])throw new Error('Invalid or duplicate learner identifier');
    clean.id=sid;
    clean.certificates=[];clean.certificateMeta={};clean.examPassStatus={};
    users[sid]=clean;
   }
   const active=String(x.activeUser).slice(0,160);
   if(!users[active])throw new Error('Missing active learner');
"""
new_import = """   if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string')throw new Error('Invalid backup structure');
   if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');
   const users={};
   for(const [id,u] of Object.entries(x.users).slice(0,500)){
    const sid=requireCoreLearnerId(id);
    if(hasOwnCoreLearner(users,sid))throw new Error('Invalid or duplicate learner identifier');
    const clean=normaliseImportedUser(u,sid);
    if(!clean||clean.id!==sid)throw new Error('Learner identifier mismatch');
    clean.certificates=[];clean.certificateMeta={};clean.examPassStatus={};
    users[sid]=clean;
   }
   const active=requireCoreLearnerId(x.activeUser);
   if(!hasOwnCoreLearner(users,active))throw new Error('Missing active learner');
"""
once("training-qa-fix.js", old_import, new_import, "bridge import identity contract")

qa_path = Path("qa_standalone_learner_ids.cjs")
qa = qa_path.read_text(encoding="utf-8")
needle = "console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching resolves inert index tokens without learner-ID inline-code sinks.');\n"
if qa.count(needle) != 1:
    raise SystemExit(f"learner-ID QA completion marker: expected one match, found {qa.count(needle)}")
bridge_qa = r'''const vm=require('node:vm');
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

'''
qa_path.write_text(qa.replace(needle, bridge_qa + needle, 1), encoding="utf-8")
print("Applied canonical learner-ID contract to hosted import bridge and extended behavioral regression.")
