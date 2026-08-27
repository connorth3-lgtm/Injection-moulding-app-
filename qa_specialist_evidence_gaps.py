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
FINALIZER='app-shell-finalize.js'
REGISTRY='data/evidence-coverage-v1.json'
WORKFLOW='.github/workflows/specialist-evidence-gaps.yml'
required=[JS,FINALIZER,'specialist-curriculum.js','MouldMaster_Core_App.html','index.html','service-worker.js',REGISTRY,'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs',WORKFLOW]
for name in required:text(name)

js=text(JS)
finalizer=text(FINALIZER)
for asset in [JS,FINALIZER]:
    p=subprocess.run(['node','--check',str(ROOT/asset)],capture_output=True,text=True)
    need(p.returncode==0,asset+' syntax error: '+(p.stderr or p.stdout))

need("const VERSION='2026.08.28.1'" in js,'evidence-gap extension version marker missing')
need("CORE.lessons.length!==120" in js,'extension must lock to canonical 120 lessons')
need("BASE.lessons.length!==12" in js,'extension must build on the established 12 specialist lessons')
need('20 optional extensions' in js and '20 optional lessons' in js,'combined specialist count must be explicit')
need('Evidence status:' in js and ('not promoted evidence' in js or 'not promoted' in js),'conservative fallback evidence boundary missing from learner UI')
need('does not alter the canonical 120 lessons' in js,'canonical-path boundary missing')

ids=re.findall(r"\bid:'(S\d{2})',title:",js)
need(ids==[f'S{i:02d}' for i in range(13,21)],f'expected contiguous S13-S20, found {ids}')
need(len(set(ids))==8,'evidence-gap specialist IDs must be unique')
need(js.count("evidenceStatus:'Provisional'")==8,'base evidence-gap module must retain eight conservative provisional fallback states')
need(js.count('objectives:[')==8,'every evidence-gap lesson must define objectives')
need(js.count('keypoints:[')==8,'every evidence-gap lesson must define engineering keypoints')
need(js.count('evidenceTask:')==8,'every evidence-gap lesson must define an evidence task')
need(js.count('practices:[')==8,'every evidence-gap lesson must link to established formative practice')

expected_areas=['residual-stress-birefringence','weld-line-mechanical-strength','runner-gate-multicavity-imbalance','hot-runner-actual-behaviour','liquid-silicone-rubber','fluid-assisted-moulding','surface-replication-release','injection-compression-precision-optics']
areas=re.findall(r"evidenceArea:'([^']+)'",js)
need(areas==expected_areas,f'evidence-gap registry mapping changed unexpectedly: {areas}')

registry=json.loads(text(REGISTRY))
registry_by_id={x['id']:x for x in registry['mechanisms']}
for area in expected_areas:need(area in registry_by_id,f'specialist evidence area missing from registry: {area}')

m=re.search(r"const EVIDENCE_STATUS=Object\.freeze\(\{(.*?)\}\);",finalizer,re.S)
need(m is not None,'app-shell finalizer evidence-status bridge missing')
status_map=dict(re.findall(r"'([^']+)':'(Promoted|Provisional|Gap)'",m.group(1)))
need(list(status_map)==expected_areas,f'evidence-status bridge areas/order changed: {list(status_map)}')
for area,label in status_map.items():
    item=registry_by_id[area]
    need(label.lower()==item.get('status'),f'{area}: specialist badge {label} disagrees with registry status {item.get("status")}')
    need((label=='Promoted')==bool(item.get('promoted')),f'{area}: promoted boolean disagrees with specialist badge')
need('MM_SPECIALIST_EVIDENCE_STATUS' in finalizer,'specialist evidence status export missing')
need('publisher-verified primary measured studies' in finalizer,'promoted UI must retain evidence boundary')
need('study-specific settings remain bounded' in finalizer,'promoted UI must retain no-universal-recipe boundary')
need('fetch(' not in finalizer and 'XMLHttpRequest' not in finalizer and 'sendBeacon' not in finalizer,'evidence status bridge must not add network transport')

for title in ['Residual stress, frozen-in orientation & birefringence','Weld-line structural strength versus appearance','Runner, gate & multicavity imbalance diagnosis','Hot-runner actual thermal & mechanical behaviour','Liquid silicone rubber: metering, mixing & cure behaviour','Gas-, water- & projectile-assisted moulding','Surface replication, texture, adhesion & release','Injection-compression & precision optical moulding']:
    need(title in js,f'expected specialist evidence-gap topic missing: {title}')

for forbidden in ['CORE.lessons.push(', 'CORE.courses.push(', '.lessonIds.push(', 'MM_DATA.lessons=', 'MM_DATA.courses=', 'user.completed.push(', 'certificates.push(', 'examScores=', 'regionalQuestions=', 'question_bank_version=', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon']:
    need(forbidden not in js,f'evidence-gap extension contains forbidden core/assessment mutation or transport: {forbidden}')
need('BASE.lessons.push(' in js,'evidence-gap lessons must surface through the optional specialist export')
need("mm_specialist_evidence_gaps_v1" in js,'separate local storage namespace missing')

core=text('MouldMaster_Core_App.html')
lesson_count=len(re.findall(r'\{"id":\d+,"course":\d+,"courseName":"',core))
need(lesson_count==120,f'canonical core changed: expected 120 lessons, found {lesson_count}')
for item_id in re.findall(r"\{type:'core',id:'(\d+)'",js):need(1<=int(item_id)<=120,f'evidence-gap core link outside canonical range: {item_id}')
for practice_type in re.findall(r"\{type:'([^']+)'",js):need(practice_type in {'core','defects','standards'},f'evidence-gap extension introduced unsupported practice type: {practice_type}')

idx=text('index.html')
needle="['./specialist-evidence-gap-extension.js','<script src=\"./specialist-evidence-gap-extension.js\">']"
need(needle in idx,'browser shell does not load specialist evidence-gap extension')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./specialist-evidence-gap-extension.js'") < idx.index("'./mould-master-workspace.js'") < idx.index("'./app-shell-finalize.js'"),'specialist evidence-gap/finalizer load order is wrong')
sw=text('service-worker.js');need("'./specialist-evidence-gap-extension.js'" in sw,'specialist evidence-gap extension missing from offline cache');need("'./app-shell-finalize.js'" in sw,'evidence-status finalizer missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)};need('../../specialist-evidence-gap-extension.js' in froms,'specialist evidence-gap extension missing from desktop package');need('../../app-shell-finalize.js' in froms,'evidence-status finalizer missing from desktop package')
integrity=text('desktop/electron/scripts/generate-integrity.cjs');need("'specialist-evidence-gap-extension.js'" in integrity and "'app-shell-finalize.js'" in integrity,'specialist evidence assets missing from desktop integrity manifest')
workflow=text(WORKFLOW);need('node --check specialist-evidence-gap-extension.js' in workflow,'specialist evidence-gap workflow missing JavaScript syntax check');need('python qa_specialist_evidence_gaps.py' in workflow,'specialist evidence-gap workflow missing QA gate');need('python qa_evidence_coverage.py' in workflow,'specialist evidence-gap workflow must also verify the evidence registry')

promoted=sum(1 for a in expected_areas if registry_by_id[a]['status']=='promoted')
print(f'MouldMaster specialist evidence-gap QA passed (8 extensions S13-S20; {promoted} promoted evidence lessons; {8-promoted} provisional; canonical 120 unchanged)')
