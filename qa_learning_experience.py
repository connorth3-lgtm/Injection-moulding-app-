from pathlib import Path
import json, subprocess, re

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

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

# Mobile Home must not leave a tall translucent sticky topbar over dashboard cards,
# and scrolling content must reserve enough room for the fixed bottom navigation/safe area.
mobile_markers=[
    'mm-mobile-layout-guard-style',
    'installMobileLayoutGuard',
    'body{padding-bottom:0!important}',
    '.main{padding:16px 16px calc(124px + env(safe-area-inset-bottom))!important}',
    '.topbar{position:relative!important;top:auto!important',
    '.mobile-nav{background:#07101c!important',
    '0 80px 0 #07101c!important',
    'scroll-padding-bottom:calc(124px + env(safe-area-inset-bottom))',
    "window.MM_MOBILE_LAYOUT_GUARD='home-static-header-bottom-nav-clearance-v1'"
]
for marker in mobile_markers:
    need(marker in shell,f'mobile layout regression guard missing: {marker}')
need(shell.index('installMobileLayoutGuard()') < shell.index('dockReferenceLauncher()'),'mobile layout guard must install before shell docking work')

# The UX layer must remain a presentation/progression enhancement, not an assessment rewrite.
for forbidden in ['MM_EVIDENCE_APPROVAL.records=', 'correctIndex=', 'question_bank_version=', 'MM_DATA.exams=', 'regionalQuestions=']:
    need(forbidden not in js,f'learning experience must not mutate assessment truth: {forbidden}')
need('fetch(' not in js,'learning experience must remain local-only and must not upload notes/progress')

idx=text('index.html')
need("['./learning-experience.js','<script src=\"./learning-experience.js\">']" in idx,'browser shell does not load learning-experience.js')
need(idx.index("'./pwa-shell.js'") < idx.index("'./learning-experience.js'"),'learning experience must load after the existing runtime patches')
need('20260826.4-curriculum-release-parity' in idx,'learning UX must stay on the current coherent runtime token')
need('mouldmaster-static-2026.08.26.1-curriculum-release-parity-20260826' in idx,'browser expected-cache token drifted from the current coherent runtime')

sw=text('service-worker.js')
need("const CACHE_REVISION='curriculum-release-parity-20260826'" in sw,'service-worker cache revision drifted from the current coherent runtime')
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

print('MouldMaster learning experience QA passed (progress context, complete-and-continue, autosave notes, mobile actions, Home header/nav clearance, coherent offline/desktop packaging)')
