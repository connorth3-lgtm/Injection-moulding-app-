from pathlib import Path
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parent

def text(name):
    p=ROOT/name
    if not p.exists():
        raise AssertionError(f'specialist evidence-gap dependency missing: {name}')
    return p.read_text(encoding='utf-8')

def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

JS='specialist-evidence-gap-extension.js'
REGISTRY='data/evidence-coverage-v1.json'
WORKFLOW='.github/workflows/specialist-evidence-gaps.yml'
required=[
    JS,'specialist-curriculum.js','MouldMaster_Core_App.html','index.html','service-worker.js',REGISTRY,
    'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs',WORKFLOW
]
for name in required:text(name)

js=text(JS)
p=subprocess.run(['node','--check',str(ROOT/JS)],capture_output=True,text=True)
need(p.returncode==0,JS+' syntax error: '+(p.stderr or p.stdout))

need("const VERSION='2026.08.28.1'" in js,'evidence-gap extension version marker missing')
need("CORE.lessons.length!==120" in js,'extension must lock to canonical 120 lessons')
need("BASE.lessons.length!==12" in js,'extension must build on the established 12 specialist lessons')
need('20 optional extensions' in js and '20 optional lessons' in js,'combined specialist count must be explicit')
need('Evidence status:' in js and 'not promoted evidence' in js,'provisional evidence boundary missing from learner UI')
need('does not alter the canonical 120 lessons' in js,'canonical-path boundary missing')

ids=re.findall(r"\bid:'(S\d{2})',title:",js)
need(ids==[f'S{i:02d}' for i in range(13,21)],f'expected contiguous S13-S20, found {ids}')
need(len(set(ids))==8,'evidence-gap specialist IDs must be unique')
need(js.count("evidenceStatus:'Provisional'")==8,'every evidence-gap lesson must be explicitly provisional')
need(js.count('objectives:[')==8,'every evidence-gap lesson must define objectives')
need(js.count('keypoints:[')==8,'every evidence-gap lesson must define engineering keypoints')
need(js.count('evidenceTask:')==8,'every evidence-gap lesson must define an evidence task')
need(js.count('practices:[')==8,'every evidence-gap lesson must link to established formative practice')

expected_areas=[
    'residual-stress-birefringence',
    'weld-line-mechanical-strength',
    'runner-gate-multicavity-imbalance',
    'hot-runner-actual-behaviour',
    'liquid-silicone-rubber',
    'fluid-assisted-moulding',
    'surface-replication-release',
    'injection-compression-precision-optics',
]
areas=re.findall(r"evidenceArea:'([^']+)'",js)
need(areas==expected_areas,f'evidence-gap registry mapping changed unexpectedly: {areas}')

registry=json.loads(text(REGISTRY))
registry_by_id={x['id']:x for x in registry['mechanisms']}
for area in expected_areas:
    need(area in registry_by_id,f'specialist evidence area missing from registry: {area}')
    item=registry_by_id[area]
    need(item.get('status')=='provisional',f'{area}: learner UI says provisional but registry status is {item.get("status")}')
    need(item.get('promoted') is False,f'{area}: provisional specialist lesson cannot map to promoted evidence')

for title in [
    'Residual stress, frozen-in orientation & birefringence',
    'Weld-line structural strength versus appearance',
    'Runner, gate & multicavity imbalance diagnosis',
    'Hot-runner actual thermal & mechanical behaviour',
    'Liquid silicone rubber: metering, mixing & cure behaviour',
    'Gas-, water- & projectile-assisted moulding',
    'Surface replication, texture, adhesion & release',
    'Injection-compression & precision optical moulding',
]:
    need(title in js,f'expected specialist evidence-gap topic missing: {title}')

# This layer can extend only the optional specialist export and its own scoped progress.
for forbidden in [
    'CORE.lessons.push(', 'CORE.courses.push(', '.lessonIds.push(',
    'MM_DATA.lessons=', 'MM_DATA.courses=', 'user.completed.push(',
    'certificates.push(', 'examScores=', 'regionalQuestions=', 'question_bank_version=',
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon'
]:
    need(forbidden not in js,f'evidence-gap extension contains forbidden core/assessment mutation or transport: {forbidden}')
need('BASE.lessons.push(' in js,'evidence-gap lessons must surface through the optional specialist export')
need("mm_specialist_evidence_gaps_v1" in js,'separate local storage namespace missing')

# Core is untouched at 120 lessons.
core=text('MouldMaster_Core_App.html')
lesson_count=len(re.findall(r'\{"id":\d+,"course":\d+,"courseName":"',core))
need(lesson_count==120,f'canonical core changed: expected 120 lessons, found {lesson_count}')

# All core links stay inside the canonical range and non-core practices reuse supported base types.
for item_id in re.findall(r"\{type:'core',id:'(\d+)'",js):
    need(1<=int(item_id)<=120,f'evidence-gap core link outside canonical range: {item_id}')
for practice_type in re.findall(r"\{type:'([^']+)'",js):
    need(practice_type in {'core','defects','standards'},f'evidence-gap extension introduced unsupported practice type: {practice_type}')

# Runtime load order, offline cache, desktop packaging and integrity must all carry the extension.
idx=text('index.html')
needle="['./specialist-evidence-gap-extension.js','<script src=\"./specialist-evidence-gap-extension.js\">']"
need(needle in idx,'browser shell does not load specialist evidence-gap extension')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./specialist-evidence-gap-extension.js'") < idx.index("'./mould-master-workspace.js'"),'specialist evidence-gap load order is wrong')

sw=text('service-worker.js')
need("'./specialist-evidence-gap-extension.js'" in sw,'specialist evidence-gap extension missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../specialist-evidence-gap-extension.js' in froms,'specialist evidence-gap extension missing from desktop package')
need("'specialist-evidence-gap-extension.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'specialist evidence-gap extension missing from desktop integrity manifest')

workflow=text(WORKFLOW)
need('node --check specialist-evidence-gap-extension.js' in workflow,'specialist evidence-gap workflow missing JavaScript syntax check')
need('python qa_specialist_evidence_gaps.py' in workflow,'specialist evidence-gap workflow missing QA gate')
need('python qa_evidence_coverage.py' in workflow,'specialist evidence-gap workflow must also verify the evidence registry')

print('MouldMaster specialist evidence-gap QA passed (8 provisional extensions S13-S20; 20 optional specialist lessons total; canonical 120 unchanged)')
