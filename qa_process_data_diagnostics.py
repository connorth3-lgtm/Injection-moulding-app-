from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)
def js_const(source,name):
    m=re.search(rf"const\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]",source)
    need(m is not None,f'missing JavaScript constant {name}')
    return m.group(1)

required=[
    'process-data-diagnostics.js','evidence-maturity-deep-dive.js','index.html','service-worker.js',
    'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'guided data diagnostic dependency missing: {name}')

js=text('process-data-diagnostics.js')
p=subprocess.run(['node','--check',str(ROOT/'process-data-diagnostics.js')],capture_output=True,text=True)
need(p.returncode==0,'process-data-diagnostics.js syntax error: '+(p.stderr or p.stdout))

need("const VERSION='2026.08.26.1'" in js,'guided data diagnostic version marker missing')
need("const PACK=window.MM_PROCESS_EVIDENCE_DATASETS" in js,'guided UI must consume the canonical evidence dataset pack')
need("DATASETS.length!==PACK.datasets.length" in js,'guided UI must fail closed if a canonical dataset has no guide')
need("24 baseline, 24 fault and 24 recovery" in js,'learner UI must explain the canonical phase structure')
for marker in ['Read the pattern','Diagnose','Choose the next evidence','Interpret recovery','Export 72-cycle CSV','synthetic training data','not universal production setpoints']:
    need(marker in js,f'guided data diagnostic marker missing: {marker}')
need("PACK.toCsv(ds.id)" in js,'CSV export must use the canonical dataset generator rather than a duplicate dataset')
need("MM_PROCESS_DATA_DIAGNOSTICS" in js,'guided data diagnostic runtime API missing')
need("outside the formal assessment bank" in js,'guided cases must remain explicitly outside formal assessment')
need('fetch(' not in js,'guided process-data module must remain local-only')
for forbidden in ['MM_DATA.exams=', 'regionalQuestions=', 'MM_EVIDENCE_APPROVAL.records=', 'question_bank_version=', 'correctIndex=']:
    need(forbidden not in js,f'guided data diagnostics must not mutate formal assessment truth: {forbidden}')

# Every canonical synthetic dataset must have exactly one guide.
evidence=text('evidence-maturity-deep-dive.js')
def_block=re.search(r"const DATASET_DEFS=\[(.*?)\n\];\nfunction generateDataset",evidence,re.S)
need(def_block is not None,'canonical DATASET_DEFS block missing')
canonical=re.findall(r"\{id:'([^']+)'",def_block.group(1))
guide_block=re.search(r"const GUIDES=\{(.*?)\n\};\n\nconst DATASETS",js,re.S)
need(guide_block is not None,'GUIDES block missing')
guided=re.findall(r"\n\s*'([^']+)':\{",guide_block.group(1))
need(len(canonical)==14,f'expected 14 canonical synthetic datasets, got {len(canonical)}')
need(len(guided)==14,f'expected 14 guided data cases, got {len(guided)}')
need(set(canonical)==set(guided),f'guided data case coverage mismatch: missing={sorted(set(canonical)-set(guided))}, extra={sorted(set(guided)-set(canonical))}')

idx=text('index.html')
need("['./process-data-diagnostics.js','<script src=\"./process-data-diagnostics.js\">']" in idx,'browser shell does not load guided data diagnostics')
need(idx.index("'./evidence-maturity-deep-dive.js'") < idx.index("'./process-data-diagnostics.js'"),'guided data diagnostics must load after the canonical dataset pack')

# Runtime coherence is structural, not tied to one hard-coded feature bundle.
sw=text('service-worker.js')
runtime_asset=js_const(idx,'RUNTIME_ASSET_VERSION')
expected_cache=js_const(idx,'EXPECTED_STATIC_CACHE')
cache_version=js_const(sw,'CACHE_VERSION')
cache_revision=js_const(sw,'CACHE_REVISION')
need(expected_cache==f'mouldmaster-static-{cache_version}-{cache_revision}','browser expected PWA cache must match the service-worker cache identity')
need(runtime_asset[:8]==''.join(cache_version.split('.')[:3]),'guided data runtime date must align with the PWA release date')
need(runtime_asset.split('-',1)[1]==re.sub(r'-\d{8}$','',cache_revision),'guided data runtime family must match the PWA cache family')
need("'./process-data-diagnostics.js'" in sw,'guided data diagnostics missing from offline cache')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../process-data-diagnostics.js' in froms,'guided data diagnostics missing from desktop package')
need("'process-data-diagnostics.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'guided data diagnostics missing from desktop integrity manifest')

print(f'MouldMaster guided process-data diagnostics QA passed (14/14 canonical datasets; baseline/fault/recovery reasoning; local-only; outside formal assessment; coherent runtime={runtime_asset})')
