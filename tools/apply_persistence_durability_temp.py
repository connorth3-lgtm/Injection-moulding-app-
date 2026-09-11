#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.12.11'
NEW='2026.09.12.12'

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')
def replace_once(path,old,new):
    text=read(path); count=text.count(old)
    if count!=1: raise SystemExit(f'{path}: expected one target, found {count}')
    write(path,text.replace(old,new,1))
def replace_count(path,old,new,expected):
    text=read(path); count=text.count(old)
    if count!=expected: raise SystemExit(f'{path}: expected {expected} targets, found {count}')
    write(path,text.replace(old,new))

old_persist='''persist=function(){
  user.lastSeen=new Date().toISOString();
  db.users[db.activeUser]=user;
  try{ localStorage.setItem("mouldmasterProDB",JSON.stringify(db)); }catch(e){ /* app remains usable for this session */ }
  updateGlobalProgress();
};'''
new_persist='''function mmSetStorageDurability(durable){
  const id="mmStorageDurabilityWarning",existing=document.getElementById(id);
  if(durable){if(existing)existing.remove();return}
  if(existing)return;
  const warning=document.createElement("div");
  warning.id=id;warning.className="callout";warning.setAttribute("role","status");warning.setAttribute("aria-live","polite");
  warning.textContent="Browser storage is unavailable. Changes are available only for this session and will be lost after reload or close. Export a backup now if you need to preserve the current session.";
  const host=document.querySelector("#mainContent")||document.body;host.prepend(warning);
}
function mmPersistCurrentState(){
  user.lastSeen=new Date().toISOString();
  db.users[db.activeUser]=user;
  let durable=true;
  try{localStorage.setItem("mouldmasterProDB",JSON.stringify(db))}catch(e){durable=false}
  updateGlobalProgress();
  mmSetStorageDurability(durable);
  return durable;
}
persist=mmPersistCurrentState;'''
replace_once('MouldMaster_Core_App.html',old_persist,new_persist)

replace_once(
    'MouldMaster_Core_App.html',
    'function saveLessonNote(id){user.notes=user.notes||{};user.notes[id]=$("#lessonNotes").value;persist();toast("Notes saved")}',
    'function saveLessonNote(id){user.notes=user.notes||{};user.notes[id]=$("#lessonNotes").value;const durable=persist();toast(durable?"Notes saved":"Note updated for this session only — browser storage is unavailable.")}'
)
replace_count(
    'MouldMaster_Core_App.html',
    'persist();updateGlobalProgress();renderProfile();toast("Preferences saved");',
    'const durable=persist();updateGlobalProgress();renderProfile();toast(durable?"Preferences saved":"Preferences updated for this session only — browser storage is unavailable.");',
    2,
)
replace_count(
    'MouldMaster_Core_App.html',
    'persist();closeModal();updateGlobalProgress();renderInstructor();toast("Learner created");',
    'const durable=persist();closeModal();updateGlobalProgress();renderInstructor();toast(durable?"Learner created":"Learner created for this session only — browser storage is unavailable.");',
    2,
)
old_exam='''  if(passed&&!had&&!user.certificateMeta[key]) user.certificateMeta[key]={earnedAt:new Date().toISOString(),score:pct,region:activeExam.region,level};
  persist();
};'''
new_exam='''  if(passed&&!had&&!user.certificateMeta[key]) user.certificateMeta[key]={earnedAt:new Date().toISOString(),score:pct,region:activeExam.region,level};
  const durable=persist();
  if(!durable){
    const result=$("#examResult");
    if(result&&!result.querySelector(".mm-session-only-result")){
      const note=document.createElement("div");note.className="mm-session-only-result muted";
      note.textContent="This result and any certificate earned are available only for this session because browser storage is unavailable. Export a backup before reload or close if you need to preserve current progress.";
      result.appendChild(note);
    }
  }
};'''
replace_once('MouldMaster_Core_App.html',old_exam,new_exam)

support=read('support.html')
old_support="Use the app's progress export before changing browser profiles, clearing site data or moving devices."
new_support=old_support+" If the app reports that browser storage is unavailable, current changes are session-only; export a backup before reloading or closing the app if you need to preserve that session."
if support.count(old_support)!=1: raise SystemExit('support.html persistence guidance marker missing or ambiguous')
write('support.html',support.replace(old_support,new_support,1))

# Regenerate deterministic runtime slots from the canonical standalone core.
spec=importlib.util.spec_from_file_location('mm_externalize_core',ROOT/'tools/externalize_core_scripts.py')
if spec is None or spec.loader is None: raise SystemExit('Could not load core runtime generator')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
core=read('MouldMaster_Core_App.html')
for name,body in mod.expected_assets(core).items(): write(f'src/core-runtime/{name}',body)

# Behavioral persistence regression harness and contract markers.
qa=read('qa_standalone_learner_ids.cjs')
extract_marker="const resetCommitSource=extractFunction('pvCommitPristineReset');\n"
extract_add="const storageDurabilitySource=extractFunction('mmSetStorageDurability');\nconst persistCurrentSource=extractFunction('mmPersistCurrentState');\n"
if qa.count(extract_marker)!=1: raise SystemExit('QA persistence extractor marker missing')
qa=qa.replace(extract_marker,extract_marker+extract_add,1)
insert_marker="for(const id of ['',\"bad'id\",'bad\"id','<tag>','bad\\\\id','bad/id','bad\\nid','bad\\rid','bad id','bad;id','bad(id)','-leading'])assert.equal(api.pvCanonicalLearnerId(id),'',`unsafe learner ID must be rejected: ${JSON.stringify(id)}`);\n"
insert=r'''function makePersistenceHarness(storage){
  const elements=new Map();
  const host={prepend(element){elements.set(element.id,element)}};
  const document={
    body:host,
    getElementById(id){return elements.get(id)||null},
    querySelector(selector){return selector==='#mainContent'?host:null},
    createElement(){return {id:'',className:'',textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v},remove(){elements.delete(this.id)}}}
  };
  const state={
    db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Existing'}}},
    user:{id:'learner-1',name:'Existing'},
    progressCalls:0
  };
  const harness=new Function('state','localStorage','document',`${storageDurabilitySource}\nlet db=state.db,user=state.user;const updateGlobalProgress=()=>{state.progressCalls++};\n${persistCurrentSource}\nreturn {persist:mmPersistCurrentState,elements,snapshot:()=>({db,user})};`)(state,storage,document);
  return {state,harness};
}
{
  const {state,harness}=makePersistenceHarness({setItem(){throw new Error('quota exceeded')}});
  assert.equal(harness.persist(),false,'ordinary persistence must report storage failure instead of silently claiming durability');
  assert.equal(state.progressCalls,1,'storage failure must not prevent the current session UI from updating');
  const warning=harness.elements.get('mmStorageDurabilityWarning');
  assert(warning,'storage failure must render a persistent session-only warning');
  assert.match(warning.textContent,/only for this session/);
  assert.match(warning.textContent,/Export a backup/);
}
{
  let stored='';
  const storage={setItem(k,v){assert.equal(k,'mouldmasterProDB');stored=String(v)}};
  const {state,harness}=makePersistenceHarness(storage);
  assert.equal(harness.persist(),true,'ordinary persistence must report a successful durable write');
  assert.equal(JSON.parse(stored).activeUser,'learner-1');
  assert.equal(state.progressCalls,1);
  assert.equal(harness.elements.has('mmStorageDurabilityWarning'),false,'successful persistence must not leave a session-only warning');
}
assert(source.includes('toast(durable?"Notes saved":"Note updated for this session only — browser storage is unavailable.")'),'note save wording must distinguish durable and session-only state');
assert.equal((source.match(/toast\(durable\?"Preferences saved":"Preferences updated for this session only — browser storage is unavailable\."\)/g)||[]).length,2,'profile preference save wording must distinguish durable and session-only state');
assert.equal((source.match(/toast\(durable\?"Learner created":"Learner created for this session only — browser storage is unavailable\."\)/g)||[]).length,2,'learner creation wording must distinguish durable and session-only state');
assert(source.includes('mm-session-only-result')&&source.includes('This result and any certificate earned are available only for this session'),'assessment evidence must disclose non-durable certificate/result state');
'''
if qa.count(insert_marker)!=1: raise SystemExit('QA persistence insertion marker missing')
qa=qa.replace(insert_marker,insert+insert_marker,1)
write('qa_standalone_learner_ids.cjs',qa)

# Governed web release bump.
v=json.loads(read('version.json'))
if v.get('web_release')!=OLD: raise SystemExit(f"Unexpected web release {v.get('web_release')!r}")
v['web_release']=NEW;write('version.json',json.dumps(v,indent=2)+'\n')
for path in ['README.md','support.html']:
    text=read(path)
    if OLD not in text: raise SystemExit(f'{path}: old release missing')
    write(path,text.replace(OLD,NEW))
ext=json.loads(read('data/release-external-validation-v1.json'))
if ext.get('release')!=OLD: raise SystemExit('External validation release mismatch')
ext['release']=NEW;write('data/release-external-validation-v1.json',json.dumps(ext,indent=2)+'\n')
replace_once('qa_release.py',f'WEB_RELEASE = "{OLD}"',f'WEB_RELEASE = "{NEW}"')
replace_once('qa_release_docs.py',f" 'web_release':'{OLD}',",f" 'web_release':'{NEW}',")
sha=hashlib.sha256((ROOT/'MouldMaster_Core_App.html').read_bytes()).hexdigest()
release=read('qa_release.py');prefix='CURRENT_CORE_SHA256 = "';start=release.find(prefix);end=release.find('"',start+len(prefix))
if start<0 or end<0: raise SystemExit('Core hash lock missing')
release=release[:start+len(prefix)]+sha+release[end:]
marker='assert "function pvCommitPristineReset()" in core and "Existing learner data was left unchanged" in core, "standalone destructive reset must fail closed when browser storage cannot persist the reset"\n'
extra='assert "function mmPersistCurrentState()" in core and "mmStorageDurabilityWarning" in core and "return durable;" in core, "ordinary learner persistence must report durability and expose a persistent session-only warning on storage failure"\nassert "mm-session-only-result" in core and "This result and any certificate earned are available only for this session" in core, "non-durable assessment evidence must be disclosed in the result UI"\n'
if extra not in release:
    if marker not in release: raise SystemExit('Release QA persistence insertion marker missing')
    release=release.replace(marker,marker+extra,1)
write('qa_release.py',release)
print(f'Prepared persistence durability hardening for {NEW}; core sha256={sha}')
