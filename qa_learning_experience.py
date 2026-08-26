from pathlib import Path
import json, subprocess, re

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)
def js_const(source,name):
    m=re.search(rf"const\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]",source)
    need(m is not None,f'missing JavaScript constant {name}')
    return m.group(1)

required=[
    'learning-experience.js','pwa-shell.js','index.html','service-worker.js','desktop/electron/package.json',
    'desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'learning experience dependency missing: {name}')

js=text('learning-experience.js')
p=subprocess.run(['node','--check',str(ROOT/'learning-experience.js')],capture_output=True,text=True)
need(p.returncode==0,'learning-experience.js syntax error: '+(p.stderr or p.stdout))

shell=text('pwa-shell.js')
p=subprocess.run(['node','--check',str(ROOT/'pwa-shell.js')],capture_output=True,text=True)
need(p.returncode==0,'pwa-shell.js syntax error: '+(p.stderr or p.stdout))

markers=[
    "const VERSION='2026.08.26.1'",
    'Complete & continue',
    'Today’s focus',
    'What do you need help with?',
    'Diagnose a moulding problem',
    'Analyse process data',
    'Practice a scenario',
    'Explore your learning',
    'Mould Master · start from the defect',
    'mm-home-task-hub',
    'mm-home-core-hero',
    'mmOpenMouldMaster',
    'mmOpenDataDiagnosis',
    'Notes autosave on this device.',
    'mm-mobile-actions',
    'aria-current',
    'mmLearningJump',
    'mmCompleteAndContinue',
    'mmPreviousLesson',
    'mmNextLesson',
    '650',
    'Lesson ${c.position+1} of ${c.course.lessonIds.length}',
    'Track complete · next track ready'
]
for marker in markers:
    need(marker in js,f'learning experience marker missing: {marker}')

# Home is task-first on small screens: the catalogue-heavy core dashboard is suppressed while
# direct diagnosis, process-data, practice and learning actions remain visible.
for marker in [
    '#dashboard .mm-home-core-hero,#dashboard .mm-home-kpis,#dashboard .mm-home-course-head,#dashboard .mm-home-course-grid{display:none!important}',
    '#dashboard .mm-specialist-strip>p{display:none!important}',
    '.mm-home-actions{grid-template-columns:1fr 1fr',
    '@media(max-width:430px){.mm-home-actions{grid-template-columns:1fr}'
]:
    need(marker in js,f'mobile Home hierarchy marker missing: {marker}')
need("switchView('defects')" in js,'Mould Master Home action must open the evidence-first defect diagnosis view')
need('window.MM_PROCESS_DATA_DIAGNOSTICS?.open' in js,'Home process-data action must use the guided data-diagnosis module')

# Mobile Home must not leave a tall translucent sticky topbar over dashboard cards,
# and scrolling content must reserve enough room for the fixed bottom navigation/safe area.
mobile_markers=[
    'mm-mobile-layout-guard-style',
    'installMobileLayoutGuard',
    'syncVisibleViewChrome',
    '--mm-mobile-nav-clearance:124px',
    'body{padding-bottom:0!important}',
    '.main{padding:16px 16px calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}',
    '.topbar{position:relative!important;top:auto!important',
    '.mobile-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important',
    'body.mm-home-visible #continueBtn{display:none!important}',
    'body.mm-home-visible #searchBtn{flex:0 0 auto!important',
    'scroll-padding-bottom:calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))',
    "window.MM_MOBILE_LAYOUT_GUARD='home-task-first-fixed-nav-clearance-v2'"
]
for marker in mobile_markers:
    need(marker in shell,f'mobile layout regression guard missing: {marker}')
need(shell.index('installMobileLayoutGuard()') < shell.index('dockReferenceLauncher()'),'mobile layout guard must install before shell docking work')
need(shell.index('syncVisibleViewChrome()') < shell.index('dockReferenceLauncher()'),'visible-view chrome sync must run before shell docking work')
need("attributeFilter:['class']" in shell,'mobile Home chrome must react when core views toggle visibility')
need("button.setAttribute('aria-current','page')" in shell,'mobile navigation must expose the active page to assistive technology')

# The UX layer must remain a presentation/progression enhancement, not an assessment rewrite.
for forbidden in ['MM_EVIDENCE_APPROVAL.records=', 'correctIndex=', 'question_bank_version=', 'MM_DATA.exams=', 'regionalQuestions=']:
    need(forbidden not in js,f'learning experience must not mutate assessment truth: {forbidden}')
need('fetch(' not in js,'learning experience must remain local-only and must not upload notes/progress')

idx=text('index.html')
need("['./learning-experience.js','<script src=\"./learning-experience.js\">']" in idx,'browser shell does not load learning-experience.js')
need(idx.index("'./pwa-shell.js'") < idx.index("'./learning-experience.js'"),'learning experience must load after the existing runtime patches')

# Runtime coherence is structural, not a hard-coded feature-bundle token. This lets data modules
# advance the runtime family without creating false learner-UX failures.
sw=text('service-worker.js')
shell_release=js_const(idx,'SHELL_RELEASE')
runtime_asset=js_const(idx,'RUNTIME_ASSET_VERSION')
expected_cache=js_const(idx,'EXPECTED_STATIC_CACHE')
cache_version=js_const(sw,'CACHE_VERSION')
cache_revision=js_const(sw,'CACHE_REVISION')
need(shell_release==cache_version,'learning UX shell release must match PWA cache version')
need(expected_cache==f'mouldmaster-static-{cache_version}-{cache_revision}','learning UX expected cache must match service-worker cache identity')
need(runtime_asset[:8]==''.join(cache_version.split('.')[:3]),'learning UX runtime date must align with PWA release date')
need(runtime_asset.split('-',1)[1]==re.sub(r'-\d{8}$','',cache_revision),'learning UX runtime family must match PWA cache family')
need("'./learning-experience.js'" in sw,'learning experience missing from offline cache')
need("'./pwa-shell.js'" in sw,'PWA shell/mobile layout guard missing from offline cache')
need("url.pathname.endsWith('.js')" in sw,'PWA shell must remain on the network-first runtime-critical path so installed apps receive mobile layout fixes')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../learning-experience.js' in froms,'learning experience missing from desktop package')
need('../../pwa-shell.js' in froms,'PWA shell missing from desktop package')
need("'learning-experience.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'learning experience missing from desktop integrity manifest')
need("'pwa-shell.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'PWA shell missing from desktop integrity manifest')

# Guard the learner-flow intent itself: completion advances to the next canonical lesson,
# while the final lesson remains completed without wrapping to lesson 1.
need(re.search(r"const next=D\.lessons\[index\+1\]\|\|null",js) is not None,'complete-and-continue must use canonical next lesson')
need("user.currentLesson=next.id" in js,'complete-and-continue must advance currentLesson')
need("toast('Learning path complete ✓')" in js,'final lesson must terminate the learning path rather than wrap')

print(f'MouldMaster learning experience QA passed (task-first Home, evidence-first diagnosis/data access, compact mobile hierarchy, complete-and-continue, autosave notes, fixed-nav clearance, coherent runtime={runtime_asset}, offline/desktop packaging)')
