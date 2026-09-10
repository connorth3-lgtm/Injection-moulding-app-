#!/usr/bin/env python3
"""Finish shell, desktop, learner-scoping and Runtime V2 hardening.

Canonical boundaries:
- specialist evidence display status is generated from data/evidence-coverage-v1.json;
- core runtime behavior uses MM_RUNTIME_V2 hooks rather than global wrapper chains;
- assessment opening history is learner-scoped through Runtime V2 storage;
- browser dynamic root assets are also integrity-hashed and packaged by Electron.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app-shell-finalize.js'
UX=ROOT/'assessment-ux.js'
APPROVAL=ROOT/'assessment-evidence-approval.js'
COVERAGE=ROOT/'data'/'evidence-coverage-v1.json'
SPECIALIST=ROOT/'specialist-evidence-gap-extension.js'
PKG=ROOT/'desktop'/'electron'/'package.json'
INTEGRITY_GEN=ROOT/'desktop'/'electron'/'scripts'/'generate-integrity.cjs'
DESKTOP_QA=ROOT/'desktop'/'electron'/'scripts'/'qa.cjs'


def replace_once(path:Path,old:str,new:str)->None:
    text=path.read_text(encoding='utf-8')
    if new in text:return
    n=text.count(old)
    if n!=1:raise SystemExit(f'Expected exactly one anchor in {path.relative_to(ROOT)}; found {n}: {old[:90]!r}')
    path.write_text(text.replace(old,new,1),encoding='utf-8')


def canonical_specialist_statuses()->tuple[str,dict[str,str]]:
    data=json.loads(COVERAGE.read_text(encoding='utf-8'))
    version=str(data.get('version') or data.get('registryVersion') or data.get('schemaVersion') or 'unknown')
    mechanisms=data.get('mechanisms') or data.get('areas') or data.get('coverage') or []
    rows=list(mechanisms.values()) if isinstance(mechanisms,dict) else list(mechanisms)
    by_id={str(x.get('id')):str(x.get('status','provisional')).strip().lower() for x in rows if isinstance(x,dict) and x.get('id')}
    specialist_src=SPECIALIST.read_text(encoding='utf-8')
    ids=[]
    for x in re.findall(r"evidenceArea:'([^']+)'",specialist_src):
        if x not in ids:ids.append(x)
    if len(ids)<8:raise SystemExit(f'Expected at least 8 specialist evidence areas; found {ids}')
    missing=[x for x in ids if x not in by_id]
    if missing:raise SystemExit('Specialist evidence areas missing from canonical coverage registry: '+', '.join(missing))
    title=lambda s:{'promoted':'Promoted','provisional':'Provisional','gap':'Gap'}.get(s,s[:1].upper()+s[1:])
    return version,{x:title(by_id[x]) for x in ids}


def harden_evidence_status()->None:
    version,statuses=canonical_specialist_statuses()
    text=APP.read_text(encoding='utf-8')
    pattern=r"const EVIDENCE_STATUS=Object\.freeze\(\{[\s\S]*?\n\}\);"
    match=re.search(pattern,text)
    if not match:raise SystemExit('Could not locate app-shell evidence-status snapshot')
    body=',\n'.join(f"  {json.dumps(k)}:{json.dumps(v)}" for k,v in statuses.items())
    replacement=f"const EVIDENCE_REGISTRY_VERSION={json.dumps(version)};\nconst EVIDENCE_STATUS=Object.freeze({{\n{body}\n}});"
    text=text[:match.start()]+replacement+text[match.end():]
    old_export="window.MM_SPECIALIST_EVIDENCE_STATUS={version:'2026.08.29.1',statuses:{...EVIDENCE_STATUS},summary:{...GAP.evidenceSummary},scope:'Resolved display state from the historical mechanism registry plus the formal promotion overlay; no assessment, certificate, process-setting or production authority.'};"
    new_export="window.MM_SPECIALIST_EVIDENCE_STATUS={version:'2026.09.10.1',registryVersion:EVIDENCE_REGISTRY_VERSION,statuses:{...EVIDENCE_STATUS},summary:{...GAP.evidenceSummary},scope:'Display state generated from data/evidence-coverage-v1.json; no learner completion, shell code, assessment, certificate, process-setting or production authority can promote evidence.'};"
    if old_export in text:text=text.replace(old_export,new_export,1)
    elif new_export not in text:raise SystemExit('Could not locate specialist evidence export')
    APP.write_text(text,encoding='utf-8')


def harden_app_runtime_owner()->None:
    old="""function installHomeScreenSimplification(){
  if(window.__MM_HOME_SIMPLIFICATION__||typeof window.renderDashboard!=='function')return;
  const base=window.renderDashboard;
  window.renderDashboard=function(){const result=base.apply(this,arguments);simplifyHomeScreen();stabilizeRetiredChrome();return result};
  window.__MM_HOME_SIMPLIFICATION__='2026.09.06.10';
  simplifyHomeScreen();
}"""
    new="""function installHomeScreenSimplification(){
  if(window.__MM_HOME_SIMPLIFICATION__)return;
  const runtime=window.MM_RUNTIME_V2;if(!runtime)throw new Error('app-shell-finalize.js requires runtime-v2.js for dashboard composition');
  runtime.after('renderDashboard',()=>{simplifyHomeScreen();stabilizeRetiredChrome()});
  runtime.rebind('renderDashboard');
  window.__MM_HOME_SIMPLIFICATION__='2026.09.10.1';
  simplifyHomeScreen();
}"""
    replace_once(APP,old,new)


def harden_assessment_ux()->None:
    replace_once(
        UX,
        "const VERSION='2026.09.06.9';\nconst FIRST_HISTORY_LIMIT=3;\nconst HISTORY_KEY='mm_assessment_opening_history_v1';",
        "const VERSION='2026.09.10.1';\nconst FIRST_HISTORY_LIMIT=3;\nconst HISTORY_KEY='mm_assessment_opening_history_v1';\nconst R=window.MM_RUNTIME_V2;if(!R)throw new Error('assessment-ux.js requires runtime-v2.js');",
    )
    replace_once(UX,"""    const stored=localStorage.getItem(HISTORY_KEY);
    const raw=JSON.parse(stored||'{}');""","""    const raw=R.storage.get(HISTORY_KEY,{})||{};""")
    replace_once(UX,"""    localStorage.setItem(HISTORY_KEY,JSON.stringify(out));
    return true;""","""    return R.storage.set(HISTORY_KEY,out);""")
    replace_once(UX,"function resetQuestionRotation(){firstQuestionHistory.clear();try{localStorage.removeItem(HISTORY_KEY)}catch(_){}}","function resetQuestionRotation(){firstQuestionHistory.clear();R.storage.remove(HISTORY_KEY)}")
    old_hooks="""const baseQuestions=window.getExamQuestions;if(typeof baseQuestions==='function')window.getExamQuestions=function(level,region){return rotateOpeningQuestion(baseQuestions.apply(this,arguments),level,region)};
const baseStart=window.startExam;if(typeof baseStart==='function')window.startExam=function(){state=null;const r=baseStart.apply(this,arguments);setTimeout(decorateExam,0);return r};
const baseGrade=window.gradeExam;if(typeof baseGrade==='function')window.gradeExam=function(){const r=baseGrade.apply(this,arguments);setTimeout(decorateReview,0);return r};"""
    new_hooks="""R.after('getExamQuestions',(rows,level,region)=>rotateOpeningQuestion(rows,level,region));
R.before('startExam',()=>{state=null});
R.after('startExam',()=>{setTimeout(decorateExam,0)});
R.after('gradeExam',()=>{setTimeout(decorateReview,0)});
R.rebind('getExamQuestions');R.rebind('startExam');R.rebind('gradeExam');"""
    replace_once(UX,old_hooks,new_hooks)
    text=UX.read_text(encoding='utf-8').replace("persistence:'learner-scoped localStorage stable IDs only; no answers or personal data'","persistence:'Runtime V2 learner-scoped storage; stable IDs only; no answers or personal data'")
    UX.write_text(text,encoding='utf-8')


def harden_evidence_approval_runtime_owner()->None:
    old="if(coverageOk){style();const baseGrade=window.gradeExam;if(typeof baseGrade==='function')window.gradeExam=function(){const x=baseGrade.apply(this,arguments);setTimeout(enhanceExam,25);return x};let queued=false;"
    new="if(coverageOk){style();const runtime=window.MM_RUNTIME_V2;if(!runtime)throw new Error('assessment-evidence-approval.js requires runtime-v2.js');runtime.after('gradeExam',()=>{setTimeout(enhanceExam,25)});runtime.rebind('gradeExam');let queued=false;"
    replace_once(APPROVAL,old,new)
    text=APPROVAL.read_text(encoding='utf-8').replace("const VERSION='2026.08.30.3'","const VERSION='2026.09.10.1'",1).replace('/* MouldMaster answer-evidence approval layer — 2026-08-30.3 */','/* MouldMaster answer-evidence approval layer — 2026-09-10.1 */',1)
    APPROVAL.write_text(text,encoding='utf-8')


def harden_desktop_assets()->None:
    pkg_text=PKG.read_text(encoding='utf-8')
    additions=[('../../measured-learning-library.js','mouldmaster/measured-learning-library.js'),('../../lesson-simple-experience.js','mouldmaster/lesson-simple-experience.js')]
    anchor='      {"from": "../../learning-experience.js", "to": "mouldmaster/learning-experience.js"},\n'
    if anchor not in pkg_text:raise SystemExit('Desktop extraResources insertion anchor missing')
    missing=[x for x in additions if f'"from": "{x[0]}"' not in pkg_text]
    if missing:
        rows=''.join(f'      {{"from": "{src}", "to": "{dst}"}},\n' for src,dst in missing)
        pkg_text=pkg_text.replace(anchor,anchor+rows,1)
    json.loads(pkg_text);PKG.write_text(pkg_text,encoding='utf-8')

    gen=INTEGRITY_GEN.read_text(encoding='utf-8')
    gen_anchor="  'app-shell-registry.js','assessment-multimodal.js','pwa-shell.js','learning-experience.js','process-data-diagnostics.js','real-measured-data-assessment.js',"
    gen_new="  'app-shell-registry.js','assessment-multimodal.js','pwa-shell.js','learning-experience.js','measured-learning-library.js','lesson-simple-experience.js','process-data-diagnostics.js','real-measured-data-assessment.js',"
    if gen_new not in gen:
        if gen_anchor not in gen:raise SystemExit('Desktop integrity asset insertion anchor missing')
        gen=gen.replace(gen_anchor,gen_new,1)
    INTEGRITY_GEN.write_text(gen,encoding='utf-8')

    qa=DESKTOP_QA.read_text(encoding='utf-8')
    qa_anchor="need(DOMAIN_MANIFEST?.schemaVersion===1&&Array.isArray(DOMAIN_MANIFEST.assets)&&Array.isArray(DOMAIN_MANIFEST.dataAssets),'runtime domain manifest invalid for desktop QA');"
    qa_insert="""const DYNAMIC_ROOT_ASSETS=['measured-learning-library.js','lesson-simple-experience.js'];
for(const name of DYNAMIC_ROOT_ASSETS){
  need((PKG.build?.extraResources||[]).some(x=>x?.from===`../../${name}`&&x?.to===`mouldmaster/${name}`),`dynamic root runtime asset is not packaged by desktop: ${name}`);
  need(Object.prototype.hasOwnProperty.call(INTEGRITY.files,name),`dynamic root runtime asset is not integrity-hashed/servable by desktop: ${name}`);
}
"""+qa_anchor
    if 'const DYNAMIC_ROOT_ASSETS=' not in qa:
        if qa_anchor not in qa:raise SystemExit('Desktop QA dynamic-root insertion anchor missing')
        qa=qa.replace(qa_anchor,qa_insert,1)
    DESKTOP_QA.write_text(qa,encoding='utf-8')


def verify()->None:
    version,statuses=canonical_specialist_statuses();app=APP.read_text(encoding='utf-8')
    for k,v in statuses.items():
        if f'{json.dumps(k)}:{json.dumps(v)}' not in app:raise SystemExit(f'App-shell evidence status not synced: {k}={v}')
    if f'const EVIDENCE_REGISTRY_VERSION={json.dumps(version)};' not in app:raise SystemExit('App-shell evidence registry version not synced')
    if 'window.renderDashboard=function' in app:raise SystemExit('App shell still overwrites renderDashboard')
    for marker in ("runtime.after('renderDashboard'","runtime.rebind('renderDashboard')"):
        if marker not in app:raise SystemExit('Missing app-shell Runtime V2 hook: '+marker)

    ux=UX.read_text(encoding='utf-8')
    for forbidden in ('localStorage.getItem(HISTORY_KEY)','localStorage.setItem(HISTORY_KEY','localStorage.removeItem(HISTORY_KEY)','window.getExamQuestions=function','window.startExam=function','window.gradeExam=function'):
        if forbidden in ux:raise SystemExit('Assessment UX still uses unscoped/wrapper behavior: '+forbidden)
    for marker in ('R.storage.get(HISTORY_KEY','R.storage.set(HISTORY_KEY','R.storage.remove(HISTORY_KEY)',"R.after('getExamQuestions'","R.before('startExam'","R.after('gradeExam'"):
        if marker not in ux:raise SystemExit('Assessment UX hardening marker missing: '+marker)

    approval=APPROVAL.read_text(encoding='utf-8')
    if 'window.gradeExam=function' in approval:raise SystemExit('Evidence approval still overwrites gradeExam')
    if "runtime.after('gradeExam'" not in approval:raise SystemExit('Evidence approval Runtime V2 grade hook missing')

    package=json.loads(PKG.read_text(encoding='utf-8'))
    for name in ('measured-learning-library.js','lesson-simple-experience.js'):
        if not any(x.get('from')==f'../../{name}' and x.get('to')==f'mouldmaster/{name}' for x in package['build']['extraResources']):raise SystemExit('Desktop package missing '+name)
        if name not in INTEGRITY_GEN.read_text(encoding='utf-8'):raise SystemExit('Desktop integrity generator missing '+name)
    for path in (APP,UX,APPROVAL,INTEGRITY_GEN,DESKTOP_QA):subprocess.run(['node','--check',str(path.relative_to(ROOT))],cwd=ROOT,check=True)
    subprocess.run(['node','desktop/electron/scripts/generate-integrity.cjs'],cwd=ROOT,check=True)
    subprocess.run(['node','desktop/electron/scripts/generate-licenses.cjs'],cwd=ROOT,check=True)
    subprocess.run(['node','desktop/electron/scripts/generate-sbom.cjs'],cwd=ROOT,check=True)
    subprocess.run(['node','desktop/electron/scripts/qa.cjs'],cwd=ROOT,check=True)


def main()->None:
    harden_evidence_status();harden_app_runtime_owner();harden_assessment_ux();harden_evidence_approval_runtime_owner();harden_desktop_assets();verify()
    print('Shell/desktop hardening applied: canonical evidence status, Runtime V2 ownership, learner-scoped assessment rotation, dynamic desktop asset parity.')

if __name__=='__main__':main()
