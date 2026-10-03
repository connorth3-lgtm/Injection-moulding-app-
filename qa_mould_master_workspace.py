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
    "canonicalStore:'mouldmaster-engineering-v2/db3'",
    'async function hydrate({force=false}={})',
    'hydratedLearnerToken',
    'store.learnerToken()',
    'await store.saveCase(c,{token:owner})',
    "await store.archiveCase(id,'Archived from Mould Master workspace',owner)",
    'Archive case',
    'evidence and audit history will be retained locally',
    'legacy localStorage is migration input only',
    'Export case',
    'Engineering context',
    'productId',
    'partId',
    'linkCaseContext',
    'engineeringContext:id=>',
    'Closed-loop evidence',
    'data-mw-case-evidence',
    'saveCaseEvidence',
    'listCaseEvidence',
    'evidenceSummary:async id=>',
    'Method / measurement basis',
    'Acceptance basis / authority',
    'Revise evidence',
    'Void evidence',
    'Import case',
    'importCaseFile',
    "schema:4"
]: need(marker in js,f'Mould Master workspace marker missing: {marker}')

for forbidden in [
    'localStorage.getItem(', 'localStorage.setItem(', 'localStorage.removeItem(', 'localStorage.clear(',
    'STORAGE_BASE', 'mm:mould-master-cases-changed', 'publishCasesChanged',
    'MM_DATA.exams=', 'correctIndex=', 'regionalQuestions=', 'question_bank_version=',
    'certificates.push(', 'examScores=', 'assessmentScores=',
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon',
    'navigator.serial', 'navigator.usb', 'navigator.bluetooth'
]: need(forbidden not in js,f'Mould Master workspace contains forbidden second-store/mutation/transport/control path: {forbidden}')

engineering=text('src/domains/engineering/engineering-store.js')
for marker in ['importLegacyCases','if(prior?.complete)return','preservedExisting','destructive:false','Engineering case belongs to a different learner profile','linkCaseMachine','linkCaseMould','linkCaseProduct','linkCasePart','linkCaseContext','productId','partId','caseEvidence','archiveCase','archivedAt','case-archive','normalizeCaseEvidence','saveCaseEvidence','listCaseEvidence','voidCaseEvidence','reviseCaseEvidence','evidenceAuditTrail','evidenceSummary','validateCaseBundle','importCaseBundle','evidenceCompleteness','methodRef','acceptanceBasis','materialLot','acceptanceStatus']:
    need(marker in engineering,f'engineering canonical-store migration/ownership marker missing: {marker}')
need('syncLegacySnapshot' not in engineering,'engineering store must not maintain live localStorage snapshot parity')
need("async function deleteCase(id,token=learnerToken()){return archiveCase(id,'Archived through legacy delete API',token)}" in engineering,'legacy delete API must remain a non-destructive archive operation')
need("tx.objectStore('caseEvidence').add(audit)" in engineering,'case archive must append retained audit evidence')
need("tx.objectStore('caseEvidence').delete" not in engineering,'case archive must not destructively delete evidence')
health=json.loads(text('data/health-program-v1.json'))
engineering_store=next((row for row in health.get('persistence',{}).get('stores',[]) if row.get('id')=='engineering-cases'),None)
need(engineering_store is not None,'health persistence contract missing engineering-cases store')
need(engineering_store.get('deletionBoundary')=='case-archive-retains-evidence; full erasure only through app/site-data clearing','health engineering deletion boundary drifted from canonical archive behavior')
new2=text('docs/NEW2_MATERIAL_INTELLIGENCE.md')
need('structured evidence and audit history are retained locally' in new2,'New2 documentation must state archive evidence retention')
need('Deleting the parent case still cascades its owned evidence' not in new2,'New2 documentation contradicts canonical archive retention')
need(not (ROOT/'src/domains/engineering/store-bridge.js').exists(),'retired engineering store bridge must not remain in the repository')

manifest=json.loads(text('runtime-domain-manifest.json'))
assets=manifest.get('assets',[])
need('./src/domains/engineering/engineering-store.js' in assets,'canonical engineering store missing from domain manifest')
need('./src/domains/engineering/store-bridge.js' not in assets,'retired engineering store bridge remains in domain manifest')

idx=text('index.html')
need("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'" in idx,'browser runtime does not load packed Mould Master workspace')
need(idx.index("'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'domain bootstrap must load after packed workspace surface so canonical-store hydration can complete')

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
for marker in ["RUNTIME_MANIFEST='runtime-domain-manifest.json'",'runtimeManifest.assets','runtimeManifest.dataAssets','manifestFiles']:
    need(marker in integ,f'desktop integrity generator does not derive canonical domain assets from runtime manifest: {marker}')
need('src/domains/engineering/store-bridge.js' not in integ,'retired engineering bridge remains in desktop integrity manifest')
desktop_qa=text('desktop/electron/scripts/qa.cjs')
need('runtime manifest asset is not integrity-hashed/servable by desktop' in desktop_qa,'desktop QA does not enforce manifest-derived serving coverage')

browser=text('qa/engineering-case-store.spec.js')
for marker in ['legacy-engineering-case','switchUser','mat-lotte-infino-nh-1033','localStorage.getItem','MM_ENGINEERING_STORE.getCase','materialGradeId','IMM-07','MOULD-184','PROD-PUMP-01','PART-184-03','similarCases','Cavity 3 critical dimension','QC-REPORT-184-03','LOT-NH1033-2409','dimensional-check','MM_ENGINEERING_STORE.listCaseEvidence','methodRef','acceptanceBasis','reviseCaseEvidence','voidCaseEvidence','importCaseBundle','evidenceAuditTrail','append-only']:
    need(marker in browser,f'canonical engineering browser regression missing marker: {marker}')
playwright=text('playwright.config.cjs')
need('engineering-case-store\\.spec\\.js' in playwright,'canonical engineering browser regression missing from Playwright config')
mobile=text('.github/workflows/mobile-browser-qa.yml')
need((ROOT/'qa/engineering-case-store.spec.js').exists(),'canonical engineering browser regression spec is missing')
need('engineering-case-store\\.spec\\.js' in playwright,'Mobile Browser QA Chromium config no longer includes engineering-store regression coverage')
need('npx playwright test --config=playwright.config.cjs --grep-invert' in mobile,'Mobile Browser QA no longer executes the Chromium regression config containing engineering-store coverage')

print('MouldMaster workspace QA passed (single owner-scoped IndexedDB authority, one-time non-destructive legacy import, learner-aware hydration, manifest-derived desktop serving, browser persistence regression, local evidence chain, controlled-test/verification flow, learning links, no production-control or assessment authority)')
