from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent

def text(name):
    p=ROOT/name
    if not p.exists(): raise AssertionError(f'app shell dependency missing: {name}')
    return p.read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

required=['src/domains/shell/app-shell-registry.js','src/domains/shell/app-shell-finalize.js','mould-master-workspace.js','index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','qa/mobile-viewport.spec.js']
for name in required: text(name)
for js in ['src/domains/shell/app-shell-registry.js','src/domains/shell/app-shell-finalize.js','mould-master-workspace.js']:
    p=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    need(p.returncode==0,f'{js} syntax error: '+(p.stderr or p.stdout))

shell=text('src/domains/shell/app-shell-registry.js')
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
    "id:'curriculum-focus'",
    "id:'specialist'",
    "id:'mould-master'",
    "id:'diagnostic-labs'",
    "id:'process-data'",
    "id:'material-labs'",
    "id:'learning-insights'", "id:'repair-app-files'", "./repair.html", "location.reload()", "Electron",
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
product_areas=text('src/domains/shell/product-areas.js')
need("document.createElement('style')" not in product_areas,'product-area shell module must not inject presentation styles at runtime')
need('mm-product-areas-style' not in product_areas,'retired product-area runtime style element must not return')
ui_shell=text('ui-shell.css')
for marker in ['.mm-product-area-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))','--mm-mobile-nav-height:calc(70px + env(safe-area-inset-bottom))','--mm-mobile-content-clearance:calc(var(--mm-mobile-nav-height) + 26px)','.mm-dashboard-registry{display:grid;gap:14px}','body[data-mm-view="dashboard"] #continueBtn{display:none!important}','.mm-mobile-actions{bottom:var(--mm-mobile-nav-height)!important']:
    need(marker in ui_shell,f'canonical app-shell presentation missing from ui-shell.css: {marker}')

# Registry/finalizer must consolidate presentation composition only.
for forbidden in ['correctIndex=', 'question_bank_version=', 'MM_DATA.exams=', 'regionalQuestions=', 'certificates.push(', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon']:
    need(forbidden not in shell,f'app shell contains forbidden assessment/network mutation: {forbidden}')

idx=text('index.html')
domain_bootstrap=text('src/domains/domain-bootstrap.js')
need("Unsafe domain asset" in domain_bootstrap and "A-Za-z0-9._-" in domain_bootstrap and "includes('..')" in domain_bootstrap,
     "domain bootstrap must reject path traversal/non-canonical manifest assets")
need("['./src/domains/shell/app-shell-registry.js','<script src=\"./src/domains/shell/app-shell-registry.js\">']" in idx,'index missing src/domains/shell/app-shell-registry.js')
need("['./src/domains/runtime-packs/shell-finalization-runtime-pack.js','<script src=\"./src/domains/runtime-packs/shell-finalization-runtime-pack.js\">']" in idx,'index missing packed shell finalizer')
need("['./src/domains/shell/app-shell-finalize.js','<script" not in idx,'direct root shell finalizer must remain retired from browser bootstrap')
need("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'" in idx,'index missing packed mould-master workspace runtime')
need(idx.index("'./src/domains/runtime-packs/assessment-evidence-depth-runtime-pack.js'") < idx.index("'./src/domains/shell/app-shell-registry.js'"),'registry must capture the mature pre-shell core after packed assessment evidence patches')
need(idx.index("'./src/domains/shell/app-shell-registry.js'") < idx.index("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'"),'registry must capture core before packed learner wrapper modules')
need(idx.index("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'") < idx.index("'./src/domains/runtime-packs/shell-finalization-runtime-pack.js'"),'packed workspace runtime must be registered before shell finalization')
need(idx.index("'./src/domains/runtime-packs/shell-finalization-runtime-pack.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'shell finalization pack must run before domain bootstrap')

sw=text('service-worker.js')
need("'./src/domains/shell/app-shell-registry.js'" in sw,'offline cache missing app-shell registry')
need("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'" in sw,'offline cache missing packed mould-master workspace runtime')
workspace_pack=text('src/domains/runtime-packs/curriculum-workspace-runtime-pack.js')
need('/* >>> mould-master-workspace.js */' in workspace_pack,'packed workspace runtime is missing mould-master-workspace.js')
need("'./src/domains/runtime-packs/shell-finalization-runtime-pack.js'" in sw,'offline cache missing packed shell finalizer')
need("bindCanonicalCoreNavigation" in shell and "event.stopImmediatePropagation()" in shell and "},true);" in shell,'core desktop navigation must route once through the canonical shell in capture phase')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../src/domains' in froms,'desktop package must include the canonical recursive domain runtime tree')
need('../../mould-master-workspace.js' in froms,'desktop package missing root workspace asset')
for asset in ['src/domains/shell/app-shell-registry.js','src/domains/shell/app-shell-finalize.js']:
    need('../../'+asset not in froms,f'desktop package must not duplicate domain-owned shell asset: {asset}')
for asset in ['src/domains/shell/app-shell-registry.js','mould-master-workspace.js','src/domains/shell/app-shell-finalize.js']:
    need("'"+asset+"'" in text('desktop/electron/scripts/generate-integrity.cjs'),f'desktop integrity missing {asset}')

finalizer=text('src/domains/shell/app-shell-finalize.js')
for dep in ['MM_APP_SHELL','MM_LEARNING_EXPERIENCE','MM_CURRICULUM_INTEGRATION','MM_SPECIALIST_CURRICULUM','MM_MOULD_MASTER_WORKSPACE']:
    need(dep in finalizer,f'finalizer dependency guard missing: {dep}')
need('MM_APP_SHELL.finalize()' in finalizer,'finalizer does not activate canonical shell')
need('window.MM_APP_SHELL_FINALIZED=VERSION' in finalizer,'finalizer marker must derive from the finalizer version')
need("id:'task-hub'" not in shell,'retired Home task-hub must not be registered by the canonical shell')
need('.mm-home-task-hub' not in finalizer,'shell finalizer must not retain retired Home task-hub cleanup coupling')
need('data-mm-role="explore-learning"' not in finalizer,'shell finalizer must not rewrite retired Home task actions')
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
    "Home is lean, XP-free, includes the Book resume surface, and Practice owns troubleshooting",
    "Primary mobile navigation and the reduced More tools are keyboard reachable",
    "data-mm-registry-menu=\"learning-insights\"", "data-mm-registry-menu=\"repair-app-files\"",
    "late dashboard modules recompose idempotently",
    "window.MM_APP_SHELL.dashboard.register",
    "window.MM_APP_SHELL.dashboard.compose()",
    "capture Android-like Home regression artifact after bootstrap is gone"
]: need(marker in browser,f'mobile browser QA marker missing: {marker}')

print('MouldMaster app-shell registry QA passed (release-agnostic shell readiness, idempotent late dashboard registration, canonical navigation/geometry, XP-free condensed mobile coverage, offline/desktop packaging)')