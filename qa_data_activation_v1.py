from pathlib import Path
import json, subprocess, tempfile

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

required=[
 'src/domains/shared/data-spine.js','src/domains/shared/signal-registry.js',
 'src/domains/assessment/assessment-analytics-v2.js',
 'src/domains/learning/activity-events-v2.js','src/domains/learning/learner-model.js',
 'src/domains/learning/content-intelligence.js','src/domains/materials/material-observation-v2.js',
 'src/domains/engineering/evidence-chain.js','src/domains/process/evidence-granularity.js',
 'data/materials/material-grade-v2.schema.json','data/real-pilot-analysis-contract-v1.json',
 'tools/analyze_real_pilot.py','qa/fixtures/real-pilot-analysis-synthetic.csv'
]
for p in required: need((ROOT/p).exists(),f'data activation asset missing: {p}')
for p in [x for x in required if x.endswith('.js')]:
    r=subprocess.run(['node','--check',str(ROOT/p)],capture_output=True,text=True)
    need(r.returncode==0,f'{p} syntax error: {r.stderr or r.stdout}')

spine=text('src/domains/shared/data-spine.js')
for m in ['canonicalId','fingerprint','registerEvidenceRecord','ingestMaterials','MM_DATA_SPINE']:
    need(m in spine,f'data spine marker missing: {m}')
need('function stable(value)' in spine,'data spine fingerprints must include deterministic nested object structure')

signals=text('src/domains/shared/signal-registry.js')
for m in ['injection_pressure_actual','injection_pressure_target','cavity_pressure','resin_moisture_ppm','unknown_source_semantics','review-required']:
    need(m in signals,f'signal dictionary marker missing: {m}')
for m in ['process-data-semantic-registry.json','actualness','confirm-source-semantics','unit-must-be-confirmed','confirmed=false']:
    need(m in signals,f'canonical signal semantic alignment missing: {m}')

assessment=text('src/domains/assessment/assessment-analytics-v2.js')
for m in ['questionRevision','bankVersion','choiceFingerprint','authoredDifficulty','observedDifficulty','stable question ID plus explicit revision']:
    need(m in assessment,f'assessment analytics v2 marker missing: {m}')

activity=text('src/domains/learning/activity-events-v2.js')
for m in ['mm_activity_events_v2::','material-lab','assessmentSnapshot','choiceFingerprints','No names, notes, free text, raw answer text']:
    need(m in activity,f'activity v2 marker missing: {m}')
for forbidden in ['fetch(','XMLHttpRequest','WebSocket','sendBeacon(']:
    need(forbidden not in activity,f'activity events must remain local-only: {forbidden}')

learner=text('src/domains/learning/learner-model.js')
for m in ['mastery','confidence','forgettingRisk','stuckness','learningVelocity','transferStrength','recommendations']:
    need(m in learner,f'learner model marker missing: {m}')

material=text('src/domains/materials/material-observation-v2.js')
for m in ['quantity','propertyKey','semanticStatus','range','scalar','existing material-grade v2']:
    need(m in material,f'material v2 projection marker missing: {m}')
schema=json.loads(text('data/materials/material-grade-v2.schema.json'))
quantity=schema.get('$defs',{}).get('quantity',{})
need('oneOf' in quantity and any(x.get('properties',{}).get('kind',{}).get('const')=='range' for x in quantity['oneOf']),'material v2 schema must support typed ranges')
need('fingerprint' in schema.get('$defs',{}).get('sourceDocument',{}).get('properties',{}),'material v2 schema must retain source fingerprints')

process=text('src/domains/process/evidence-granularity.js')
for m in ['explicit-pass-inherited','context-support-not-direct-validation','directValidationClaimed']:
    need(m in process,f'process evidence granularity marker missing: {m}')
engineering=text('src/domains/engineering/evidence-chain.js')
for m in ['addObservation','addHypothesis','addControlledTest','addVerification','semanticStatus','sourceSemanticsConfirmed']:
    need(m in engineering,f'engineering evidence marker missing: {m}')
content=text('src/domains/learning/content-intelligence.js')
for m in ['Next learner actions','Content review queue','evidenceFingerprint','MM_CONTENT_INTELLIGENCE','openMobileMenu','data-mm-data-intelligence-menu','__MM_DATA_INTELLIGENCE_MORE__']:
    need(m in content,f'content intelligence/mobile access marker missing: {m}')
need('style=' not in content,'Data Intelligence must not emit inline style attributes under style-src-attr none')

manifest=json.loads(text('runtime-domain-manifest.json'));assets=manifest['assets']
for p in [x for x in required if x.startswith('src/domains/') and x.endswith('.js')]:
    need('./'+p in assets,f'runtime manifest missing {p}')
order=[
 './src/domains/shared/learner-scope.js','./src/domains/shared/data-spine.js','./src/domains/shared/signal-registry.js',
 './src/domains/assessment/assessment-analytics-v2.js',
 './src/domains/engineering/engineering-store.js','./src/domains/engineering/evidence-chain.js',
 './src/domains/learning/learning-analytics-loader.js','./src/domains/learning/activity-events-v2.js',
 './src/domains/learning/learner-model.js','./src/domains/materials/material-registry.js',
 './src/domains/materials/material-search-index.js','./src/domains/materials/material-observation-v2.js',
 './src/domains/process/evidence-granularity.js','./src/domains/learning/content-intelligence.js'
]
need(all(assets.index(order[i])<assets.index(order[i+1]) for i in range(len(order)-1)),'data activation runtime dependency order drifted')

service_worker=text('service-worker.js')
for asset in [x for x in assets if x.startswith('./src/domains/')]:
    need(asset in service_worker,f'offline core missing data/domain asset {asset}')

contract=json.loads(text('data/real-pilot-analysis-contract-v1.json'))
need(contract.get('status')=='pilot-ready','real pilot analysis must not claim completed validation')
need('No result authorises a production change' in contract.get('analysisBoundary',''),'pilot production-authority boundary missing')
with tempfile.TemporaryDirectory() as td:
    out=Path(td)/'report.json'
    r=subprocess.run(['python',str(ROOT/'tools/analyze_real_pilot.py'),'--input',str(ROOT/'qa/fixtures/real-pilot-analysis-synthetic.csv'),'--output',str(out),'--synthetic-fixture'],capture_output=True,text=True)
    need(r.returncode==0,f'synthetic pilot analysis failed: {r.stderr or r.stdout}')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['rawValuesEmitted'] is False,'pilot analysis emitted raw values')
    need(report['source']['rows']==6,'synthetic pilot row count drifted')
    need('fill_time_s' in report['comparisons'] and 'part_mass_g' in report['comparisons'],'pilot comparison signals missing')

print('MouldMaster data activation v1 QA passed (data spine, revision-safe assessment analytics, unified local events, learner model, typed materials, canonical signal semantics, explicit process evidence, engineering evidence chain, CSP-safe desktop/mobile content intelligence, real-pilot aggregate harness)')
