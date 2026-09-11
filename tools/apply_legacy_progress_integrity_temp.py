#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.12'; NEW='2026.09.12.13'
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(p,a,b):
    s=read(p);n=s.count(a)
    if n!=1: raise SystemExit(f'{p}: expected one target, found {n}')
    write(p,s.replace(a,b,1))

old='''function mmStartupLearnerRecordIsSafe(record,id){
  if(!record||typeof record!=="object"||Array.isArray(record))return false;
  if(typeof record.id!=="string"||mmCanonicalStartupLearnerId(record.id)!==id)return false;
  if(typeof record.name!=="string")return false;
  if(!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates))return false;'''
new='''function mmStartupUniqueLessonIdsAreSafe(values){
  return Array.isArray(values)&&values.length<=D.lessons.length&&new Set(values).size===values.length&&values.every(value=>Number.isInteger(value)&&value>=1&&value<=D.lessons.length);
}
function mmStartupCertificateKeyIsSafe(value){
  if(typeof value!=="string")return false;
  if(["Beginner","Intermediate","Advanced"].includes(value))return true;
  return /^(Beginner|Intermediate|Advanced)-(ALL|UK|US|NZ)$/.test(value);
}
function mmStartupCertificatesAreSafe(values){
  return Array.isArray(values)&&values.length<=15&&new Set(values).size===values.length&&values.every(mmStartupCertificateKeyIsSafe);
}
function mmStartupLearnerRecordIsSafe(record,id){
  if(!record||typeof record!=="object"||Array.isArray(record))return false;
  if(typeof record.id!=="string"||mmCanonicalStartupLearnerId(record.id)!==id)return false;
  if(typeof record.name!=="string")return false;
  if(!mmStartupUniqueLessonIdsAreSafe(record.completed)||!mmStartupUniqueLessonIdsAreSafe(record.bookmarks)||!mmStartupCertificatesAreSafe(record.certificates))return false;'''
rep('MouldMaster_Core_App.html',old,new)

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core runtime generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

qa=read('qa_standalone_learner_ids.cjs')
marker="const startupRecordSource=extractFunction('mmStartupLearnerRecordIsSafe');\n"
add="const startupLessonIdsSource=extractFunction('mmStartupUniqueLessonIdsAreSafe');\nconst startupCertKeySource=extractFunction('mmStartupCertificateKeyIsSafe');\nconst startupCertsSource=extractFunction('mmStartupCertificatesAreSafe');\n"
if qa.count(marker)!=1: raise SystemExit('QA startup extractor marker missing')
qa=qa.replace(marker,add+marker,1)
old_api="const startupApi=new Function(`${startupCanonicalSource}\\n${startupRecordSource}\\n${startupSelectSource}\\nreturn {mmCanonicalStartupLearnerId,mmStartupLearnerRecordIsSafe,mmSelectStartupDb};`)();"
new_api="const startupApi=new Function('D',`${startupCanonicalSource}\\n${startupLessonIdsSource}\\n${startupCertKeySource}\\n${startupCertsSource}\\n${startupRecordSource}\\n${startupSelectSource}\\nreturn {mmCanonicalStartupLearnerId,mmStartupUniqueLessonIdsAreSafe,mmStartupCertificateKeyIsSafe,mmStartupCertificatesAreSafe,mmStartupLearnerRecordIsSafe,mmSelectStartupDb};`)({lessons:Array.from({length:120},(_,i)=>({id:i+1}))});"
if qa.count(old_api)!=1: raise SystemExit('QA startup API marker missing')
qa=qa.replace(old_api,new_api,1)
insert_marker="{\n  const bad=legacyRecord(); bad.completed={1:true};\n"
insert=r'''{
  const bad=legacyRecord(); bad.completed=[1,1];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate legacy completion IDs must not inflate overall progress');
}
{
  const bad=legacyRecord(); bad.completed=[121];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'out-of-range legacy completion IDs must not count as course progress');
}
{
  const bad=legacyRecord(); bad.bookmarks=[1,1];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate legacy bookmark IDs must fail the canonical startup boundary');
}
{
  const bad=legacyRecord(); bad.certificates=['Advanced-ALL','Advanced-ALL'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate certificate keys must not inflate instructor certificate counts');
}
{
  const bad=legacyRecord(); bad.certificates=['Not-A-Certificate'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'unknown legacy certificate keys must not count as earned credentials');
}
{
  const valid=legacyRecord(); valid.completed=[1,2,120];valid.bookmarks=[3,119];valid.certificates=['Beginner','Intermediate-US','Advanced-NZ'];
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical lesson IDs and legacy/current certificate formats must remain compatible');
}
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced'),true);
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-NZ'),true);
assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-XX'),false);
'''
if qa.count(insert_marker)!=1: raise SystemExit('QA progress-integrity insertion marker missing')
qa=qa.replace(insert_marker,insert+insert_marker,1)
write('qa_standalone_learner_ids.cjs',qa)

v=json.loads(read('version.json'))
if v.get('web_release')!=OLD: raise SystemExit(f"Unexpected web release {v.get('web_release')!r}")
v['web_release']=NEW;write('version.json',json.dumps(v,indent=2)+'\n')
for p in ['README.md','support.html']:
    s=read(p)
    if OLD not in s: raise SystemExit(f'{p}: old release missing')
    write(p,s.replace(OLD,NEW))
ext=json.loads(read('data/release-external-validation-v1.json'))
if ext.get('release')!=OLD: raise SystemExit('External validation release mismatch')
ext['release']=NEW;write('data/release-external-validation-v1.json',json.dumps(ext,indent=2)+'\n')
rep('qa_release.py',f'WEB_RELEASE = "{OLD}"',f'WEB_RELEASE = "{NEW}"')
rep('qa_release_docs.py',f" 'web_release':'{OLD}',",f" 'web_release':'{NEW}',")
sha=hashlib.sha256((ROOT/'MouldMaster_Core_App.html').read_bytes()).hexdigest()
release=read('qa_release.py');prefix='CURRENT_CORE_SHA256 = "';a=release.find(prefix);b=release.find('"',a+len(prefix))
if a<0 or b<0: raise SystemExit('Core hash lock missing')
release=release[:a+len(prefix)]+sha+release[b:]
marker2='assert "function mmStartupLearnerRecordIsSafe(record,id)" in core and "!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates)" in core, "persisted learner registry must validate core learner record shapes before rendering"\n'
# Replace the stale shape-only assertion with the stronger canonical progress/certificate contract.
new_assert='assert "function mmStartupUniqueLessonIdsAreSafe(values)" in core and "function mmStartupCertificatesAreSafe(values)" in core and "mmStartupCertificatesAreSafe(record.certificates)" in core, "persisted learner registry must validate unique in-range progress/bookmark IDs and recognized certificate keys before rendering"\n'
if marker2 not in release: raise SystemExit('Release QA old startup-array marker missing')
release=release.replace(marker2,new_assert,1)
write('qa_release.py',release)
print(f'Prepared legacy progress/certificate integrity hardening for {NEW}; core sha256={sha}')
