from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

required=[
    'learning-analytics.js','learning-experience.js','diagnostic-learning-labs.js','process-data-diagnostics.js',
    'src/domains/shared/learner-scope.js','src/domains/learning/learning-analytics-loader.js',
    'index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'learning analytics dependency missing: {name}')

js=text('learning-analytics.js')
p=subprocess.run(['node','--check',str(ROOT/'learning-analytics.js')],capture_output=True,text=True)
need(p.returncode==0,'learning-analytics.js syntax error: '+(p.stderr or p.stdout))

for marker in [
    "const VERSION='2026.09.05.2'",
    "const STORAGE_PREFIX='mm_learning_analytics_v1::'",
    'const MAX_EVENTS=1500',
    'const IDLE_MS=5*60*1000',
    'const MIN_EXPORT_PROFILES=5',
    'const learnerScope=window.MM_LEARNER_SCOPE',
    'learnerScope.token()',
    'learnerScope.storageKey(STORAGE_PREFIX,token)',
    "record('lesson_complete'",
    "record('lesson_time'",
    "record('practice_start'",
    "record('practice_miss'",
    "record('practice_complete'",
    "data-dl-choice",
    "data-pd-choice",
    'avgGain',
    'improvedCases',
    'Instructor view · this device only',
    'Cohort aggregate summary',
    'Export cohort aggregate',
    'Clear my analytics',
    'MM_LEARNING_ANALYTICS'
]:
    need(marker in js,f'learning analytics marker missing: {marker}')

scope=text('src/domains/shared/learner-scope.js')
for marker in ['MM_LEARNER_SCOPE','activeId','tokenFor','normalizeToken','storageKey','2166136261','16777619']:
    need(marker in scope,f'shared learner scope marker missing: {marker}')
need('Math.imul' not in js,'learning analytics must not carry a second learner-token hash implementation')

# Privacy boundary: analytics records use a strict allow-list and remain local-only.
need("for(const key of ['module','id','reason'])" in js,'analytics string field allow-list missing')
need("for(const key of ['step','score','durationSec','attempt'])" in js,'analytics numeric field allow-list missing')
need("if(typeof data.correct==='boolean')" in js,'analytics boolean field allow-list missing')
need('slice(-MAX_EVENTS)' in js,'analytics event log must be bounded')
for forbidden_transport in ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon(', 'navigator.sendBeacon']:
    need(forbidden_transport not in js,f'learning analytics must have no network transport: {forbidden_transport}')
for forbidden_personal in ['user.name', 'user.email', 'user.notes', 'lessonNotes.value']:
    need(forbidden_personal not in js,f'learning analytics must not collect personal/free-text data: {forbidden_personal}')
need('no per-profile rows, names, hashed learner tokens' in js,'cohort export privacy declaration missing')
need('profiles:' not in js and 'anonymousProfile:i+1' not in js,'cohort export must not contain per-profile records')
need('tokens.length<MIN_EXPORT_PROFILES' in js,'cohort export must fail closed below the minimum profile threshold')
need("a[a.length-1]-a[0]" in js,'retry gain must compare latest completed attempt with the first attempt')
need('Math.max(...a)-a[0]' not in js,'retry gain must not use best-ever score because that hides later regression')

# Storage failures must be visible rather than silently treated as successful analytics persistence.
for marker in ['setStorageError','analytics-read-failed','analytics-write-failed','analytics-index-read-failed','Analytics storage needs attention.','storageHealth:()=>']:
    need(marker in js,f'analytics storage-health marker missing: {marker}')
need("catch(_){}\n  return emptyStore()" not in js,'analytics storage failures must not be swallowed silently')

# Education and assessment boundary: no formal question, answer-key, scoring or approval mutation.
for forbidden in [
    'MM_DATA.exams=', 'regionalQuestions=', 'MM_EVIDENCE_APPROVAL.records=', 'question_bank_version=',
    'correctIndex=', 'examScores=', 'certificates.push', 'assessmentScore='
]:
    need(forbidden not in js,f'learning analytics must not mutate formal assessment truth: {forbidden}')

# Time-on-task must pause for hidden/idle sessions rather than counting an abandoned open page indefinitely.
need("document.addEventListener('visibilitychange'" in js,'lesson timing must respond to page visibility')
need('idleTimer=setTimeout(pauseLesson,IDLE_MS)' in js,'lesson timing must enforce the five-minute idle cap')
need("window.addEventListener('beforeunload'" in js,'active timing must flush on unload')

idx=text('index.html')
need("['./learning-analytics.js','<script src=\"./learning-analytics.js\">']" not in idx,'learning analytics must not execute before the domain dependency graph is ready')
need(idx.index("'./learning-experience.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'domain bootstrap must remain after learner-flow hooks')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'domain bootstrap must remain after guided process-data practice')

manifest=json.loads(text('runtime-domain-manifest.json'))
assets=manifest.get('assets',[])
need(assets and assets[0]=='./src/domains/shared/learner-scope.js','shared learner scope must load before domain stores')
need(assets.index('./src/domains/shared/learner-scope.js') < assets.index('./src/domains/engineering/engineering-store.js'),'engineering store must load after shared learner scope')
need('./src/domains/learning/learning-analytics-loader.js' in assets,'analytics domain bridge missing from runtime manifest')
need(assets.index('./src/domains/shared/learner-scope.js') < assets.index('./src/domains/learning/learning-analytics-loader.js'),'analytics bridge must load after shared learner scope')

bridge=text('src/domains/learning/learning-analytics-loader.js')
for marker in ['MM_LEARNER_SCOPE','learning-analytics.js','MM_LEARNING_ANALYTICS_LOADING','mmDomainBridge']:
    need(marker in bridge,f'learning analytics domain bridge marker missing: {marker}')

sw=text('service-worker.js')
need("'./learning-analytics.js'" in sw,'learning analytics missing from installed-PWA offline cache')
need("'./src/domains/shared/learner-scope.js'" in sw,'shared learner scope missing from installed-PWA offline cache')
need("'./src/domains/learning/learning-analytics-loader.js'" in sw,'analytics domain bridge missing from installed-PWA offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../learning-analytics.js' in froms,'learning analytics missing from desktop package')
need('../../src/domains' in froms,'shared learner scope is not covered by desktop domain resources')
need("'learning-analytics.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'learning analytics missing from desktop integrity manifest')

print('MouldMaster learning analytics QA passed (shared learner scope, local-only bounded events, latest-vs-first retry gain, visible storage failures, cohort-only minimum-size instructor export)')
