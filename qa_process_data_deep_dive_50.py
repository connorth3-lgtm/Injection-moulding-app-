from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent
PACKS = [
    'process-data-deep-dive-machine.js',
    'process-data-deep-dive-tooling.js',
    'process-data-deep-dive-material.js',
    'process-data-deep-dive-scientific.js',
    'process-data-deep-dive-quality.js',
]
ENGINE = 'process-data-deep-dive-50.js'
ALL = [*PACKS, ENGINE]


def text(name):
    return (ROOT / name).read_text(encoding='utf-8')


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


for name in ALL:
    need((ROOT / name).exists(), f'50-case process-data dependency missing: {name}')
    p = subprocess.run(['node', '--check', str(ROOT / name)], capture_output=True, text=True)
    need(p.returncode == 0, f'{name} syntax error: {p.stderr or p.stdout}')

node_pack = """
const fs=require('fs'),vm=require('vm');global.window={};
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
process.stdout.write(JSON.stringify(window.MM_PROCESS_DATA_DEEP_DIVE_PACKS));
""" % json.dumps([str(ROOT / x) for x in PACKS])
p = subprocess.run(['node', '-e', node_pack], capture_output=True, text=True)
need(p.returncode == 0, 'could not execute 50-case data packs: ' + p.stderr)
packs = json.loads(p.stdout)
need(len(packs) == 5, f'expected five data packs, got {len(packs)}')
expected_kinds = {'machine', 'tooling', 'material', 'scientific-moulding', 'quality-sensor'}
need({p['kind'] for p in packs} == expected_kinds, f'deep-dive domains drifted: {[p.get("kind") for p in packs]}')
for pack in packs:
    need(len(pack.get('cases', [])) == 10, f'{pack.get("kind")} must contain exactly 10 cases')

raw = [case for pack in packs for case in pack['cases']]
need(len(raw) == 50, f'expected 50 additional cases, got {len(raw)}')
ids = [case[0] for case in raw]
need(len(set(ids)) == 50, '50-case IDs must be unique')

for case in raw:
    need(len(case) == 8, f'{case[0]} compact case schema must have 8 fields')
    cid, title, kind, source_ids, signals, fault, diagnosis, next_evidence = case
    need(kind in expected_kinds, f'{cid} has unknown domain {kind}')
    need(isinstance(source_ids, list) and len(source_ids) >= 2, f'{cid} must have at least two evidence-source IDs')
    need(len(set(source_ids)) == len(source_ids), f'{cid} repeats a source ID')
    need(isinstance(signals, list) and len(signals) == 4, f'{cid} must contain exactly four linked signals')
    names = []
    changed = 0
    for signal in signals:
        need(isinstance(signal, list) and len(signal) == 4, f'{cid} signal must contain name/base/delta/recovery')
        name, base, delta, recovery = signal
        names.append(name)
        need(name and all(isinstance(x, (int, float)) for x in (base, delta, recovery)), f'{cid}/{name} signal targets must be numeric')
        need(recovery == base, f'{cid}/{name} recovery target must return to the defined baseline')
        if abs(delta) > 1e-12:
            changed += 1
    need(len(set(names)) == 4, f'{cid} signal names must be unique')
    need(changed >= 2, f'{cid} must contain at least two meaningful fault-phase signal changes')
    for label, value in [('title', title), ('fault', fault), ('diagnosis', diagnosis), ('next evidence', next_evidence)]:
        need(isinstance(value, str) and len(value.strip()) >= 12, f'{cid} {label} is too weak/empty')

node_runtime = """
const fs=require('fs'),vm=require('vm');
global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}},MM_EVIDENCE_SOURCES:{sources:{}}};
global.document={addEventListener(){},documentElement:{},getElementById(){return null;}};
global.MutationObserver=class{observe(){}};global.requestAnimationFrame=f=>f();
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
const x=window.MM_PROCESS_DATA_DEEP_DIVE_50;
process.stdout.write(JSON.stringify({cases:x.cases,datasets:x.datasets,scope:x.scope,sources:window.MM_EVIDENCE_SOURCES.sources}));
""" % (
    json.dumps([str(ROOT / x) for x in PACKS]),
    json.dumps(str(ROOT / ENGINE)),
    json.dumps(str(ROOT / ENGINE)),
)
p = subprocess.run(['node', '-e', node_runtime], capture_output=True, text=True)
need(p.returncode == 0, '50-case engine runtime failed: ' + p.stderr)
runtime = json.loads(p.stdout)
need(len(runtime['cases']) == 50 and len(runtime['datasets']) == 50, 'engine must expose all 50 cases/datasets')
for dataset in runtime['datasets']:
    need(len(dataset['rows']) == 72, f"{dataset['id']} must generate exactly 72 cycles")
    phase = [row['phase'] for row in dataset['rows']]
    need(phase.count('baseline') == 24 and phase.count('fault') == 24 and phase.count('recovery') == 24, f"{dataset['id']} must preserve 24/24/24 baseline-fault-recovery")
    need(dataset.get('phaseCounts') == {'baseline': 24, 'fault': 24, 'recovery': 24}, f"{dataset['id']} phaseCounts drifted")
    need(len(dataset['signals']) == 4, f"{dataset['id']} generated signal count drifted")
need('outside formal assessment' in runtime['scope'] and 'not a production recipe' in runtime['scope'], 'deep-dive runtime scope must preserve education/assessment boundary')

engine = text(ENGINE)
for marker in [
    'Open 50-case data deep dive', '50-case data deep dive', 'Back to guided 14 cases', 'Export 72-cycle CSV',
    '24 baseline, 24 fault and 24 recovery', 'not universal production setpoints', 'maintenance thresholds',
    'Ranked mechanism:', 'Best next evidence:', 'Filter deep-dive cases', 'MM_PROCESS_DATA_DEEP_DIVE_50'
]:
    need(marker in engine, f'50-case learner UI/safety marker missing: {marker}')

# Pin source identities to stable publication identifiers rather than a particular resolver endpoint.
source_identities = {
    'sensor-review-2019': '10.3390/s19163551',
    'measurement-review-2024': '10.1016/j.measurement.2024.114163',
    'smart-sensor-review-2025': '10.1016/j.sna.2025.116248',
    'quality-ml-2024': '10.1002/pen.26866',
    'predictive-maintenance-2026': '10.1108/JQME-05-2025-0050',
    'ultrasound-review-2021': '10.3390/s21155193',
}
for source_id, identity in source_identities.items():
    need(source_id in runtime['sources'], f'new deep-dive source not registered: {source_id}')
    source = runtime['sources'][source_id]
    combined = ' '.join(str(source.get(k, '')) for k in ('url', 'name')).lower()
    need(identity.lower() in combined, f'new deep-dive source identity drifted: {source_id}')

for name in ALL:
    body = text(name)
    need('fetch(' not in body, f'{name} must remain local-only')
    for forbidden in ['MM_DATA.exams=', 'regionalQuestions=', 'correctIndex=', 'MM_EVIDENCE_APPROVAL.records=', 'question_bank_version=', 'XMLHttpRequest', 'WebSocket']:
        need(forbidden not in body, f'{name} must not mutate/transport formal assessment or production data: {forbidden}')

material = text('process-data-deep-dive-material.js').lower()
need('pom-contamination-degradation' in material and 'supplier/site-approved' in material, 'POM degradation case must route to the safe supplier/site procedure')
need('increase temperature to burn' not in material and 'bypass guards' not in material, 'material deep dive must not recommend unsafe degradation/guard actions')
quality = text('process-data-deep-dive-quality.js')
need('["processSD_mm",0.04,0,0.04]' in quality, 'Gage R&R case must keep underlying process spread stable')
need('["withinSD_mm",0.04,0,0.04]' in quality, 'autocorrelation case must keep within-process spread stable')

idx = text('index.html')
sw = text('service-worker.js')
pkg = json.loads(text('desktop/electron/package.json'))
integrity = text('desktop/electron/scripts/generate-integrity.cjs')
resource_from = {x.get('from') for x in pkg['build']['extraResources'] if isinstance(x, dict)}
for filename in ALL:
    need(filename in idx, f'browser shell missing {filename}')
    need(f"'./{filename}'" in sw, f'offline cache missing {filename}')
    need('../../' + filename in resource_from, f'desktop package missing {filename}')
    need("'" + filename + "'" in integrity, f'desktop integrity manifest missing {filename}')
need(idx.index("'./process-data-diagnostics.js'") < idx.index("'./process-data-deep-dive-machine.js'") < idx.index("'./process-data-deep-dive-50.js'") < idx.index("'./curriculum-integration.js'"), '50-case packs/engine must load after guided data and before curriculum integration')

qa = text('.github/workflows/qa.yml')
desktop = text('.github/workflows/open-desktop-build.yml')
need('python qa_process_data_deep_dive_50.py' in qa, 'release QA must gate the 50-case data deep dive')
need('python qa_process_data_deep_dive_50.py' in desktop, 'Windows build must gate the 50-case data deep dive')
need("find . -maxdepth 1 -type f -name '*.js'" in qa, 'release JS syntax gate must discover root JavaScript dynamically')

print('MouldMaster 50-case process-data deep-dive QA passed (50 unique cases; 10 per domain; 4 signals each; 3,600 deterministic synthetic cycles; recovery invariants; evidence-first/local-only; offline + desktop packaged)')