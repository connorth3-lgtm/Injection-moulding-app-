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
 'data/assessment-decision-manifest-v1.json','tools/generate_assessment_decision_manifest.py',
 'tools/analyze_real_pilot.py','qa/fixtures/real-pilot-analysis-synthetic.csv',
 'qa_process_evidence_granularity.py','qa_assessment_decision_manifest.py'
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
for m in ['questionRevision','bankVersion','choiceFingerprint','choiceFingerprint(questionId,revision,text)','question-and-revision-scoped fingerprints','authoredDifficulty','observedDifficulty','stable question ID plus explicit revision']:
    need(m in assessment,f'assessment analytics v2 marker missing: {m}')

activity=text('src/domains/learning/activity-events-v2.js')
for m in ['mm_activity_events_v2::','material-lab','assessmentSnapshot','choiceFingerprints','last:q.last||null','No names, notes, free text, raw answer text']:
    need(m in activity,f'activity v2 marker missing: {m}')
for forbidden in ['fetch(','XMLHttpRequest','WebSocket','sendBeacon(']:
    need(forbidden not in activity,f'activity events must remain local-only: {forbidden}')

learner=text('src/domains/learning/learner-model.js')
for m in ['mastery','confidence','forgettingRisk','stuckness','learningVelocity','transferStrength','recommendations','last:q.last||null']:
    need(m in learner,f'learner model marker missing: {m}')
recency_node=f"""
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync({json.dumps(str(ROOT/'src/domains/learning/learner-model.js'))},'utf8');
function risk(last){{
  const context={{window:{{MM_ACTIVITY_EVENTS_V2:{{events:()=>[],assessmentSnapshot:()=>({{questions:[{{competency:'recency-test',concept:'recency-concept',attempts:5,correct:5,wrong:0,last}}]}})}}}}}}}};
  vm.createContext(context);vm.runInContext(source,context);
  return context.window.MM_LEARNER_MODEL.build().topics.find(x=>x.key==='competency:recency-test').forgettingRisk;
}}
const fresh=risk(new Date().toISOString());
const stale=risk(new Date(Date.now()-40*86400000).toISOString());
process.stdout.write(JSON.stringify({{fresh,stale}}));
"""
r=subprocess.run(['node','-e',recency_node],capture_output=True,text=True)
need(r.returncode==0,'learner assessment recency runtime failed: '+(r.stderr or r.stdout))
recency=json.loads(r.stdout)
need(recency['fresh']<45,'fresh formal assessment must not be classified as spaced-retrieval overdue')
need(recency['stale']>=45,'stale formal assessment must still become spaced-retrieval due')

material=text('src/domains/materials/material-observation-v2.js')
for m in ['quantity','propertyKey','semanticStatus','range','scalar','existing material-grade v2']:
    need(m in material,f'material v2 projection marker missing: {m}')
schema=json.loads(text('data/materials/material-grade-v2.schema.json'))
quantity=schema.get('$defs',{}).get('quantity',{})
need('oneOf' in quantity and any(x.get('properties',{}).get('kind',{}).get('const')=='range' for x in quantity['oneOf']),'material v2 schema must support typed ranges')
need('fingerprint' in schema.get('$defs',{}).get('sourceDocument',{}).get('properties',{}),'material v2 schema must retain source fingerprints')

process=text('src/domains/process/evidence-granularity.js')
for m in ['explicit-pass-inherited','case-context-subset-from-pass-reviewed-pool','case-token-ranked-from-reviewed-pass-sources','passSourceIds','context-support-not-direct-validation','uniqueAtlasSourceSignatures','directValidationClaimed']:
    need(m in process,f'process evidence granularity marker missing: {m}')
need('relevance aid, not a new scientific claim' in process,'atlas source ranking boundary must reject promotion to scientific validation')
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

atlas_qa=subprocess.run(['python',str(ROOT/'qa_process_evidence_granularity.py')],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
need(atlas_qa.returncode==0,'atlas contextual evidence QA failed: '+(atlas_qa.stderr or atlas_qa.stdout)[:8000])
print(atlas_qa.stdout.strip())

decision_qa=subprocess.run(['python',str(ROOT/'qa_assessment_decision_manifest.py')],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
need(decision_qa.returncode==0,'canonical assessment decision identity QA failed: '+(decision_qa.stderr or decision_qa.stdout)[:8000])
print(decision_qa.stdout.strip())

contract=json.loads(text('data/real-pilot-analysis-contract-v1.json'))
need(contract.get('status')=='pilot-ready','real pilot analysis must not claim completed validation')
need('No result authorises a production change' in contract.get('analysisBoundary',''),'pilot production-authority boundary missing')
need('pass' in contract.get('allowedQualityValues',[]) and contract.get('qualityAliasPattern')=='quality-result-[0-9]{2,}','pilot quality-output privacy contract drifted')
with tempfile.TemporaryDirectory() as td:
    td=Path(td);out=td/'report.json'
    r=subprocess.run(['python',str(ROOT/'tools/analyze_real_pilot.py'),'--input',str(ROOT/'qa/fixtures/real-pilot-analysis-synthetic.csv'),'--output',str(out),'--synthetic-fixture'],capture_output=True,text=True)
    need(r.returncode==0,f'synthetic pilot analysis failed: {r.stderr or r.stdout}')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['rawValuesEmitted'] is False,'pilot analysis emitted raw values')
    need(report['source']['rows']==6,'synthetic pilot row count drifted')
    need('fill_time_s' in report['comparisons'] and 'part_mass_g' in report['comparisons'],'pilot comparison signals missing')
    need(set(report['qualityCounts']).issubset({'pass','fail'}),'synthetic pilot quality counts must remain controlled labels')

    source=(ROOT/'qa/fixtures/real-pilot-analysis-synthetic.csv').read_text(encoding='utf-8')
    unsafe=td/'unsafe-quality.csv';unsafe.write_text(source.replace(',PASS,',',Customer X reject,',1),encoding='utf-8')
    unsafe_out=td/'unsafe-report.json'
    bad=subprocess.run(['python',str(ROOT/'tools/analyze_real_pilot.py'),'--input',str(unsafe),'--output',str(unsafe_out),'--synthetic-fixture'],capture_output=True,text=True)
    need(bad.returncode!=0,'pilot analyzer must reject uncontrolled/free-text quality_result values')
    need('uncontrolled/free-text quality_result' in (bad.stderr+bad.stdout),'pilot quality-label rejection must be explicit')
    need(not unsafe_out.exists(),'pilot analyzer must fail before writing an aggregate report containing uncontrolled quality labels')

    aliased=td/'aliased-quality.csv';aliased.write_text(source.replace(',PASS,',',quality-result-01,',1),encoding='utf-8')
    aliased_out=td/'aliased-report.json'
    alias_run=subprocess.run(['python',str(ROOT/'tools/analyze_real_pilot.py'),'--input',str(aliased),'--output',str(aliased_out),'--synthetic-fixture'],capture_output=True,text=True)
    need(alias_run.returncode==0,'pilot analyzer must accept local-preparer pseudonymous quality aliases')
    alias_report=json.loads(aliased_out.read_text(encoding='utf-8'))
    need('quality-result-01' in alias_report['qualityCounts'],'pseudonymous quality alias must survive only as its governed alias')

print('MouldMaster data activation v1 QA passed (data spine, canonical governed decision manifest, question/revision-scoped assessment analytics with recency, unified local events, learner model, typed materials, canonical signal semantics, contextual atlas evidence relevance, engineering evidence chain, CSP-safe desktop/mobile content intelligence, privacy-gated real-pilot aggregate harness)')
