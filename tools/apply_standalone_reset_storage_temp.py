#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.9'; NEW='2026.09.12.10'
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(p,a,b):
    s=read(p); n=s.count(a)
    if n!=1: raise SystemExit(f'{p}: expected one target, found {n}')
    write(p,s.replace(a,b,1))

old_reset='''resetData=function(){
  if(confirm("Reset all local MouldMaster users and progress on this device? This cannot be undone unless you exported a backup.")){
    db=JSON.parse(JSON.stringify(PRISTINE_DB)); user=db.users[db.activeUser];
    if(user.onboardingDone===undefined)user.onboardingDone=false;
    if(!user.experience)user.experience="Beginner"; if(!user.goal)user.goal="Learn the full process"; if(!user.dailyMinutes)user.dailyMinutes=15; if(!user.region)user.region="ALL";
    persist();updateGlobalProgress();switchView("dashboard");toast("Local data reset");
  }
};'''
new_reset='''function pvCommitPristineReset(){
  const proposed=JSON.parse(JSON.stringify(PRISTINE_DB)),nextUser=proposed.users[proposed.activeUser];
  if(nextUser.onboardingDone===undefined)nextUser.onboardingDone=false;
  if(!nextUser.experience)nextUser.experience="Beginner";
  if(!nextUser.goal)nextUser.goal="Learn the full process";
  if(!nextUser.dailyMinutes)nextUser.dailyMinutes=15;
  if(!nextUser.region)nextUser.region="ALL";
  nextUser.lastSeen=new Date().toISOString();
  proposed.users[proposed.activeUser]=nextUser;
  const serialized=JSON.stringify(proposed);
  localStorage.setItem("mouldmasterProDB",serialized);
  db=proposed;user=nextUser;
  return proposed;
}
resetData=function(){
  if(confirm("Reset all local MouldMaster users and progress on this device? This cannot be undone unless you exported a backup.")){
    try{pvCommitPristineReset()}catch(e){alert("MouldMaster could not reset local data because browser storage is unavailable. Existing learner data was left unchanged.");return}
    updateGlobalProgress();switchView("dashboard");toast("Local data reset");
  }
};'''
rep('MouldMaster_Core_App.html',old_reset,new_reset)

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

rep('qa_standalone_learner_ids.cjs',
"const commitSource=extractFunction('pvCommitImportedUsers');",
"const commitSource=extractFunction('pvCommitImportedUsers');\nconst resetCommitSource=extractFunction('pvCommitPristineReset');")
marker="for(const bad of [\"bad'id\",'<tag>','bad\\\\id','bad\\nid','bad id']){\n"
insert=r'''function makeStandaloneResetHarness(storage){
  const existingDb={activeUser:'learner-9',users:{'learner-9':{id:'learner-9',name:'Existing'}}};
  const existingUser=existingDb.users['learner-9'];
  const resetPristine={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:'old'}}};
  const harness=new Function('state','localStorage','PRISTINE_DB',`let db=state.db,user=state.user;\n${resetCommitSource}\nreturn {commit:pvCommitPristineReset,snapshot:()=>({db,user})};`)({db:existingDb,user:existingUser},storage,resetPristine);
  return {existingDb,existingUser,resetPristine,harness};
}
{
  const storage={setItem(){throw new Error('storage denied')}};
  const {existingDb,existingUser,harness}=makeStandaloneResetHarness(storage);
  assert.throws(()=>harness.commit(),/storage denied/,'reset storage failure must surface to resetData');
  const state=harness.snapshot();
  assert.equal(state.db,existingDb,'failed reset must leave the live registry unchanged');
  assert.equal(state.user,existingUser,'failed reset must leave the live learner unchanged');
}
{
  let saved='';
  const storage={setItem(k,v){assert.equal(k,'mouldmasterProDB');saved=String(v)}};
  const {harness}=makeStandaloneResetHarness(storage);
  const proposed=harness.commit();
  const state=harness.snapshot();
  const persisted=JSON.parse(saved);
  assert.equal(persisted.activeUser,'learner-1','successful reset must persist the pristine active learner');
  assert.equal(persisted.users['learner-1'].onboardingDone,false,'successful reset must persist initialized learner defaults');
  assert.equal(state.db,proposed,'live reset registry must activate only after storage succeeds');
  assert.equal(state.user,proposed.users['learner-1'],'live reset learner must match persisted pristine learner');
}
assert(source.includes('try{pvCommitPristineReset()}catch(e){alert("MouldMaster could not reset local data because browser storage is unavailable. Existing learner data was left unchanged.");return}'),'standalone reset must fail closed with an explicit storage warning');
assert(source.indexOf('localStorage.setItem("mouldmasterProDB",serialized);',source.indexOf('function pvCommitPristineReset'))<source.indexOf('db=proposed;user=nextUser;',source.indexOf('function pvCommitPristineReset')),'standalone reset must persist before live-memory activation');

'''
s=read('qa_standalone_learner_ids.cjs')
if marker not in s: raise SystemExit('QA reset insertion marker missing')
write('qa_standalone_learner_ids.cjs',s.replace(marker,insert+marker,1))

v=json.loads(read('version.json'))
if v.get('web_release')!=OLD: raise SystemExit(f"Unexpected web release {v.get('web_release')!r}")
v['web_release']=NEW;write('version.json',json.dumps(v,indent=2)+'\n')
for p in ['README.md','support.html']:
    s=read(p)
    if OLD not in s: raise SystemExit(f'{p}: old release missing')
    write(p,s.replace(OLD,NEW))
e=json.loads(read('data/release-external-validation-v1.json'))
if e.get('release')!=OLD: raise SystemExit('External validation release mismatch')
e['release']=NEW;write('data/release-external-validation-v1.json',json.dumps(e,indent=2)+'\n')
rep('qa_release.py',f'WEB_RELEASE = "{OLD}"',f'WEB_RELEASE = "{NEW}"')
rep('qa_release_docs.py',f" 'web_release':'{OLD}',",f" 'web_release':'{NEW}',")
sha=hashlib.sha256((ROOT/'MouldMaster_Core_App.html').read_bytes()).hexdigest()
qa=read('qa_release.py');prefix='CURRENT_CORE_SHA256 = "';a=qa.find(prefix);b=qa.find('"',a+len(prefix))
if a<0 or b<0: raise SystemExit('Core hash lock missing')
qa=qa[:a+len(prefix)]+sha+qa[b:]
marker2='assert "function pvCommitImportedUsers(proposed)" in core and "if(file.size>10*1024*1024)" in core, "standalone backup import must be storage-first and size-bounded"\n'
extra='assert "function pvCommitPristineReset()" in core and "Existing learner data was left unchanged" in core, "standalone destructive reset must fail closed when browser storage cannot persist the reset"\n'
if extra not in qa:
    if marker2 not in qa: raise SystemExit('Reset release-QA insertion marker missing')
    qa=qa.replace(marker2,marker2+extra,1)
write('qa_release.py',qa)
print(f'Prepared storage-first standalone reset for {NEW}; core sha256={sha}')
