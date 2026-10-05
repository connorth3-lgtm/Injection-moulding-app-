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
    'learning-experience.js','src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js','src/domains/shell/pwa-shell.js','index.html','service-worker.js','desktop/electron/package.json',
    'desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'learning experience dependency missing: {name}')

js=text('learning-experience.js')
for marker in ["const durable=persist()", "status.textContent=durable?'Saved':'Session only'", "status.dataset.state=durable?'saved':'session-only'", "return durable"]:
    need(marker in js,f'lesson note autosave durability marker missing: {marker}')
learning_pack=text('src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js')
p=subprocess.run(['node','--check',str(ROOT/'learning-experience.js')],capture_output=True,text=True)
need(p.returncode==0,'learning-experience.js syntax error: '+(p.stderr or p.stdout))

shell=text('src/domains/shell/pwa-shell.js')
p=subprocess.run(['node','--check',str(ROOT/'src/domains/shell/pwa-shell.js')],capture_output=True,text=True)
need(p.returncode==0,'src/domains/shell/pwa-shell.js syntax error: '+(p.stderr or p.stdout))

markers=[
    "const VERSION='2026.09.10.3'",
    'Complete & continue',
    'Today’s focus',
    'data-mm-role="today-focus"',
    'data-mm-role="continue-lesson"',
    'mm-home-core-hero',
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

# Home source owns only the primary next-lesson surface. Workbench shortcuts are
# owned by learner-ui-polish; retired task/utility blocks must not be generated and
# cleaned up later by downstream shell layers.
for retired in [
    'mm-home-task-hub',
    'mm-home-utility',
    'mm-home-actions',
    'mm-home-action',
    'data-mm-role="task-hub"',
    'data-mm-role="diagnose-defect"',
    'data-mm-role="process-data"',
    'data-mm-role="practice-scenario"',
    'data-mm-role="explore-learning"',
]:
    need(retired not in js,f'retired Home source returned: {retired}')

# Small-screen Home still suppresses catalogue-heavy legacy dashboard surfaces;
# the canonical Workbench is supplied later by learner-ui-polish.
for marker in [
    '#dashboard .mm-home-core-hero,#dashboard .mm-home-kpis,#dashboard .mm-home-course-head,#dashboard .mm-home-course-grid{display:none!important}',
    '#dashboard .mm-specialist-strip>p{display:none!important}',
]:
    need(marker in js,f'mobile Home hierarchy marker missing: {marker}')

# Mobile Home keeps a compact non-sticky topbar and enough fixed-nav/safe-area clearance
# without the previous oversized dead space. Touch targets stay at least 44px.
mobile_shell_markers=[
    'syncVisibleViewChrome',
    "window.MM_UI_POLISH='compact-shell-no-gamification-v1'"
]
for marker in mobile_shell_markers:
    need(marker in shell,f'mobile shell behavior guard missing: {marker}')
need('document.createElement(\'style\')' not in shell,'PWA shell must not inject presentation styles at runtime')
need('mm-mobile-layout-guard-style' not in shell,'legacy runtime mobile style element must remain retired')
ui_shell=text('ui-shell.css')
mobile_style_markers=[
    ':root{--mm-mobile-nav-clearance:104px}',
    'scroll-padding-bottom:calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))',
    'body{padding-bottom:0!important}',
    '.main{padding:12px 12px calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}',
    '.topbar{position:relative!important;top:auto!important',
    '.mobile-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important',
    '.mobile-nav button{min-height:52px!important',
    '#app .top-actions #continueBtn{display:none!important}'
]
for marker in mobile_style_markers:
    need(marker in ui_shell,f'canonical ui-shell mobile presentation marker missing: {marker}')
need('mm-mobile-layout-guard-style' not in ui_shell,'canonical ui-shell must not depend on a runtime style element id')
need('installMobileLayoutGuard' not in shell and 'MM_MOBILE_LAYOUT_GUARD' not in shell,'retired presentation guard must not return to PWA behavior runtime')
for marker in ['.mmsrc.mm-reference-drawer{','.mmrd.mm-reference-data-drawer{']:
    need(marker in ui_shell,f'reference drawer presentation missing from canonical ui-shell: {marker}')
need('mm-reference-drawer-style' not in shell and 'mm-reference-data-drawer-style' not in shell,'reference drawers must not inject runtime styles')
need(shell.index('syncVisibleViewChrome()') < shell.index('dockReferenceLauncher()'),'visible-view chrome sync must run before shell docking work')
need("shell?.events?.onViewChange?.(scheduleSync)" in shell,'mobile Home chrome must react through canonical app-shell view lifecycle events')
need("shell?.events?.onRender?.(view,scheduleSync)" in shell,'mobile Home chrome must react when canonical views render')
need('new MutationObserver' not in shell,'mobile Home chrome must not depend on document-wide mutation polling')
need("button.setAttribute('aria-current','page')" in shell,'mobile navigation must expose the active page to assistive technology')

# Learner-facing gamification is retired without deleting normal completion bookkeeping.
for marker in [
    'rewardWithoutGamification',
    'window.awardXP=rewardWithoutGamification',
    'window.checkAchievements=function(){return []}',
    "window.achievementsHTML=function(){return ''}",
    'TODAY\'S PRACTICE',
    'scrubLegacyGamification',
    '#xpPop,.xp-pop,.achievement-grid,.fun-settings,.fun-dashboard .level-card,#profileMini .fun-hud',
    "window.MM_GAMIFICATION_MODE='retired'"
]:
    need(marker in shell,f'gamification retirement marker missing: {marker}')
need('+40 XP' not in shell,'daily practice must not advertise an XP reward after gamification retirement')
need('f.rewarded[key]=Date.now()' in shell,'gamification retirement must preserve keyed completion bookkeeping')
need('if(f.xp!==0){f.xp=0;changed=true}' in shell,'legacy XP state must be retired from active learner profiles')
need('if(Array.isArray(f.achievements)&&f.achievements.length){f.achievements=[];changed=true}' in shell,'legacy achievement state must be retired from active learner profiles')

# The UX layer must remain a presentation/progression enhancement, not an assessment rewrite.
for forbidden in ['MM_EVIDENCE_APPROVAL.records=', 'correctIndex=', 'question_bank_version=', 'MM_DATA.exams=', 'regionalQuestions=']:
    need(forbidden not in js,f'learning experience must not mutate assessment truth: {forbidden}')
need('fetch(' not in js,'learning experience must remain local-only and must not upload notes/progress')

idx=text('index.html')
need("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'" in idx,'browser shell does not load learning/process diagnostics runtime pack')
need('/* >>> learning-experience.js */' in text('src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'),'learning experience missing from learning/process runtime pack')
need(idx.index("'./src/domains/shell/pwa-shell.js'") < idx.index("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'"),'learning/process runtime pack must load after the existing runtime patches')

# Runtime coherence is structural. Browser/runtime asset identity derives from the canonical
# web release, while CACHE_REVISION remains an independent invalidation token.
sw=text('service-worker.js')
shell_release=js_const(idx,'SHELL_RELEASE')
runtime_asset=shell_release
expected_cache=js_const(idx,'EXPECTED_STATIC_CACHE')
cache_version=js_const(sw,'CACHE_VERSION')
cache_revision=js_const(sw,'CACHE_REVISION')
need(re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+',shell_release) is not None,'learning UX web release must use YYYY.MM.DD.N')
need('const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in idx,'learning UX runtime identity must derive from canonical shell/web release')
need(shell_release==cache_version,'learning UX shell release must match PWA cache version')
need(bool(cache_revision.strip()),'learning UX cache revision must remain an explicit independent invalidation token')
need(expected_cache==f'mouldmaster-static-{cache_version}-{cache_revision}','learning UX expected cache must match service-worker cache identity')
need("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'" in sw,'learning/process runtime pack missing from offline cache')
need('/* >>> learning-experience.js */' in learning_pack,'learning experience missing from packed offline runtime')
need("'./src/domains/shell/pwa-shell.js'" in sw,'PWA shell/mobile layout guard missing from offline cache')
need("url.pathname.endsWith('.js')" in sw,'PWA shell must remain on the network-first runtime-critical path so installed apps receive mobile layout fixes')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../learning-experience.js' in froms,'learning experience missing from desktop package')
need('../../src/domains' in froms,'recursive domain runtime tree missing from desktop package')
need("'learning-experience.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'learning experience missing from desktop integrity manifest')
need("'src/domains/shell/pwa-shell.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'PWA shell missing from desktop integrity manifest')

# Guard the learner-flow intent itself: completion advances to the next canonical lesson,
# while the final lesson remains completed without wrapping to lesson 1.
need(re.search(r"const next=D\.lessons\[index\+1\]\|\|null",js) is not None,'complete-and-continue must use canonical next lesson')
need("user.currentLesson=next.id" in js,'complete-and-continue must advance currentLesson')
need("toast('Learning path complete ✓')" in js,'final lesson must terminate the learning path rather than wrap')

print(f'MouldMaster learning experience QA passed (single-source Home focus, gamification retired, compact event-driven mobile hierarchy, complete-and-continue, autosave notes, fixed-nav clearance, coherent runtime={runtime_asset}, offline/desktop packaging)')