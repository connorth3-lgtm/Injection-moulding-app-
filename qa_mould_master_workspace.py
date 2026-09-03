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
    'async function hydrate()',
    'await store.saveCase',
    'await store.deleteCase',
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

bridge=text('src/domains/engineering/store-bridge.js')
for marker in ["legacyMode:'one-time-import-only'","canonicalStore:'indexeddb-v2'",'store.bootstrap()','workspace.hydrate']:
    need(marker in bridge,f'legacy migration bridge marker missing: {marker}')
for forbidden in ['localStorage','syncLegacySnapshot','mm:mould-master-cases-changed']:
    need(forbidden not in bridge,f'legacy migration bridge must not remain a live second-store bridge: {forbidden}')

idx=text('index.html')
need("['./mould-master-workspace.js','<script src=\"./mould-master-workspace.js\">']" in idx,'browser runtime does not load Mould Master workspace')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after specialist curriculum so related learning is available')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after process-data cases')
need(idx.index("'./mould-master-workspace.js'") < idx.index("'./src/domains/domain-bootstrap.js'"),'domain bootstrap must load after legacy-compatible workspace surface so it can hydrate the canonical store')

sw=text('service-worker.js')
need("'./mould-master-workspace.js'" in sw,'Mould Master workspace missing from offline cache')
need("'./src/domains/engineering/engineering-store.js'" in sw,'canonical engineering store missing from offline cache')
need("'./src/domains/engineering/store-bridge.js'" in sw,'one-time engineering migration bridge missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for asset in ['../../mould-master-workspace.js','../../src/domains/engineering/engineering-store.js','../../src/domains/engineering/store-bridge.js']:
    need(asset in froms,f'Mould Master canonical storage asset missing from desktop package: {asset}')
integ=text('desktop/electron/scripts/generate-integrity.cjs')
for asset in ['mould-master-workspace.js','src/domains/engineering/engineering-store.js','src/domains/engineering/store-bridge.js']:
    need(asset in integ,f'Mould Master canonical storage asset missing from desktop integrity manifest: {asset}')

print('MouldMaster workspace QA passed (single owner-scoped IndexedDB authority, one-time non-destructive legacy import, local evidence chain, controlled-test/verification flow, learning links, no production-control or assessment authority)')
