#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OLD_RELEASE='2026.09.12.6'
NEW_RELEASE='2026.09.12.7'

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,content): (ROOT/path).write_text(content,encoding='utf-8')
def replace_once(path,old,new):
    text=read(path); count=text.count(old)
    if count!=1: raise SystemExit(f'{path}: expected one replacement target, found {count}')
    write(path,text.replace(old,new,1))

old='''/* Also prevent arbitrary top-level properties from imported backup files. */
importData=function(file){
  if(!file)return; const r=new FileReader();
  r.onload=()=>{try{
    const x=JSON.parse(r.result);
    if(!x||typeof x!=="object"||Array.isArray(x)||!x.users||typeof x.users!=="object"||Array.isArray(x.users)||!x.activeUser)throw new Error("Invalid backup structure");
    const proposed=pvBuildImportedUsers(x);
    const users=proposed.users,active=proposed.activeUser;
    db=proposed;user=db.users[db.activeUser];
    persist();updateGlobalProgress();switchView("profile");toast("Backup imported and strictly validated");
  }catch(e){alert("That file is not a valid MouldMaster backup. No existing data was changed.")}};
  r.readAsText(file);
};'''
new='''function pvCommitImportedUsers(proposed){
  const active=proposed&&proposed.activeUser;
  if(!pvHasOwnLearner(proposed&&proposed.users,active))throw new Error("Missing active learner");
  const nextUser=proposed.users[active];
  nextUser.lastSeen=new Date().toISOString();
  const serialized=JSON.stringify(proposed);
  localStorage.setItem("mouldmasterProDB",serialized);
  db=proposed;user=nextUser;
}

/* Also prevent arbitrary top-level properties from imported backup files. */
importData=function(file){
  if(!file)return;
  if(file.size>10*1024*1024){alert("That backup is too large to import safely (10 MiB maximum). No existing data was changed.");return}
  const r=new FileReader();
  r.onload=()=>{
    try{
      const x=JSON.parse(r.result);
      if(!x||typeof x!=="object"||Array.isArray(x)||!x.users||typeof x.users!=="object"||Array.isArray(x.users)||!x.activeUser)throw new Error("Invalid backup structure");
      const proposed=pvBuildImportedUsers(x);
      pvCommitImportedUsers(proposed);
    }catch(e){alert("That file is not a valid MouldMaster backup or could not be stored safely. No existing data was changed.");return}
    updateGlobalProgress();switchView("profile");toast("Backup imported and strictly validated");
  };
  r.onerror=()=>alert("That backup could not be read. No existing data was changed.");
  r.readAsText(file);
};'''
replace_once('MouldMaster_Core_App.html',old,new)

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load deterministic core-runtime generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

# Extend executable regression with failure/success transaction behavior.
replace_once(
 'qa_standalone_learner_ids.cjs',
 "const buildSource=extractFunction('pvBuildImportedUsers');",
 "const buildSource=extractFunction('pvBuildImportedUsers');\nconst commitSource=extractFunction('pvCommitImportedUsers');"
)
insert='''
function makeStandaloneCommitHarness(storage){
  const existingDb={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}};
  const existingUser=existingDb.users['learner-1'];
  const harness=new Function('state','localStorage',`${hasOwnSource}\\nlet db=state.db,user=state.user;\\n${commitSource}\\nreturn {commit:pvCommitImportedUsers,snapshot:()=>({db,user})};`)({db:existingDb,user:existingUser},storage);
  return {existingDb,existingUser,harness};
}
{
  const storage={setItem(){throw new Error('quota exceeded')}};
  const {existingDb,existingUser,harness}=makeStandaloneCommitHarness(storage);
  const proposed={activeUser:'learner-2',users:{'learner-2':{id:'learner-2',name:'Imported'}}};
  assert.throws(()=>harness.commit(proposed),/quota exceeded/,'storage failure must surface to the import boundary');
  const state=harness.snapshot();
  assert.equal(state.db,existingDb,'storage failure must leave the live learner registry unchanged');
  assert.equal(state.user,existingUser,'storage failure must leave the live learner unchanged');
}
{
  let savedKey='',savedValue='';
  const storage={setItem(k,v){savedKey=String(k);savedValue=String(v)}};
  const {harness}=makeStandaloneCommitHarness(storage);
  const proposed={activeUser:'learner-2',users:{'learner-2':{id:'learner-2',name:'Imported'}}};
  harness.commit(proposed);
  const state=harness.snapshot();
  assert.equal(savedKey,'mouldmasterProDB');
  assert.equal(JSON.parse(savedValue).activeUser,'learner-2','successful import must persist the proposed registry');
  assert.equal(state.db,proposed,'live registry must activate only after storage succeeds');
  assert.equal(state.user,proposed.users['learner-2'],'live learner must match the persisted active learner');
}
'''
needle="assert.deepEqual(registry.users['learner-1'].examPassStatus,{},'standalone import must strip imported pass assertions');\n"
replace_once('qa_standalone_learner_ids.cjs',needle,needle+insert)
needle2="assert(strict.includes('clean.examPassStatus={};'),'standalone import must strip pass-status assertions');\n"
replace_once('qa_standalone_learner_ids.cjs',needle2,needle2+"assert(strict.includes('if(file.size>10*1024*1024)'),'standalone import must reject oversized backups before FileReader allocation');\nassert(strict.includes('pvCommitImportedUsers(proposed);'),'standalone import must use storage-first commit helper');\nassert(strict.indexOf('localStorage.setItem(\"mouldmasterProDB\",serialized)')<strict.indexOf('db=proposed;user=nextUser;'),'standalone import commit must persist before live-memory activation');\n")

version=json.loads(read('version.json'))
if version.get('web_release')!=OLD_RELEASE: raise SystemExit(f"Unexpected web release {version.get('web_release')!r}")
version['web_release']=NEW_RELEASE; write('version.json',json.dumps(version,indent=2)+'\n')
for path in ['README.md','support.html']:
    text=read(path)
    if OLD_RELEASE not in text: raise SystemExit(f'{path}: old release marker missing')
    write(path,text.replace(OLD_RELEASE,NEW_RELEASE))
external=json.loads(read('data/release-external-validation-v1.json'))
if external.get('release')!=OLD_RELEASE: raise SystemExit('External validation release mismatch')
external['release']=NEW_RELEASE;write('data/release-external-validation-v1.json',json.dumps(external,indent=2)+'\n')
replace_once('qa_release.py',f'WEB_RELEASE = "{OLD_RELEASE}"',f'WEB_RELEASE = "{NEW_RELEASE}"')
replace_once('qa_release_docs.py',f" 'web_release':'{OLD_RELEASE}',",f" 'web_release':'{NEW_RELEASE}',")

new_sha=hashlib.sha256((ROOT/'MouldMaster_Core_App.html').read_bytes()).hexdigest()
qa=read('qa_release.py')
prefix='CURRENT_CORE_SHA256 = "'; start=qa.find(prefix)
if start<0: raise SystemExit('Current core hash lock missing')
end=qa.find('"',start+len(prefix))
qa=qa[:start+len(prefix)]+new_sha+qa[end:]
marker='assert "clean.certificates=[];" in core and "clean.certificateMeta={};" in core and "clean.examPassStatus={};" in core, "standalone backup import must strip credential evidence"\n'
extra='assert "function pvCommitImportedUsers(proposed)" in core and "if(file.size>10*1024*1024)" in core, "standalone backup import must be storage-first and size-bounded"\n'
if extra not in qa:
    if marker not in qa: raise SystemExit('Standalone import release assertion insertion point missing')
    qa=qa.replace(marker,marker+extra,1)
write('qa_release.py',qa)
print(f'Prepared storage-first standalone import for {NEW_RELEASE}; core sha256={new_sha}')
