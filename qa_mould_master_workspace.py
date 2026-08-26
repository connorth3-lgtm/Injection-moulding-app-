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
    "const STORAGE_BASE='mm_mould_master_cases_v1::'",
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
    'MM_MOULD_MASTER_WORKSPACE',
    'window.mmOpenMouldMaster',
    'localStorage.getItem(storageKey())',
    'localStorage.setItem(storageKey()',
    'Export case'
]: need(marker in js,f'Mould Master workspace marker missing: {marker}')

# This must remain an evidence notebook / learning tool, never an assessment or production-control authority.
for forbidden in [
    'MM_DATA.exams=', 'correctIndex=', 'regionalQuestions=', 'question_bank_version=',
    'certificates.push(', 'examScores=', 'assessmentScores=',
    'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon',
    'navigator.serial', 'navigator.usb', 'navigator.bluetooth'
]: need(forbidden not in js,f'Mould Master workspace contains forbidden mutation/transport/control path: {forbidden}')

idx=text('index.html')
need("['./mould-master-workspace.js','<script src=\"./mould-master-workspace.js\">']" in idx,'browser runtime does not load Mould Master workspace')
need(idx.index("'./specialist-curriculum.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after specialist curriculum so related learning is available')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./mould-master-workspace.js'"),'workspace must load after process-data cases')

sw=text('service-worker.js')
need("'./mould-master-workspace.js'" in sw,'Mould Master workspace missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../mould-master-workspace.js' in froms,'Mould Master workspace missing from desktop package')
need("'mould-master-workspace.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'Mould Master workspace missing from desktop integrity manifest')

print('MouldMaster workspace QA passed (local evidence chain, controlled-test/verification flow, learning links, no production-control or assessment authority)')
