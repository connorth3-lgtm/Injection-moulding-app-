#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.10'; NEW='2026.09.12.11'
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(p,a,b):
    s=read(p); n=s.count(a)
    if n!=1: raise SystemExit(f'{p}: expected one target, found {n}')
    write(p,s.replace(a,b,1))

old='''function mmStartupLearnerRecordIsSafe(record,id){
  if(!record||typeof record!=="object"||Array.isArray(record))return false;
  if(typeof record.id!=="string"||mmCanonicalStartupLearnerId(record.id)!==id)return false;
  if(typeof record.name!=="string")return false;
  if(!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates))return false;
  for(const key of ["notes","examScores","examPassStatus","certificateMeta"]){
    const value=record[key];
    if(value!=null&&(typeof value!=="object"||Array.isArray(value)))return false;
  }
  return true;
}'''
new='''function mmStartupLearnerRecordIsSafe(record,id){
  if(!record||typeof record!=="object"||Array.isArray(record))return false;
  if(typeof record.id!=="string"||mmCanonicalStartupLearnerId(record.id)!==id)return false;
  if(typeof record.name!=="string")return false;
  if(!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates))return false;
  for(const key of ["notes","examScores","examPassStatus","certificateMeta"]){
    const value=record[key];
    if(value!=null&&(typeof value!=="object"||Array.isArray(value)))return false;
  }
  if(record.examScores!=null){
    for(const value of Object.values(record.examScores)){
      if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>100)return false;
    }
  }
  if(record.examPassStatus!=null){
    for(const value of Object.values(record.examPassStatus))if(typeof value!=="boolean")return false;
  }
  if(record.fun!=null){
    const f=record.fun;
    if(typeof f!=="object"||Array.isArray(f))return false;
    for(const key of ["xp","scenarioCorrect","scenarioAttempts","bossWins","streak"]){
      if(f[key]!=null&&(typeof f[key]!=="number"||!Number.isFinite(f[key])||f[key]<0))return false;
    }
    if(f.rewarded!=null&&(typeof f.rewarded!=="object"||Array.isArray(f.rewarded)))return false;
    if(f.rewarded!=null){
      for(const value of Object.values(f.rewarded))if(!["string","number","boolean"].includes(typeof value))return false;
    }
    if(f.achievements!=null&&(!Array.isArray(f.achievements)||f.achievements.some(value=>typeof value!=="string")))return false;
    for(const key of ["sound","celebrations"])if(f[key]!=null&&typeof f[key]!=="boolean")return false;
    for(const key of ["lastLearningDate","lastActiveDate"])if(f[key]!=null&&typeof f[key]!=="string")return false;
  }
  if(record.materialScience!=null){
    const m=record.materialScience;
    if(typeof m!=="object"||Array.isArray(m))return false;
    if(m.completed!=null&&(!Array.isArray(m.completed)||m.completed.some(value=>!Number.isInteger(value)||value<1||value>36))return false;
    if(m.bestQuiz!=null&&(typeof m.bestQuiz!=="number"||!Number.isFinite(m.bestQuiz)||m.bestQuiz<0||m.bestQuiz>100))return false;
    if(m.quizAttempts!=null&&(typeof m.quizAttempts!=="number"||!Number.isFinite(m.quizAttempts)||m.quizAttempts<0))return false;
    if(m.currentLesson!=null&&(!Number.isInteger(m.currentLesson)||m.currentLesson<1||m.currentLesson>36))return false;
  }
  return true;
}'''
rep('MouldMaster_Core_App.html',old,new)
rep('MouldMaster_Core_App.html','<span class="pill">${status}</span>','<span class="pill">${esc(status)}</span>')
rep('MouldMaster_Core_App.html','<div style="font-size:27px;font-weight:900">${f.xp} XP</div>','<div style="font-size:27px;font-weight:900">${esc(f.xp)} XP</div>')
rep('MouldMaster_Core_App.html','<span class="fun-chip streak">🔥 ${f.streak}-day learning streak</span>','<span class="fun-chip streak">🔥 ${esc(f.streak)}-day learning streak</span>')
# Two active material-science renderers display bestQuiz; escape both direct persisted-value sinks.
s=read('MouldMaster_Core_App.html')
old_mat='${m.bestQuiz==null?"—":m.bestQuiz+"%"}'
count=s.count(old_mat)
if count!=2: raise SystemExit(f'MouldMaster_Core_App.html: expected two bestQuiz display sinks, found {count}')
write('MouldMaster_Core_App.html',s.replace(old_mat,'${m.bestQuiz==null?"—":esc(m.bestQuiz)+"%"}'))

spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

# Extend startup regressions with valid and malicious legacy persisted values.
qa=read('qa_standalone_learner_ids.cjs')
needle="''"
marker="for(const id of ['',\"bad'id\",'bad\"id','<tag>','bad\\\\id','bad/id','bad\\nid','bad\\rid','bad id','bad;id','bad(id)','-leading'])assert.equal(api.pvCanonicalLearnerId(id),'',`unsafe learner ID must be rejected: ${JSON.stringify(id)}`);\n"
insert='''{
  const bad=legacyRecord(); bad.examScores={'Beginner-ALL':'<img src=x onerror=alert(1)>'};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string exam scores from permissive legacy imports must fail closed before HTML rendering');
}
{
  const bad=legacyRecord(); bad.examPassStatus={'Beginner-ALL':'false'};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-boolean pass status must not become truthy passed state');
}
{
  const bad=legacyRecord(); bad.fun={xp:'<svg/onload=alert(1)>',streak:1,achievements:[],rewarded:{}};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string gamification counters must fail closed before dashboard HTML rendering');
}
{
  const bad=legacyRecord(); bad.materialScience={completed:[],bestQuiz:'<img src=x onerror=alert(1)>',quizAttempts:0,currentLesson:1};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'string material quiz state must fail closed before material HTML rendering');
}
{
  const valid=legacyRecord();
  valid.examScores={'Beginner-ALL':87.5};
  valid.examPassStatus={'Beginner-ALL':true};
  valid.fun={xp:120,rewarded:{lesson1:1700000000000,lesson2:'1700000000001'},achievements:['first-lesson'],sound:false,celebrations:true,scenarioCorrect:2,scenarioAttempts:3,bossWins:0,streak:4,lastLearningDate:'2026-09-11'};
  valid.materialScience={completed:[1,2],bestQuiz:80,quizAttempts:1,currentLesson:3};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':valid}},pristine).rejected,false,'valid historical assessment, gamification and material-science state must remain compatible');
}
assert(source.includes('<span class="pill">${esc(status)}</span>'),'exam status display must escape persisted-derived status text');
assert(source.includes('${esc(f.xp)} XP')&&source.includes('${esc(f.streak)}-day learning streak'),'gamification counters must be escaped at HTML sinks');
assert.equal((source.match(/m\.bestQuiz==null\?"—":esc\(m\.bestQuiz\)\+"%"/g)||[]).length,2,'both material best-quiz HTML sinks must escape persisted values');
'''
if marker not in qa: raise SystemExit('QA legacy-state insertion marker missing')
write('qa_standalone_learner_ids.cjs',qa.replace(marker,insert+marker,1))

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
marker2='assert "function mmStartupLearnerRecordIsSafe(record,id)" in core and "!Array.isArray(record.completed)||!Array.isArray(record.bookmarks)||!Array.isArray(record.certificates)" in core, "persisted learner registry must validate core learner record shapes before rendering"\n'
extra='assert "typeof value!==\\\"number\\\"||!Number.isFinite(value)||value<0||value>100" in core and "<span class=\\\"pill\\\">${esc(status)}</span>" in core, "persisted assessment values must be typed at startup and escaped at exam-status HTML sinks"\nassert "${esc(f.xp)} XP" in core and "${esc(f.streak)}-day learning streak" in core and "m.bestQuiz==null?\\\"—\\\":esc(m.bestQuiz)+\\\"%\\\"" in core, "legacy gamification/material numeric state must be escaped at HTML sinks"\n'
if extra not in qa:
    if marker2 not in qa: raise SystemExit('Legacy-state release-QA insertion marker missing')
    qa=qa.replace(marker2,marker2+extra,1)
write('qa_release.py',qa)
print(f'Prepared legacy persisted-state sink hardening for {NEW}; core sha256={sha}')
