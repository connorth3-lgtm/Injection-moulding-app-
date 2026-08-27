from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parent

def text(name):
    p=ROOT/name
    if not p.exists():
        raise AssertionError(f'specialist curriculum dependency missing: {name}')
    return p.read_text(encoding='utf-8')

def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

required=[
    'specialist-curriculum.js','specialist-evidence-gap-extension.js','app-shell-finalize.js',
    'MouldMaster_Core_App.html','index.html','service-worker.js',
    'process-data-diagnostics.js','evidence-maturity-deep-dive.js','material-behaviour-labs.js',
    'data/evidence-coverage-v1.json','qa_evidence_coverage.py','qa_mechanism_promotion.py','qa_specialist_evidence_gaps.py',
    'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs',
    '.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml',
    '.github/workflows/publish-open-desktop.yml','.github/workflows/microsoft-store-msix.yml'
]
for name in required: text(name)

js=text('specialist-curriculum.js')
p=subprocess.run(['node','--check',str(ROOT/'specialist-curriculum.js')],capture_output=True,text=True)
need(p.returncode==0,'specialist-curriculum.js syntax error: '+(p.stderr or p.stdout))

for marker in [
    "const VERSION='2026.08.26.1'",
    "const STORAGE_BASE='mm_specialist_curriculum_v1'",
    "CORE.lessons.length!==120",
    'Optional specialist learning',
    '120 core lessons unchanged',
    'Gap this closes',
    'Evidence task',
    'Apply the extension',
    'outside the canonical 120-lesson completion path',
    'do not change formal assessment answers or certificate requirements',
    'not production recipes or machine-specific authorisation',
    'MM_SPECIALIST_CURRICULUM'
]:
    need(marker in js,f'specialist curriculum marker missing: {marker}')

for forbidden in [
    'CORE.lessons.push(', 'CORE.courses.push(', '.lessonIds.push(',
    'MM_DATA.lessons=', 'MM_DATA.courses=', 'user.completed.push(',
    'certificates.push(', 'examScores=', 'regionalQuestions=', 'question_bank_version=',
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon'
]:
    need(forbidden not in js,f'specialist curriculum contains forbidden mutation/transport: {forbidden}')

core=text('MouldMaster_Core_App.html')
lesson_count=len(re.findall(r'\{"id":\d+,"course":\d+,"courseName":"',core))
need(lesson_count==120,f'canonical core changed: expected 120 lessons, found {lesson_count}')
course_blocks=re.findall(r'"lessonIds":\[([^\]]+)\]',core)
need(len(course_blocks)>=12,'could not find 12 canonical course lesson lists')
for i,block in enumerate(course_blocks[:12],1):
    ids=[x for x in block.split(',') if x.strip()]
    need(len(ids)==10,f'canonical course {i} no longer contains exactly 10 lessons')

specialist_ids=re.findall(r"\bid:'(S\d{2})',title:",js)
need(len(specialist_ids)==12,f'expected 12 specialist extensions, found {len(specialist_ids)}')
need(len(set(specialist_ids))==12,'specialist IDs must be unique')
need(specialist_ids==[f'S{i:02d}' for i in range(1,13)],f'specialist IDs must be contiguous S01-S12: {specialist_ids}')
need(js.count('objectives:[')==12,'every specialist extension must define objectives')
need(js.count('keypoints:[')==12,'every specialist extension must define key engineering points')
need(js.count('evidenceTask:')==12,'every specialist extension must define an evidence task')
need(js.count('practices:[')==12,'every specialist extension must link to formative practice')

for title in [
    'Hazardous-energy intervention, isolation & stored energy',
    'Clamp force, projected area & mould-opening risk',
    'Plasticising controls: back pressure, screw speed, decompression & recovery',
    'Reinforced polymers: fibre orientation, anisotropy & conditioning',
    'Purging, contamination & material compatibility',
    'Internal defects: voids, delamination & hidden failure modes',
    'SPC, control charts & reaction plans',
    'Gage R&R, MSA & measurement uncertainty',
    'Sequential and valve-gate timing',
    'Screw/barrel wear & plasticising-system health',
    'Ejector/tool condition, drag & release evidence',
    'Sustainable processing: energy base load & recycled-feedstock variability'
]:
    need(title in js,f'expected gap-driven specialist topic missing: {title}')

data_src=text('process-data-diagnostics.js')+'\n'+text('evidence-maturity-deep-dive.js')
material_src=text('material-behaviour-labs.js')
for item_id in re.findall(r"\{type:'data',id:'([^']+)'",js):
    need(item_id in data_src,f'specialist data practice is not canonical: {item_id}')
for item_id in re.findall(r"\{type:'material',id:'([^']+)'",js):
    need(item_id in material_src,f'specialist material practice is not canonical: {item_id}')
for item_id in re.findall(r"\{type:'core',id:'(\d+)'",js):
    need(1<=int(item_id)<=120,f'specialist core link outside canonical range: {item_id}')
need("data-view=\"defects\"" in core,'Defect Finder target missing for specialist internal-defect practice')
need("data-view=\"standards\"" in core,'Standards & safety target missing for specialist safety practice')

need('localStorage.getItem(storageKey())' in js and 'localStorage.setItem(storageKey()' in js,'specialist local completion storage missing')
need('mm_specialist_curriculum_v1' in js,'specialist storage namespace missing')
need('Mark specialist lesson complete' in js,'specialist completion UI missing')

idx=text('index.html')
needle="['./specialist-curriculum.js','<script src=\"./specialist-curriculum.js\">']"
need(needle in idx,'browser shell does not load specialist-curriculum.js')
need(idx.index("'./curriculum-integration.js'") < idx.index("'./specialist-curriculum.js'"),'specialist curriculum must load after core curriculum integration')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./learning-analytics.js'"),'learning analytics must load after specialist curriculum')

sw=text('service-worker.js')
need("'./specialist-curriculum.js'" in sw,'specialist curriculum missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../specialist-curriculum.js' in froms,'specialist curriculum missing from desktop package')
need("'specialist-curriculum.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'specialist curriculum missing from desktop integrity manifest')

qa=text('.github/workflows/qa.yml')
need('node --check specialist-curriculum.js' in qa,'Release QA missing specialist JavaScript syntax gate')
need('python qa_specialist_curriculum.py' in qa,'Release QA missing specialist curriculum gate')

win=text('.github/workflows/open-desktop-build.yml')
need("- 'specialist-curriculum.js'" in win,'Windows build path filter missing specialist asset')
need("- 'specialist-evidence-gap-extension.js'" in win,'Windows build path filter missing evidence-gap specialist asset')
need("- 'qa_specialist_curriculum.py'" in win,'Windows build path filter missing specialist QA')
need("- 'qa_specialist_evidence_gaps.py'" in win,'Windows build path filter missing evidence-gap specialist QA')
need('python qa_specialist_curriculum.py' in win,'Windows build missing specialist QA step')

publisher=text('.github/workflows/publish-open-desktop.yml')
need('node --check specialist-curriculum.js' in publisher,'desktop publisher missing specialist JavaScript syntax gate')
need('python qa_specialist_curriculum.py' in publisher,'desktop publisher missing specialist curriculum gate')

store=text('.github/workflows/microsoft-store-msix.yml')
need('python qa_specialist_curriculum.py' in store,'Microsoft Store workflow missing specialist curriculum gate')

for script in ['qa_evidence_coverage.py','qa_mechanism_promotion.py','qa_specialist_evidence_gaps.py']:
    run=subprocess.run([sys.executable,str(ROOT/script)],capture_output=True,text=True)
    need(run.returncode==0,f'{script} failed through specialist release integration:\n{run.stdout}\n{run.stderr}')

print('MouldMaster specialist curriculum QA passed (120 core unchanged; 12 base + 8 evidence-gap optional lessons; evidence coverage/promotion/status governance integrated)')
