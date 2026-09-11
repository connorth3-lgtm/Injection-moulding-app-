#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.8'; NEW='2026.09.12.9'
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(p,a,b):
    s=read(p); n=s.count(a)
    if n!=1: raise SystemExit(f'{p}: expected one target, found {n}')
    write(p,s.replace(a,b,1))

# Require only the historical core fields that startup dereferences immediately.
rep('MouldMaster_Core_App.html',
'''function mmSelectStartupDb(candidate,pristine){
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
}''',
'''function mmStartupLearnerRecordIsSafe(record,id){
  if(!record||typeof record!=="object"||Array.isArray(record))return false;
  if(typeof record.id!=="string"||mmCanonicalStartupLearnerId(record.id)!==id)return false;
  if(typeof record.name!=="string")return false;
  if(!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates))return false;
  for(const key of ["notes","examScores","examPassStatus","certificateMeta"]){
    const value=record[key];
    if(value!=null&&(typeof value!=="object"||Array.isArray(value)))return false;
  }
  return true;
}
function mmSelectStartupDb(candidate,pristine){
  const fallback=()=>({db:JSON.parse(JSON.stringify(pristine)),rejected:true});
  if(!candidate||typeof candidate!=="object"||Array.isArray(candidate)||!candidate.users||typeof candidate.users!=="object"||Array.isArray(candidate.users))return fallback();
  const entries=Object.entries(candidate.users);
  if(!entries.length)return fallback();
  for(const [id,record] of entries){
    if(mmCanonicalStartupLearnerId(id)!==id||!mmStartupLearnerRecordIsSafe(record,id))return fallback();
  }
  if(typeof candidate.activeUser!=="string")return fallback();
  const active=mmCanonicalStartupLearnerId(candidate.activeUser);
  if(!active||active!==candidate.activeUser||!Object.prototype.hasOwnProperty.call(candidate.users,active))return fallback();
  return {db:candidate,rejected:false};
}''')

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

# Extend regression fixtures to model valid historical core records and malformed legacy imports.
rep('qa_standalone_learner_ids.cjs',
"const startupSelectSource=extractFunction('mmSelectStartupDb');",
"const startupRecordSource=extractFunction('mmStartupLearnerRecordIsSafe');\nconst startupSelectSource=extractFunction('mmSelectStartupDb');")
rep('qa_standalone_learner_ids.cjs',
"const startupApi=new Function(`${startupCanonicalSource}\\n${startupSelectSource}\\nreturn {mmCanonicalStartupLearnerId,mmSelectStartupDb};`)();",
"const startupApi=new Function(`${startupCanonicalSource}\\n${startupRecordSource}\\n${startupSelectSource}\\nreturn {mmCanonicalStartupLearnerId,mmStartupLearnerRecordIsSafe,mmSelectStartupDb};`)();")
rep('qa_standalone_learner_ids.cjs',
"const pristine={activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Pristine'}}};",
"const legacyRecord=(id='learner-1',name='Legacy')=>({id,name,completed:[],bookmarks:[],notes:{},examScores:{},certificates:[]});\nconst pristine={activeUser:'learner-1',users:{'learner-1':legacyRecord('learner-1','Pristine')}};")
rep('qa_standalone_learner_ids.cjs',
"const selected=startupApi.mmSelectStartupDb({activeUser:'constructor',users:{'learner-1':{id:'learner-1'}}},pristine);",
"const selected=startupApi.mmSelectStartupDb({activeUser:'constructor',users:{'learner-1':legacyRecord()}},pristine);")
rep('qa_standalone_learner_ids.cjs',
"const candidate={activeUser:'constructor',users:{constructor:{id:'constructor',name:'Owned legacy'}}};",
"const candidate={activeUser:'constructor',users:{constructor:legacyRecord('constructor','Owned legacy')}};")
rep('qa_standalone_learner_ids.cjs',
"const selected=startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':{id:'learner-1'},\"bad'id\":{id:\"bad'id\"}}},pristine);",
"const selected=startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':legacyRecord(),\"bad'id\":legacyRecord(\"bad'id\")}},pristine);")
needle="  assert.equal(selected.rejected,true,'unsafe inactive persisted learner IDs must also fail the startup registry boundary');\n}\n"
insert='''{
  const bad=legacyRecord(); bad.completed={1:true};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array completed state must fail closed before .includes() use');
}
{
  const bad=legacyRecord(); bad.bookmarks='1,2';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array bookmarks must fail closed before bookmark lookups');
}
{
  const bad=legacyRecord(); bad.certificates={Advanced:true};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-array certificate state must fail closed');
}
{
  const bad=legacyRecord(); bad.name=42;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-string learner name must fail closed before string methods');
}
{
  const bad=legacyRecord(); bad.id='learner-2';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'persisted embedded/key learner-ID mismatch must fail closed');
}
{
  const valid=legacyRecord(); delete valid.examPassStatus; delete valid.certificateMeta;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical core records may omit newer optional evidence maps');
}
'''
rep('qa_standalone_learner_ids.cjs',needle,needle+insert)
needle2="assert(source.includes('mmStartupLearnerDataRejected=true'),'unsafe persisted registries must fail closed before user activation');\n"
rep('qa_standalone_learner_ids.cjs',needle2,needle2+"assert(source.includes('function mmStartupLearnerRecordIsSafe(record,id)'),'startup must validate persisted learner record shapes before render-time dereferences');\nassert(source.includes('!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates)'),'startup must require array-shaped core progress fields');\n")

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
marker='assert "function mmSelectStartupDb(candidate,pristine)" in core and "Object.prototype.hasOwnProperty.call(candidate.users,active)" in core, "persisted learner registry must fail closed on inherited/unsafe startup identities"\n'
extra='assert "function mmStartupLearnerRecordIsSafe(record,id)" in core and "!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates)" in core, "persisted learner registry must validate core learner record shapes before rendering"\n'
if extra not in qa:
    if marker not in qa: raise SystemExit('Startup schema QA insertion marker missing')
    qa=qa.replace(marker,marker+extra,1)
write('qa_release.py',qa)
print(f'Prepared persisted learner schema hardening for {NEW}; core sha256={sha}')
