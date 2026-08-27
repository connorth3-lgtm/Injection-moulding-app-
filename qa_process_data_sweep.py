from pathlib import Path
from collections import Counter, defaultdict
import json
import math
import re
import subprocess

ROOT = Path(__file__).resolve().parent
GUIDED = ROOT / 'evidence-maturity-deep-dive.js'
DEEP_PACKS = [
    ROOT / 'process-data-deep-dive-machine.js',
    ROOT / 'process-data-deep-dive-tooling.js',
    ROOT / 'process-data-deep-dive-material.js',
    ROOT / 'process-data-deep-dive-scientific.js',
    ROOT / 'process-data-deep-dive-quality.js',
]
ATLAS_PACKS = [
    ROOT / 'process-data-20-pass-01-05.js',
    ROOT / 'process-data-20-pass-06-10.js',
    ROOT / 'process-data-20-pass-11-15.js',
    ROOT / 'process-data-20-pass-16-20.js',
]
REPORT = ROOT / 'process-data-sweep-report.json'
KNOWN_TITLE_OVERLAPS = {
    'recycled pp lot to lot rheology shift': {'recycled-pp-lot', 'p10-recycled-pp-lot-rheology'},
    'tie bar load imbalance': {'tiebar-load-imbalance', 'p03-tie-bar-load-imbalance'},
    'hot runner thermocouple bias': {'hotrunner-thermocouple-bias', 'p05-thermocouple-bias'},
    'pa66 moisture reabsorption after drying': {'pa66-moisture-reabsorption', 'p08-pa66-reabsorption'},
}
# These guided datasets are controlled studies/transfer demonstrations whose
# third phase is a verified endpoint rather than a return to the first value.
# Keeping the exception narrow prevents a scientific study from being mislabeled
# as a recovery while preserving the stronger recovery-to-baseline invariant for
# every ordinary diagnostic case.
CONTROLLED_ENDPOINT_CASES = {
    'gate-seal-study': 'Gate-seal study deliberately progresses toward a mass/pressure-area plateau as hold time is extended.',
    'recycled-pp-lot': 'A changed material lot is verified at a new stable material/process signature rather than assumed identical to the prior lot.',
    'machine-transfer': 'Machine transfer verifies equivalent physical response after transfer; one actual-response feature can settle at a new machine-specific value.',
}


def text(path):
    return (ROOT / path).read_text(encoding='utf-8')


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def normal_title(value):
    return re.sub(r'[^a-z0-9]+', ' ', str(value).lower()).strip()


for path in [GUIDED, *DEEP_PACKS, *ATLAS_PACKS]:
    need(path.exists(), f'process-data sweep dependency missing: {path.name}')

node = r"""
const fs=require('fs'),vm=require('vm');
const guidedSource=fs.readFileSync(process.argv[1],'utf8');
const m=/const DATASET_DEFS=(\[[\s\S]*?\]);\nfunction generateDataset/.exec(guidedSource);
if(!m)throw new Error('guided DATASET_DEFS block missing');
const guidedCtx={};vm.runInNewContext('defs='+m[1],guidedCtx);
global.window={};
for(const f of JSON.parse(process.argv[2]))vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const deep=window.MM_PROCESS_DATA_DEEP_DIVE_PACKS;
window.MM_PROCESS_DATA_20_PASS_PACKS=[];
for(const f of JSON.parse(process.argv[3]))vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const atlas=window.MM_PROCESS_DATA_20_PASS_PACKS;
process.stdout.write(JSON.stringify({guided:guidedCtx.defs,deep,atlas}));
"""
proc = subprocess.run([
    'node', '-e', node, str(GUIDED),
    json.dumps([str(x) for x in DEEP_PACKS]),
    json.dumps([str(x) for x in ATLAS_PACKS]),
], cwd=ROOT, capture_output=True, text=True)
need(proc.returncode == 0, 'cross-library data extraction failed: ' + (proc.stderr or proc.stdout))
data = json.loads(proc.stdout)

records = []
for case in data['guided']:
    records.append({
        'layer': 'guided-14', 'id': case['id'], 'title': case['title'], 'domain': case['kind'],
        'sourceIds': case.get('sourceIds', []), 'sourceGranularity': 'case',
        'signals': [[name, values[0], values[1], values[2]] for name, values in case['signals'].items()],
    })
for pack in data['deep']:
    for case in pack['cases']:
        cid, title, kind, source_ids, signals, *_ = case
        records.append({
            'layer': 'deep-50', 'id': cid, 'title': title, 'domain': kind,
            'sourceIds': source_ids, 'sourceGranularity': 'case', 'signals': signals,
        })
for pack in data['atlas']:
    for case in pack['cases']:
        cid, title, signals, *_ = case
        records.append({
            'layer': 'atlas-200', 'id': cid, 'title': title, 'domain': pack['domain'],
            'sourceIds': pack.get('sourceIds', []), 'sourceGranularity': 'pass', 'signals': signals,
            'pass': pack['pass'], 'passId': pack['id'],
        })

layer_counts = Counter(r['layer'] for r in records)
need(layer_counts == Counter({'guided-14': 14, 'deep-50': 50, 'atlas-200': 200}), f'cross-library case counts drifted: {dict(layer_counts)}')
need(len(records) == 264, f'expected 264 total process-data cases, got {len(records)}')

ids = [r['id'] for r in records]
need(len(set(ids)) == len(ids), 'process-data case IDs must be globally unique across guided, deep-dive and atlas layers')
need(set(CONTROLLED_ENDPOINT_CASES).issubset(set(ids)), 'controlled-study endpoint register references a missing case')
need(all(next(r for r in records if r['id'] == cid)['layer'] == 'guided-14' for cid in CONTROLLED_ENDPOINT_CASES), 'controlled-study endpoint exceptions must remain limited to the guided scientific/transfer layer')

exact_titles = defaultdict(list)
for r in records:
    exact_titles[normal_title(r['title'])].append(r['id'])
exact_collisions = {title: ids for title, ids in exact_titles.items() if title and len(ids) > 1}
unapproved_collisions = {}
for title, collision_ids in exact_collisions.items():
    if set(collision_ids) != KNOWN_TITLE_OVERLAPS.get(title, set()):
        unapproved_collisions[title] = collision_ids
need(not unapproved_collisions, f'unapproved normalised process-data title collisions: {unapproved_collisions}')

signal_counts = Counter()
domain_counts = Counter()
source_counts = Counter()
source_granularity = Counter()
controlled_endpoint_summary = {}
for r in records:
    domain_counts[r['domain']] += 1
    source_granularity[r['sourceGranularity']] += 1
    need(len(r['sourceIds']) >= 2, f"{r['id']} needs at least two evidence sources at its declared granularity")
    need(len(set(r['sourceIds'])) == len(r['sourceIds']), f"{r['id']} repeats evidence sources")
    for sid in r['sourceIds']:
        source_counts[sid] += 1
    signals = r['signals']
    need(len(signals) == 4, f"{r['id']} must retain exactly four linked signals")
    names = [s[0] for s in signals]
    need(len(set(names)) == 4, f"{r['id']} repeats a signal name")
    changed = 0
    endpoint_changes = 0
    for name, baseline, delta, recovery in signals:
        signal_counts[name] += 1
        need(isinstance(name, str) and name, f"{r['id']} contains an empty signal name")
        need(all(isinstance(v, (int, float)) and math.isfinite(v) for v in (baseline, delta, recovery)), f"{r['id']}/{name} must contain finite numeric baseline/delta/recovery values")
        if r['id'] in CONTROLLED_ENDPOINT_CASES:
            endpoint_changes += int(recovery != baseline)
        else:
            need(recovery == baseline, f"{r['id']}/{name} recovery target must equal its defined baseline")
        if abs(delta) > 1e-12:
            changed += 1
    need(changed >= 2, f"{r['id']} must contain at least two changed fault/study signals")
    if r['id'] in CONTROLLED_ENDPOINT_CASES:
        need(endpoint_changes >= 1, f"{r['id']} is registered as a controlled study endpoint but has no endpoint change")
        controlled_endpoint_summary[r['id']] = {
            'endpointSignalsDifferentFromBaseline': endpoint_changes,
            'rationale': CONTROLLED_ENDPOINT_CASES[r['id']],
        }

need(set(controlled_endpoint_summary) == set(CONTROLLED_ENDPOINT_CASES), 'controlled-study endpoint audit did not execute every registered exception')
expected_cycles = 264 * 72
need(expected_cycles == 19008, 'process-data corpus cycle arithmetic drifted')

readme = text('README.md')
need('264 guided/synthetic diagnostic cases' in readme, 'README process-data case total drifted')
need('19,008 generated training cycles' in readme, 'README process-data cycle total drifted')
for qa_name in ['qa_process_data_diagnostics.py','qa_process_data_deep_dive_50.py','qa_process_data_20_pass.py','qa_process_data_local_intake.py','qa_process_data_sweep.py','qa_real_process_data_pilot.py']:
    need(qa_name in readme, f'README release-QA list missing {qa_name}')

for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/publish-open-desktop.yml','.github/workflows/microsoft-store-msix.yml']:
    need('python qa_process_data_sweep.py' in text(wf), f'{wf} must gate the corpus-wide process-data sweep')
need("'qa_process_data_sweep.py'" in text('.github/workflows/open-desktop-build.yml'), 'Windows build path filter must include the corpus-wide sweep script')

intake_standard = text('sources/REAL_PROCESS_DATA_INTAKE.md')
for marker in ['Two templates, one controlled flow','Sequence review required','only one `shot_index` field']:
    need(marker in intake_standard, f'real-data intake standard missing sweep finding/fix marker: {marker}')

report = {
    'schema': 2,
    'scope': 'Cross-library structural sweep of MouldMaster synthetic process-data learning cases; no measured production rows are included.',
    'totals': {'cases': len(records), 'cycles': expected_cycles, 'signalsPerCase': 4},
    'layers': dict(layer_counts),
    'domains': dict(sorted(domain_counts.items())),
    'globalIdCollisions': [],
    'knownIntentionalTitleOverlaps': exact_collisions,
    'unapprovedTitleCollisions': unapproved_collisions,
    'titleOverlapPolicy': 'The registered overlaps teach the same physical mechanism at different representation/depth layers (physical-value guided/deep case versus normalized atlas evidence chain). Any new or differently paired title collision fails CI.',
    'trajectoryPolicy': {
        'ordinaryDiagnosticCases': 'Recovery target must equal defined baseline for every signal.',
        'controlledStudyEndpointCases': controlled_endpoint_summary,
        'boundary': 'A controlled scientific study or transfer endpoint is not relabeled as fault recovery merely to satisfy a structural invariant.'
    },
    'uniqueSignalNames': len(signal_counts),
    'mostReusedSignalNames': [{'name': name, 'cases': count} for name, count in signal_counts.most_common(20)],
    'evidenceSources': {
        'uniqueSourceIdsReferenced': len(source_counts),
        'mostReusedSourceIds': [{'sourceId': sid, 'casesAtDeclaredGranularity': count} for sid, count in source_counts.most_common(20)]
    },
    'evidenceGranularity': {
        'caseLevelCases': source_granularity['case'],
        'passLevelCases': source_granularity['pass'],
        'gap': 'The 200-case atlas inherits evidence sources at pass level; per-case source relevance remains a future evidence-granularity improvement, not a claim that every pass source directly validates every synthetic signal delta.'
    },
    'measuredDataBoundary': {
        'measuredRowsInSyntheticCorpus': 0,
        'sitePilotIssue': 50,
        'publicMeasuredBenchmarkIssue': 53,
        'status': 'synthetic corpus structurally coherent; measured-data validation remains separate and open'
    }
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f"MouldMaster cross-library data sweep passed ({len(records)} globally unique case IDs; {expected_cycles:,} synthetic cycles; {len(signal_counts)} distinct signal names; {len(source_counts)} referenced source IDs; {len(exact_collisions)} registered cross-layer title overlaps; {len(CONTROLLED_ENDPOINT_CASES)} controlled study endpoints; {source_granularity['pass']} atlas cases still use pass-level evidence granularity)")