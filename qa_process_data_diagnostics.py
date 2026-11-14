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
    'process-data-diagnostics.js','src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js','evidence-maturity-deep-dive.js','index.html','service-worker.js',
    'src/domains/process/process-statistics.js','qa_process_statistics_current.cjs','runtime-domain-manifest.json',
    'desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs'
]
for name in required:
    need((ROOT/name).exists(),f'guided data diagnostic dependency missing: {name}')

js=text('process-data-diagnostics.js')
learning_process_pack=text('src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js')
p=subprocess.run(['node','--check',str(ROOT/'process-data-diagnostics.js')],capture_output=True,text=True)
need(p.returncode==0,'process-data-diagnostics.js syntax error: '+(p.stderr or p.stdout))
stat_js=text('src/domains/process/process-statistics.js')
p=subprocess.run(['node','--check',str(ROOT/'src/domains/process/process-statistics.js')],capture_output=True,text=True)
need(p.returncode==0,'process-statistics.js syntax error: '+(p.stderr or p.stdout))
p=subprocess.run(['node',str(ROOT/'qa_process_statistics_current.cjs')],cwd=ROOT,capture_output=True,text=True)
need(p.returncode==0,'current process statistics runtime QA failed: '+(p.stderr or p.stdout))

need("const VERSION='2026.11.14.2'" in js,'guided data diagnostic version marker missing')
need("const PACK=window.MM_PROCESS_EVIDENCE_DATASETS" in js,'retained evidence runtime must consume the canonical dataset pack')
need("DATASETS.length!==PACK.datasets.length" in js,'retained evidence runtime must fail closed if a canonical dataset is missing')
need("const PACK=window.MM_PROCESS_EVIDENCE_DATASETS" in js and "DATASETS.length!==PACK.datasets.length" in js,'canonical dataset records and full guided coverage must remain wired')
for marker in ['Read the pattern','Diagnose','Choose the next evidence','Interpret recovery','universal production limits']:
    need(marker in js,f'retained guided-case data marker missing: {marker}')
need("toCsv:id=>PACK.toCsv(String(id))" in js,'CSV generation must continue to use canonical dataset records')
need("MM_PROCESS_DATA_DIAGNOSTICS" in js,'guided data diagnostic runtime API missing')
need("function evaluateChoice(caseId,stepIndex,choiceIndex)" in js,'guided diagnostics must expose deterministic structured answer evaluation')
diagnostics_api=js[js.index('window.MM_PROCESS_DATA_DIAGNOSTICS='):js.index('window.MM_INJECTION_MOULDING_MATHS=')]
need('cases:DATASETS.map' in diagnostics_api and 'evaluateChoice' in diagnostics_api,'retained process evidence records and evaluator must remain in the app')
need('open:' not in diagnostics_api and 'openMaths' not in diagnostics_api and 'datasets:DATASETS' in diagnostics_api,'retained Process Data API must expose records without a screen route')
need('function ensureMathSection()' in js and 'window.MM_INJECTION_MOULDING_MATHS' in js,'injection moulding maths must remain in its independent view')
need('function install(){ensureMathStyles();const host=ensureMathSection();' in js and 'registerMathsNavigation()' in js,'module installation must register Maths only, not Process Data')
need("window.addEventListener('mm:domains-ready',schedule)" in js,'independent Maths navigation must register after the app shell is ready')
need('function handleClick(' not in js and 'function ensureSection(' not in js and "getElementById('processDataLabs')" not in js,'Process Data view and click handlers must be absent')
need('function evaluateChoice(caseId,stepIndex,choiceIndex)' in js,'retained evaluator must stay structured and independent from any screen')
need('function renderHome(' not in js and 'function renderGuidedHome(' not in js and 'data-pdlab-' not in js,'guided Process Data screen renderers and launchers must be removed')
need("outside the formal assessment bank" in js,'retained evidence records must remain outside formal assessment')
need('fetch(' not in js,'guided process-data module must remain local-only')
need("localStorage.getItem(k)===payload" in js and "Progress could not be saved on this device." in js,'retained learner-scoped maths progress must verify writes and surface storage failure')
need("return id?String(id):null" in js and "requires an active learner before persistence" in js,'guided process-data progress must not create a shared anonymous learner bucket')
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
need("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'" in idx,'browser shell does not load packed guided data diagnostics')
need(idx.index("'./src/domains/runtime-packs/evidence-runtime-pack.js'") < idx.index("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'"),'guided data diagnostics pack must load after the canonical evidence dataset pack')

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
need("'./src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js'" in sw,'guided data diagnostics runtime pack missing from offline cache')
need('/* >>> process-data-diagnostics.js */' in learning_process_pack,'guided data diagnostics missing from packed offline runtime')
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

print(f'MouldMaster retained evidence data QA passed (14/14 canonical datasets retained; no Process Data screen route; independent injection maths; descriptive statistics remain local-only; coherent runtime={runtime_asset})')
