#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.7'; NEW='2026.09.12.8'
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(p,a,b):
    s=read(p); n=s.count(a)
    if n!=1: raise SystemExit(f'{p}: expected one target, found {n}')
    write(p,s.replace(a,b,1))

old='''let db;
try{ db = JSON.parse(localStorage.getItem("mouldmasterProDB")) || JSON.parse(JSON.stringify(PRISTINE_DB)) }catch(e){ db=JSON.parse(JSON.stringify(PRISTINE_DB)) }
if(!db.users || !db.activeUser){db=defaultDB}
let user = db.users[db.activeUser];'''
new='''function mmCanonicalStartupLearnerId(v){
  const raw=String(v==null?"":v);
  return raw.length>=1&&raw.length<=160&&/^[A-Za-z0-9][A-Za-z0-9._:@+-]*$/.test(raw)?raw:"";
}
function mmSelectStartupDb(candidate,pristine){
  const fallback=()=>({db:JSON.parse(JSON.stringify(pristine)),rejected:true});
  if(!candidate||typeof candidate!=="object"||Array.isArray(candidate)||!candidate.users||typeof candidate.users!=="object"||Array.isArray(candidate.users))return fallback();
  const entries=Object.entries(candidate.users);
  if(!entries.length)return fallback();
  for(const [id,record] of entries){
    if(mmCanonicalStartupLearnerId(id)!==id||!record||typeof record!=="object"||Array.isArray(record))return fallback();
  }
  if(typeof candidate.activeUser!=="string")return fallback();
  const active=mmCanonicalStartupLearnerId(candidate.activeUser);
  if(!active||active!==candidate.activeUser||!Object.prototype.hasOwnProperty.call(candidate.users,active))return fallback();
  return {db:candidate,rejected:false};
}
let db,mmStartupLearnerDataRejected=false;
try{
  const raw=localStorage.getItem("mouldmasterProDB");
  const parsed=raw===null?JSON.parse(JSON.stringify(PRISTINE_DB)):JSON.parse(raw);
  const selected=mmSelectStartupDb(parsed,PRISTINE_DB);
  db=selected.db;mmStartupLearnerDataRejected=selected.rejected;
}catch(e){db=JSON.parse(JSON.stringify(PRISTINE_DB));mmStartupLearnerDataRejected=true}
let user = db.users[db.activeUser];'''
rep('MouldMaster_Core_App.html',old,new)
rep('MouldMaster_Core_App.html','''updateGlobalProgress();
renderDashboard();


/* ---------- Friendly Edition behaviour ---------- */''','''updateGlobalProgress();
renderDashboard();
if(mmStartupLearnerDataRejected)toast("Saved learner data failed safety checks, so a clean local profile was opened. Existing stored bytes were not trusted.");


/* ---------- Friendly Edition behaviour ---------- */''')

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

# Regression for persisted legacy prototype-chain registries.
rep('qa_standalone_learner_ids.cjs',"const canonicalSource=extractFunction('pvCanonicalLearnerId');","const startupCanonicalSource=extractFunction('mmCanonicalStartupLearnerId');\nconst startupSelectSource=extractFunction('mmSelectStartupDb');\nconst canonicalSource=extractFunction('pvCanonicalLearnerId');")
needle="for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example'])assert.equal(api.pvCanonicalLearnerId(id),id,`benign legacy ID should survive unchanged: ${id}`);\n"
insert='''const startupApi=new Function(`${startupCanonicalSource}\\n${startupSelectSource}\\nreturn {mmCanonicalStartupLearnerId,mmSelectStartupDb};`)();
for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example',"bad'id",'<tag>','bad\\\\id','bad/id','bad id','__proto__','constructor'])assert.equal(startupApi.mmCanonicalStartupLearnerId(id),api.pvCanonicalLearnerId(id),`startup/current learner-ID contracts must agree: ${JSON.stringify(id)}`);
const pristine={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Pristine'}}};
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'__proto__',users:{}},pristine);
  assert.equal(selected.rejected,true,'legacy __proto__ active learner must fail closed');
  assert.equal(selected.db.activeUser,'learner-1');
  assert.equal(Object.prototype.hasOwnProperty.call(selected.db.users,'learner-1'),true);
}
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'constructor',users:{'learner-1':{id:'learner-1'}}},pristine);
  assert.equal(selected.rejected,true,'inherited constructor lookup must not satisfy startup active membership');
}
{
  const candidate={activeUser:'constructor',users:{constructor:{id:'constructor',name:'Owned legacy'}}};
  const selected=startupApi.mmSelectStartupDb(candidate,pristine);
  assert.equal(selected.rejected,false,'explicitly owned canonical legacy ID remains valid at startup');
  assert.equal(selected.db,candidate);
}
{
  const selected=startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':{id:'learner-1'},"bad'id":{id:"bad'id"}}},pristine);
  assert.equal(selected.rejected,true,'unsafe inactive persisted learner IDs must also fail the startup registry boundary');
}
'''
rep('qa_standalone_learner_ids.cjs',needle,needle+insert)
needle2="assert(strict.includes('pvCommitImportedUsers(proposed);'),'standalone import must use storage-first commit helper');\n"
rep('qa_standalone_learner_ids.cjs',needle2,needle2+"assert(source.includes('Object.prototype.hasOwnProperty.call(candidate.users,active)'),'startup registry must require own active learner membership');\nassert(source.includes('mmStartupLearnerDataRejected=true'),'unsafe persisted registries must fail closed before user activation');\n")

v=json.loads(read('version.json'))
if v.get('web_release')!=OLD: raise SystemExit('Unexpected web release')
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
marker='assert "function pvCommitImportedUsers(proposed)" in core and "if(file.size>10*1024*1024)" in core, "standalone backup import must be storage-first and size-bounded"\n'
extra='assert "function mmSelectStartupDb(candidate,pristine)" in core and "Object.prototype.hasOwnProperty.call(candidate.users,active)" in core, "persisted learner registry must fail closed on inherited/unsafe startup identities"\n'
if extra not in qa:
    if marker not in qa: raise SystemExit('Startup QA insertion marker missing')
    qa=qa.replace(marker,marker+extra,1)
write('qa_release.py',qa)
print(f'Prepared persisted-registry startup hardening for {NEW}; core sha256={sha}')
