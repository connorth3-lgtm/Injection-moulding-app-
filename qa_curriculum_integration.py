from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent


def text(name):
    p=ROOT/name
    if not p.exists():
        raise AssertionError(f'curriculum integration dependency missing: {name}')
    return p.read_text(encoding='utf-8')


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

required=[
    'curriculum-integration.js','learning-experience.js','diagnostic-learning-labs.js',
    'material-behaviour-labs.js','process-data-diagnostics.js','evidence-maturity-deep-dive.js',
    'MouldMaster_Core_App.html','index.html','service-worker.js','desktop/electron/package.json',
    'desktop/electron/scripts/generate-integrity.cjs','.github/workflows/qa.yml',
    '.github/workflows/open-desktop-build.yml','.github/workflows/publish-open-desktop.yml',
    '.github/workflows/microsoft-store-msix.yml'
]
for name in required:
    text(name)

js=text('curriculum-integration.js')
p=subprocess.run(['node','--check',str(ROOT/'curriculum-integration.js')],capture_output=True,text=True)
need(p.returncode==0,'curriculum-integration.js syntax error: '+(p.stderr or p.stdout))

for marker in [
    "const VERSION='2026.08.26.1'",
    'Theory → practice → evidence',
    'Apply this lesson',
    '2 linked activities',
    'mmCurriculumOpen',
    'mmCurriculumReturn',
    'const COURSE_FALLBACKS=Object.freeze',
    'validateCoverage()',
    "D.lessons.length!==120",
    'Lesson ${lesson.id} does not have two valid curriculum practice connections',
    'curriculum_practice_open',
    'Learning boundary:',
    'optional formative learning',
    'does not change formal assessment answers',
    'no formal assessment mutation and no production recipe'
]:
    need(marker in js,f'curriculum integration marker missing: {marker}')

# The integration must remain a local formative navigation layer, not a new data or assessment authority.
for forbidden in [
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon',
    'MM_DATA.exams=', 'regionalQuestions=', 'correctIndex=', 'question_bank_version=',
    'MM_EVIDENCE_APPROVAL.records=', 'examScores=', 'certificates.push', 'assessmentScore='
]:
    need(forbidden not in js,f'curriculum integration contains forbidden mutation/transport: {forbidden}')

# Canonical curriculum still has 120 lessons / 12 tracks, and the integration explicitly covers each track.
core=text('MouldMaster_Core_App.html')
lesson_count=len(re.findall(r'\{"id":\d+,"course":\d+,"courseName":"',core))
need(lesson_count==120,f'expected 120 canonical lessons, found {lesson_count}')
for course in range(1,13):
    need(re.search(rf'^\s*{course}:\[\{{type:',js,re.M) is not None,f'course {course} missing curriculum fallback pair')

# Every route must point to a real existing formative activity.
routes=re.findall(r"\{type:'(diagnostic|data|material)',id:'([^']+)'",js)
need(len(routes)>=29,f'expected broad curriculum route library, found {len(routes)} entries')
diag=text('diagnostic-learning-labs.js')
material=text('material-behaviour-labs.js')
evidence=text('evidence-maturity-deep-dive.js')
for kind,item_id in routes:
    source={'diagnostic':diag,'material':material,'data':evidence}[kind]
    need(f"'{item_id}'" in source,f'curriculum route missing source activity: {kind}:{item_id}')

# Browser order: all practice modules and learner experience exist before integration;
# analytics loads after it so curriculum-opening events can be recorded locally.
idx=text('index.html')
need("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'" in idx,'browser shell does not load curriculum workspace runtime pack')
need('/* >>> curriculum-integration.js */' in text('src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'),'curriculum integration missing from curriculum workspace pack')
need(idx.index("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'") < idx.index("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'"),'curriculum workspace must load after learner/process diagnostics pack')
need(idx.index("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'") < idx.index("'./app-shell-finalize.js'"),'curriculum workspace pack must load before shell finalization')
need("const DOMAIN_DELEGATED_ASSETS=['./learning-analytics.js','./accessibility-hardening.js']" in idx,'learning analytics must remain a delegated domain asset')
need('./learning-analytics.js' in idx,'learning analytics delegated asset missing from browser shell')

sw=text('service-worker.js')
need("'./curriculum-integration.js'" in sw,'curriculum integration missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../curriculum-integration.js' in froms,'curriculum integration missing from desktop package')
need("'curriculum-integration.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'curriculum integration missing from desktop integrity manifest')

qa=text('.github/workflows/qa.yml')
need("find . -maxdepth 1 -type f -name '*.js' -print0 | sort -z | xargs -0 -n1 node --check" in qa,'Release QA missing filesystem JavaScript syntax gate')
need('python qa_curriculum_integration.py' in qa,'Release QA missing curriculum integration gate')

win=text('.github/workflows/open-desktop-build.yml')
need("- 'curriculum-integration.js'" in win,'Windows build path filter missing curriculum asset')
need("- 'qa_curriculum_integration.py'" in win,'Windows build path filter missing curriculum QA')
need('python qa_curriculum_integration.py' in win,'Windows build missing curriculum QA step')

publisher=text('.github/workflows/publish-open-desktop.yml')
need('node --check curriculum-integration.js' in publisher,'desktop publisher missing curriculum JavaScript syntax gate')
need('python qa_curriculum_integration.py' in publisher,'desktop publisher missing curriculum integration gate')

store=text('.github/workflows/microsoft-store-msix.yml')
need('python qa_curriculum_integration.py' in store,'Microsoft Store workflow missing curriculum integration gate')

print('MouldMaster curriculum integration QA passed (120 lessons linked to valid formative diagnostic/material/data practice, return-to-lesson flow, offline/desktop/release gates)')