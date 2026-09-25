from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent

def text(name):
    p=ROOT/name
    if not p.exists(): raise AssertionError(f'app shell dependency missing: {name}')
    return p.read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

required=['app-shell-registry.js','app-shell-finalize.js','mould-master-workspace.js','index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','qa/mobile-viewport.spec.js']
for name in required: text(name)
for js in ['app-shell-registry.js','app-shell-finalize.js','mould-master-workspace.js']:
    p=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    need(p.returncode==0,f'{js} syntax error: '+(p.stderr or p.stdout))

shell=text('app-shell-registry.js')
for marker in [
    "const VERSION='2026.08.26.4'",
    'dashboardSections=new Map()',
    'navigationItems=new Map()',
    'registerDashboard',
    'registerNavigation',
    'composeDashboard',
    'queueDashboardCompose',
    'existingDashboardSlot',
    'releaseDashboardSlot',
    'dashboardComposeQueued',
    'mobileNavNormalizing',
    'requestCompose:queueDashboardCompose',
    'syncDesktopNavigation',
    'populateMobileMore',
    "id:'today-focus'",
    "id:'task-hub'",
    "id:'curriculum-focus'",
    "id:'specialist'",
    "id:'mould-master'",
    "id:'diagnostic-labs'",
    "id:'process-data'",
    "id:'material-labs'",
    "id:'learning-insights'", "id:'repair-app-files'", "./repair.html", "location.reload()", "Electron",
    '--mm-mobile-nav-height',
    '--mm-mobile-content-clearance',
    'data-mm-onclick*=\"openMobileMenu\"',
    'aria-current',
    'visibleCoreView',
    "navigationItems.get(activeCustomId)",
    'captured.renderDashboard',
    'captured.renderLesson',
    'captured.switchView',
    'captured.openMobileMenu',
    'MM_LEARNING_EXPERIENCE?.decorateDashboard',
    'MM_LEARNING_EXPERIENCE?.decorateLesson',
    'MM_CURRICULUM_INTEGRATION',
    'MM_SPECIALIST_CURRICULUM',
    'window.__MM_DIAGNOSTIC_MORE_PATCH__=true',
    'window.__MM_PROCESS_DATA_MORE_PATCH__=true',
    'window.__MM_MATERIAL_MORE_PATCH__=true',
    'window.__MM_LEARNING_INSIGHTS_MORE__=true'
]: need(marker in shell,f'app shell marker missing: {marker}')

# Late registration must trigger deterministic composition without clearing/adopting the same nodes repeatedly.
need('if(!finalized||dashboardComposeQueued)return' in shell,'late dashboard registration is not safely queued after finalization')
need("if(slot.dataset.mmDashboardAdopt==='1')" in shell,'adopted dashboard nodes are not preserved when a slot is released')
need("for(const slot of [...root.querySelectorAll('.mm-dashboard-slot')])" in shell,'dashboard composition is not reconciling existing slots')
need("before.innerHTML=''" not in shell and "after.innerHTML=''" not in shell,'dashboard composition still clears registry hosts destructively')
need("if(!nav||mobileNavNormalizing)return" in shell,'mobile navigation normalization lacks a re-entry guard')
need("b.setAttribute('aria-label',item.label||item.id)" in shell,'registry-generated navigation controls must be labelled at source')
need('aria-hidden="true"' in shell,'decorative registry navigation icons must be hidden from assistive technology')
need("button.getAttribute('data-mm-onclick')" in shell,'canonical More-button detection must retain retired inline-handler compatibility')
need("document.createElement('style')" not in shell,'canonical app-shell registry must not inject presentation styles at runtime')
need('mm-app-shell-registry-style' not in shell,'retired app-shell runtime style element must not return')
ui_shell=text('ui-shell.css')
for marker in ['--mm-mobile-nav-height:calc(70px + env(safe-area-inset-bottom))','--mm-mobile-content-clearance:calc(var(--mm-mobile-nav-height) + 26px)','.mm-dashboard-registry{display:grid;gap:14px}','body[data-mm-view="dashboard"] #continueBtn{display:none!important}','.mm-mobile-actions{bottom:var(--mm-mobile-nav-height)!important']:
    need(marker in ui_shell,f'canonical app-shell presentation missing from ui-shell.css: {marker}')

# Registry/finalizer must consolidate presentation composition only.
for forbidden in ['correctIndex=', 'question_bank_version=', 'MM_DATA.exams=', 'regionalQuestions=', 'certificates.push(', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon']:
    need(forbidden not in shell,f'app shell contains forbidden assessment/network mutation: {forbidden}')

idx=text('index.html')
for asset in ['app-shell-registry.js','app-shell-finalize.js']:
    need(f"['./{asset}','<script src=\"./{asset}\">']" in idx,f'index missing {asset}')
need("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'" in idx,'index missing packed mould-master workspace runtime')
need(idx.index("'./src/domains/runtime-packs/assessment-evidence-depth-runtime-pack.js'") < idx.index("'./app-shell-registry.js'"),'registry must capture the mature pre-shell core after packed assessment evidence patches')
need(idx.index("'./app-shell-registry.js'") < idx.index("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'"),'registry must capture core before packed learner wrapper modules')
need(idx.index("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'") < idx.index("'./app-shell-finalize.js'"),'packed workspace runtime must be registered before shell finalization')
need(idx.index("'./app-shell-finalize.js'") < idx.index("'./learning-analytics.js'"),'analytics may add its single lifecycle hook only after canonical shell finalization')

sw=text('service-worker.js')
for asset in ['app-shell-registry.js','mould-master-workspace.js','app-shell-finalize.js']:
    need(f"'./{asset}'" in sw,f'offline cache missing {asset}')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for asset in ['app-shell-registry.js','mould-master-workspace.js','app-shell-finalize.js']:
    need('../../'+asset in froms,f'desktop package missing {asset}')
    need("'"+asset+"'" in text('desktop/electron/scripts/generate-integrity.cjs'),f'desktop integrity missing {asset}')

finalizer=text('app-shell-finalize.js')
for dep in ['MM_APP_SHELL','MM_LEARNING_EXPERIENCE','MM_CURRICULUM_INTEGRATION','MM_SPECIALIST_CURRICULUM','MM_MOULD_MASTER_WORKSPACE']:
    need(dep in finalizer,f'finalizer dependency guard missing: {dep}')
need('MM_APP_SHELL.finalize()' in finalizer,'finalizer does not activate canonical shell')
need('window.MM_APP_SHELL_FINALIZED=VERSION' in finalizer,'finalizer marker must derive from the finalizer version')
need("root.querySelector('[data-mm-role=\"explore-learning\"]')" in finalizer,'Home simplification must target the semantic learning role')
need('actions.find(button=>/Explore your learning/i.test' not in finalizer,'Home behavior must not depend on learner-visible learning-copy text')
need('new MutationObserver' not in finalizer,'finalizer reintroduced redundant document/view MutationObserver ownership')

# Browser readiness must depend on shell-finalized state, never a release/version literal.
shell_version_wait=re.compile(r"MM_APP_SHELL_FINALIZED\s*===\s*['\"]\d{4}\.\d{2}\.\d{2}\.\d+['\"]")
for spec in sorted((ROOT/'qa').glob('*.spec.js')):
    source=spec.read_text(encoding='utf-8')
    need(not shell_version_wait.search(source),f'browser QA pins shell readiness to a release literal: {spec.relative_to(ROOT)}')

browser=text('qa/mobile-viewport.spec.js')
for marker in [
    "typeof window.MM_APP_SHELL_FINALIZED==='string'",
    'window.MM_APP_SHELL_FINALIZED.length>0',
    "!document.getElementById('mmBootstrap')",
    "Home is lean, XP-free, clear of duplicate reference launchers, and Practice owns troubleshooting",
    "Primary mobile navigation and the reduced More tools are keyboard reachable",
    "data-mm-registry-menu=\"learning-insights\"", "data-mm-registry-menu=\"repair-app-files\"",
    "late dashboard modules recompose idempotently",
    "window.MM_APP_SHELL.dashboard.register",
    "window.MM_APP_SHELL.dashboard.compose()",
    "capture Android-like Home regression artifact after bootstrap is gone"
]: need(marker in browser,f'mobile browser QA marker missing: {marker}')

print('MouldMaster app-shell registry QA passed (release-agnostic shell readiness, idempotent late dashboard registration, canonical navigation/geometry, XP-free condensed mobile coverage, offline/desktop packaging)')
