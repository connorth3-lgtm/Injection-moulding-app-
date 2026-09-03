from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(name):
    p=ROOT/name
    if not p.exists(): raise AssertionError(f'Mould Master workspace dependency missing: {name}')
    return p.read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

js=text('mould-master-workspace.js')
p=subprocess.run(['node','--check',str(ROOT/'mould-master-workspace.js')],capture_output=True,text=True)
need(p.returncode==0,'mould-master-workspace.js syntax error: '+(p.stderr or p.stdout))

for marker in [
    'Known-good baseline',
    'Current measured evidence',
    'Ranked mechanism / hypothesis',
    'Smallest controlled discriminating test',
    'Test result',
    'After-change / recovery evidence',
    'Verification & repeatability',
    'Conclusion / standardisation',
    'Production boundary:',
    'does not provide universal temperatures, pressures, speeds, force limits',
    'selectedDefect',
    'relatedLessons',
    'relatedSpecialist',
    'relatedData',
    'relatedMaterial',
    'MM_PROCESS_DATA_DIAGNOSTICS',
    'MM_MATERIAL_BEHAVIOUR_LABS',
    'MM_DIAGNOSTIC_LABS',
    'MM_SPECIALIST_CURRICULUM',
    'MM_ENGINEERING_STORE',
    'MM_MOULD_MASTER_WORKSPACE',
    'window.mmOpenMouldMaster',
    "canonicalStore:'indexeddb-v2'",
    'async function hydrate({force=false}={})',
    'hydratedLearnerToken',
    'store.learnerToken()',
    'await store.saveCase(c,{token:owner})',
    'await store.deleteCase(id,owner)',
    'legacy localStorage is migration input only',
    'Export case'
]: need(marker in js,f'Mould Master workspace marker missing: {marker}')

for forbidden in [
    'localStorage', 'STORAGE_BASE', 'mm:mould-master-cases-changed', 'publishCasesChanged',
    'MM_DATA.exams=', 'correctIndex=', 'regionalQuestions=', 'question_bank_version=',
    'certificates.push(', 'examScores=', 'assessmentScores=',
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon',
    'navigator.serial', 'navigator.usb', 'navigator.bluetooth'
]: need(forbidden not in js,f'Mould Master workspace contains forbidden second-store/mutation/transport/control path: {forbidden}')

engineering=text('src/domains/engineering/engineering-store.js')
for marker in ['importLegacyCases','if(prior?.complete)return','preservedExisting','destructive:false','Engineering case belongs to a different learner profile']:
    need(marker in engineering,f'engineering canonical-store migration/ownership marker missing: {marker}')
need('syncLegacySnapshot' not in engineering,'engineering store must not maintain live localStorage snapshot parity')
need(not (ROOT/'src/domains/engineering/store-bridge.js').exists(),'retired engineering store bridge must not remain in the repository')

manifest=json.loads(text('runtime-domain-manifest.json'))
assets=manifest.get('assets',[])
need('./src/domains/engineering/engineering-store.js' in assets,'canonical engineering store missing from domain manifest')
need('./src/domains/engineering/store-bridge.js' not in assets,'retired engineering store bridge remains in domain manifest')

idx=text('index.html')
need("['./mould-master-workspace.js','<script src=\"./mould-master-workspace.js\">']" in idx,'browser runtime does not load Mould Master workspace')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after specialist curriculum so related learning is available')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after process-data cases')
need(idx.index("'./mould-master-workspace.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'domain bootstrap must load after workspace surface so canonical-store hydration can complete')

sw=text('service-worker.js')
need("'./mould-master-workspace.js'" in sw,'Mould Master workspace missing from offline cache')
need("'./src/domains/engineering/engineering-store.js'" in sw,'canonical engineering store missing from offline cache')
need("store-bridge.js" not in sw,'retired engineering bridge remains in offline runtime')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../mould-master-workspace.js' in froms,'Mould Master workspace missing from desktop package')
need('../../src/domains' in froms,'domain runtime directory missing from desktop package')
integ=text('desktop/electron/scripts/generate-integrity.cjs')
need('mould-master-workspace.js' in integ,'Mould Master workspace missing from desktop integrity manifest')
need('src/domains/engineering/engineering-store.js' in integ,'canonical engineering store missing from desktop integrity manifest')
need('src/domains/engineering/store-bridge.js' not in integ,'retired engineering bridge remains in desktop integrity manifest')

browser=text('qa/engineering-case-store.spec.js')
for marker in ['legacy-engineering-case','switchUser','mat-lotte-infino-nh-1033','localStorage.getItem','MM_ENGINEERING_STORE.getCase','materialGradeId']:
    need(marker in browser,f'canonical engineering browser regression missing marker: {marker}')
playwright=text('playwright.config.cjs')
need('engineering-case-store\\.spec\\.js' in playwright,'canonical engineering browser regression missing from Playwright config')
mobile=text('.github/workflows/mobile-browser-qa.yml')
need('qa/engineering-case-store.spec.js' in mobile,'canonical engineering browser regression missing from Mobile Browser QA triggers')
need('engineering-store and PWA regression tests' in mobile,'Mobile Browser QA step no longer names engineering-store regression coverage')

print('MouldMaster workspace QA passed (single owner-scoped IndexedDB authority, one-time non-destructive legacy import, learner-aware hydration, browser persistence regression, local evidence chain, controlled-test/verification flow, learning links, no production-control or assessment authority)')
