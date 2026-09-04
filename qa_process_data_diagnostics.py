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
    'src/domains/process/process-statistics.js','qa_process_statistics_current.cjs','runtime-domain-manifest.json',
    'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'guided data diagnostic dependency missing: {name}')

js=text('process-data-diagnostics.js')
p=subprocess.run(['node','--check',str(ROOT/'process-data-diagnostics.js')],capture_output=True,text=True)
need(p.returncode==0,'process-data-diagnostics.js syntax error: '+(p.stderr or p.stdout))
stat_js=text('src/domains/process/process-statistics.js')
p=subprocess.run(['node','--check',str(ROOT/'src/domains/process/process-statistics.js')],capture_output=True,text=True)
need(p.returncode==0,'process-statistics.js syntax error: '+(p.stderr or p.stdout))
p=subprocess.run(['node',str(ROOT/'qa_process_statistics_current.cjs')],cwd=ROOT,capture_output=True,text=True)
need(p.returncode==0,'current process statistics runtime QA failed: '+(p.stderr or p.stdout))

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

# Advanced statistics remain descriptive and fail closed on engineering semantics.
for marker in ['lag1Autocorrelation','spcRunRules','meanDifference','stratify','cavityVariance','engineeringEvidenceReady','MM_SIGNAL_REGISTRY','not specification limits','automatic production-change authority']:
    need(marker in stat_js,f'current process statistics invariant missing: {marker}')
need("raw[i]===null" in stat_js and 'contiguousSegments(values)' in stat_js,'missing values must break lag/run sequences instead of being coerced or bridged')
need('fetch(' not in stat_js and 'XMLHttpRequest' not in stat_js and 'WebSocket' not in stat_js and 'sendBeacon' not in stat_js,'process statistics service must remain local-only')

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

# Runtime coherence is structural. Browser/runtime asset identity derives from the canonical
# web release, while CACHE_REVISION remains an independent invalidation token.
sw=text('service-worker.js')
runtime_asset=js_const(idx,'SHELL_RELEASE')
expected_cache=js_const(idx,'EXPECTED_STATIC_CACHE')
cache_version=js_const(sw,'CACHE_VERSION')
cache_revision=js_const(sw,'CACHE_REVISION')
need('const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in idx,'guided data runtime identity must derive from canonical shell/web release')
need(re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+',runtime_asset) is not None,'guided data web release must use YYYY.MM.DD.N')
need(cache_version==runtime_asset,'guided data service-worker cache version must equal canonical web release')
need(bool(cache_revision.strip()),'guided data cache revision must remain an explicit independent invalidation token')
need(expected_cache==f'mouldmaster-static-{cache_version}-{cache_revision}','browser expected PWA cache must match the service-worker cache identity')
need("'./process-data-diagnostics.js'" in sw,'guided data diagnostics missing from offline cache')
need("'./src/domains/process/process-statistics.js'" in sw,'current process statistics service missing from atomic offline cache')
manifest=json.loads(text('runtime-domain-manifest.json'))
assets=manifest.get('assets') or []
need('./src/domains/shared/signal-registry.js' in assets and './src/domains/process/process-statistics.js' in assets,'signal/statistics domain assets missing from runtime manifest')
need(assets.index('./src/domains/shared/signal-registry.js') < assets.index('./src/domains/process/process-statistics.js'),'canonical signal registry must load before process statistics')

pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../process-data-diagnostics.js' in froms,'guided data diagnostics missing from desktop package')
need('../../src/domains' in froms,'desktop package must bundle the current domain runtime tree')
need("'process-data-diagnostics.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'guided data diagnostics missing from desktop integrity manifest')

print(f'MouldMaster guided process-data diagnostics QA passed (14/14 canonical datasets; descriptive statistics service with missingness-safe sequence logic and fail-closed signal semantics; local-only; coherent runtime={runtime_asset})')
