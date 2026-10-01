from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent

def text(path): return (ROOT/path).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

curr=text('curriculum-integration.js')
analytics=text('learning-analytics.js')
pilot=json.loads(text('data/learner-pilot-v1.json'))
basis=text('sources/LEARNING_AND_ENGINEERING_REVIEW_BASIS.md')
external=json.loads(text('data/release-external-validation-v1.json'))

p=subprocess.run(['node','--check',str(ROOT/'curriculum-integration.js')],capture_output=True,text=True)
need(p.returncode==0,'curriculum-integration.js syntax error: '+(p.stderr or p.stdout))
p=subprocess.run(['node','--check',str(ROOT/'learning-analytics.js')],capture_output=True,text=True)
need(p.returncode==0,'learning-analytics.js syntax error: '+(p.stderr or p.stdout))

for marker in [
    'Mechanism → measurement → discrimination → verification',
    'Known-good baseline','Current measured evidence','Rank competing mechanisms',
    'Smallest discriminating test','Verify recovery',
    'Worked support','Partial guidance','Evidence-only challenge',
    'Measurement-first boundary:'
]:
    need(marker in curr,f'learning-science curriculum marker missing: {marker}')

for marker in [
    'Delayed transfer / retention','7-day / 30-day reviews due',
    'MM_DELAYED_TRANSFER_REVIEWS?.project?.','learning evidence only'
]:
    need(marker in analytics,f'retention analytics marker missing: {marker}')

need(pilot.get('synthetic') is False,'learner pilot must require real learners')
need(pilot.get('status')=='prepared','learner pilot must remain prepared until evidence exists')
need(pilot.get('evidence') is None,'learner pilot must not invent evidence')
for key in ['primaryEndpoints','secondaryEndpoints','analysisRules','psychometricPlan']:
    need(pilot.get(key),f'learner pilot validation contract missing: {key}')
need(pilot['psychometricPlan'].get('status')=='descriptive-until-real-cohort','psychometric plan must remain descriptive before real cohort')
joined=json.dumps(pilot)
for marker in ['attrition','distractor selection frequencies','safety-critical error patterns','synthetic traffic','cut-score']:
    need(marker in joined,f'learner validation boundary missing: {marker}')

for doi in [
    '10.3102/00346543070002181',
    '10.1207/S15326985EP3801_4',
    '10.1111/j.1467-9280.2006.01693.x',
    '10.1037/a0037559',
    '10.1016/j.learninstruc.2025.102142'
]:
    need(doi in basis,f'learning-science source missing: {doi}')
for book in ['Injection Molding Handbook','Injection Mold Design Engineering','Runner and Gating Design Handbook','Handbook of Molded Part Shrinkage and Warpage']:
    need(book in basis,f'established engineering reference missing: {book}')

learner=(external.get('learnerOutcomes') or {})
need(learner.get('status')=='hold','learner outcomes must remain HOLD until real externally reviewed evidence exists')
need('synthetic' in text('sources/LEARNING_AND_ENGINEERING_REVIEW_BASIS.md').lower(),'basis must preserve synthetic-evidence boundary')

print('MouldMaster learning-science remediation QA passed (adaptive guidance, retention visibility, pre-specified learner/psychometric gates, external outcome HOLD preserved)')
