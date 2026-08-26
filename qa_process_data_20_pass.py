from pathlib import Path
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parent
PACKS=[
    'process-data-20-pass-01-05.js',
    'process-data-20-pass-06-10.js',
    'process-data-20-pass-11-15.js',
    'process-data-20-pass-16-20.js',
]
ENGINE='process-data-20-pass-atlas.js'
ALL=[*PACKS,ENGINE]


def text(name):
    return (ROOT/name).read_text(encoding='utf-8')


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


for name in ALL:
    need((ROOT/name).exists(),f'20-pass dependency missing: {name}')
    p=subprocess.run(['node','--check',str(ROOT/name)],capture_output=True,text=True)
    need(p.returncode==0,f'{name} syntax error: {p.stderr or p.stdout}')

node_pack="""
const fs=require('fs'),vm=require('vm');global.window={};
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
process.stdout.write(JSON.stringify(window.MM_PROCESS_DATA_20_PASS_PACKS));
""" % json.dumps([str(ROOT/x) for x in PACKS])
p=subprocess.run(['node','-e',node_pack],capture_output=True,text=True)
need(p.returncode==0,'could not execute 20-pass data packs: '+p.stderr)
passes=json.loads(p.stdout)
need(len(passes)==20,f'expected 20 passes, got {len(passes)}')
nums=[x.get('pass') for x in passes]
need(sorted(nums)==list(range(1,21)),f'pass numbers must be exactly 1..20, got {nums}')
need(len(set(x.get('id') for x in passes))==20,'pass IDs must be unique')

raw=[]
for pack in passes:
    need(isinstance(pack.get('title'),str) and len(pack['title'])>=8,f"pass {pack.get('pass')} title missing")
    need(isinstance(pack.get('domain'),str) and pack['domain'],f"pass {pack.get('pass')} domain missing")
    need(isinstance(pack.get('purpose'),str) and len(pack['purpose'])>=30,f"pass {pack.get('pass')} purpose too weak")
    source_ids=pack.get('sourceIds',[])
    need(isinstance(source_ids,list) and len(source_ids)>=2,f"pass {pack.get('pass')} needs at least two source IDs")
    need(len(set(source_ids))==len(source_ids),f"pass {pack.get('pass')} repeats source IDs")
    cases=pack.get('cases',[])
    need(len(cases)==10,f"pass {pack.get('pass')} must retain exactly 10 cases")
    for case in cases:
        raw.append((pack,case))

need(len(raw)==200,f'expected 200 retained cases, got {len(raw)}')
ids=[case[0] for _,case in raw]
need(len(set(ids))==200,'all 200 case IDs must be unique')

for pack,case in raw:
    need(isinstance(case,list) and len(case)==8,f"pass {pack['pass']} / {case[0] if case else '?'} must use the 8-field case schema")
    cid,title,signals,fault,diagnosis,next_evidence,verification,trap=case
    need(re.fullmatch(r'p\d{2}-[a-z0-9-]+',cid) is not None,f'{cid} must use a stable pass-prefixed ID')
    need(cid.startswith(f"p{pack['pass']:02d}-"),f'{cid} must belong to pass {pack["pass"]}')
    need(isinstance(title,str) and len(title.strip())>=10,f'{cid} title is too weak')
    need(isinstance(signals,list) and len(signals)==4,f'{cid} must contain exactly four linked signals')
    signal_names=[]
    changed=0
    for sig in signals:
        need(isinstance(sig,list) and len(sig)==4,f'{cid} signal schema must be [name,baseline,delta,recovery]')
        name,baseline,delta,recovery=sig
        signal_names.append(name)
        need(isinstance(name,str) and name.endswith('_idx'),f'{cid}/{name} must be an explicit normalized index signal')
        need(all(isinstance(x,(int,float)) for x in (baseline,delta,recovery)),f'{cid}/{name} values must be numeric')
        need(baseline==100 and recovery==100,f'{cid}/{name} must use normalized known-good baseline/recovery index 100')
        need(40 <= baseline+delta <= 180,f'{cid}/{name} fault index {baseline+delta} exceeds the normalized training range')
        if abs(delta)>1e-12:
            changed+=1
    need(len(set(signal_names))==4,f'{cid} signal names must be unique')
    need(changed>=2,f'{cid} must contain at least two meaningful fault-phase signal changes')
    for label,value,min_len in [
        ('observed pattern',fault,35),('ranked mechanism',diagnosis,35),('next evidence',next_evidence,35),('verification',verification,35),('compensation trap',trap,25)
    ]:
        need(isinstance(value,str) and len(value.strip())>=min_len,f'{cid} {label} is too weak')
    need('do not' in trap.lower(),f'{cid} compensation trap must explicitly say what not to mask/compensate')
    need(not re.search(r'\b(?:set|use|run)\s+\d+(?:\.\d+)?\s*(?:°?c|mpa|bar|mm/s|kn|rpm)\b',fault+' '+diagnosis+' '+next_evidence+' '+verification+' '+trap,re.I),f'{cid} must not contain universal production instructions')

# Every source ID used by a pass must be known to the existing evidence library, first 50-case layer, evidence maturity layer, or this atlas.
source_text='\n'.join(text(x) for x in ['assessment-evidence-sources.js','evidence-maturity-deep-dive.js','process-data-deep-dive-50.js',ENGINE])
known_source_ids=set(re.findall(r"['\"]([a-z0-9][a-z0-9-]+)['\"]\s*:\s*\{\s*name\s*:",source_text,re.I))
for pack in passes:
    for sid in pack['sourceIds']:
        need(sid in known_source_ids,f"pass {pack['pass']} references unknown evidence source {sid}")

node_runtime="""
const fs=require('fs'),vm=require('vm');
global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}},MM_EVIDENCE_SOURCES:{sources:{}}};
global.document={addEventListener(){},getElementById(){return null;},createElement(){return {style:{},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{appendChild(){}}};
global.requestAnimationFrame=f=>f();global.clearTimeout=()=>{};global.setTimeout=f=>{f();return 1};
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
const x=window.MM_PROCESS_DATA_20_PASS_ATLAS;
process.stdout.write(JSON.stringify({passes:x.passes,cases:x.cases,datasets:x.datasets,scope:x.scope,sources:window.MM_EVIDENCE_SOURCES.sources}));
""" % (json.dumps([str(ROOT/x) for x in PACKS]),json.dumps(str(ROOT/ENGINE)),json.dumps(str(ROOT/ENGINE)))
p=subprocess.run(['node','-e',node_runtime],capture_output=True,text=True)
need(p.returncode==0,'20-pass atlas runtime failed: '+p.stderr)
runtime=json.loads(p.stdout)
need(len(runtime['passes'])==20,'runtime must expose all 20 passes')
need(len(runtime['cases'])==200 and len(runtime['datasets'])==200,'runtime must expose all 200 cases/datasets')
rows=0
for d in runtime['datasets']:
    need(len(d['rows'])==72,f"{d['id']} must generate 72 cycles")
    rows+=len(d['rows'])
    phases=[r['phase'] for r in d['rows']]
    need(phases.count('baseline')==24 and phases.count('fault')==24 and phases.count('recovery')==24,f"{d['id']} phase counts must be 24/24/24")
    need(d.get('phaseCounts')=={'baseline':24,'fault':24,'recovery':24},f"{d['id']} phaseCounts drifted")
    need(d.get('normalisation',{}).get('baselineIndex')==100,f"{d['id']} must expose baseline index 100")
    need(len(d.get('signals',{}))==4,f"{d['id']} runtime signal count drifted")
need(rows==14400,f'20-pass atlas must generate 14,400 rows, got {rows}')
need('outside formal assessment' in runtime['scope'] and 'not a production recipe' in runtime['scope'] and 'universal setpoints' in runtime['scope'], 'runtime scope must preserve education/production boundary')

engine=text(ENGINE)
for marker in [
    '200 advanced process-data cases','20','200','14,400','baseline index 100','normalized known-good signature',
    'not a production recipe','Ranked root-cause mechanism','Best next evidence','Verification','Compensation trap',
    'do not mistake masking for root-cause correction','Search 200 process-data cases','Filter atlas by pass','MM_PROCESS_DATA_20_PASS_ATLAS'
]:
    need(marker in engine,f'atlas learner/safety marker missing: {marker}')
need('MutationObserver' not in engine,'20-pass atlas must use explicit lifecycle integration, not a document-wide MutationObserver')
for forbidden in ['fetch(', 'XMLHttpRequest', 'WebSocket', 'MM_DATA.exams=', 'regionalQuestions=', 'correctIndex=', 'MM_EVIDENCE_APPROVAL.records=', 'question_bank_version=']:
    need(forbidden not in engine,f'atlas must remain local-only and outside formal assessment: {forbidden}')

for sid,doi in {
    'switchover-review-2025':'10.3390/polym17081096',
    'thermal-control-review-2022':'10.3390/ma15124048',
    'ai-cognition-2025':'10.1007/s00170-025-15611-x',
    'warpage-review-2025':'10.1177/14644207241285399',
    'conformal-cooling-review-2020':'10.3934/mbe.2020292',
    'monitor-control-review-2018':'10.1016/j.procir.2017.12.229',
}.items():
    need(sid in runtime['sources'],f'new atlas source not registered: {sid}')
    need(doi.lower() in runtime['sources'][sid]['url'].lower(),f'new atlas source identity drifted: {sid}')

idx=text('index.html'); sw=text('service-worker.js'); pkg=json.loads(text('desktop/electron/package.json')); integrity=text('desktop/electron/scripts/generate-integrity.cjs')
resource_from={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for f in ALL:
    need(f in idx,f'browser shell missing {f}')
    need(f"'./{f}'" in sw,f'offline cache missing {f}')
    need('../../'+f in resource_from,f'desktop package missing {f}')
    need("'"+f+"'" in integrity,f'desktop integrity manifest missing {f}')
need(idx.index("'./process-data-deep-dive-50.js'") < idx.index("'./process-data-20-pass-01-05.js'") < idx.index("'./process-data-20-pass-atlas.js'") < idx.index("'./curriculum-integration.js'"),'atlas must load after the 50-case layer and before curriculum integration')

for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/publish-open-desktop.yml','.github/workflows/microsoft-store-msix.yml']:
    body=text(wf)
    need('python qa_process_data_20_pass.py' in body,f'{wf} must gate the 20-pass atlas')
qa=text('.github/workflows/qa.yml')
for f in ALL:
    need(f'node --check {f}' in qa,f'release syntax gate missing {f}')

workspace=text('mould-master-workspace.js')
need('MM_PROCESS_DATA_DEEP_DIVE_50' in workspace and 'MM_PROCESS_DATA_20_PASS_ATLAS' in workspace,'Mould Master casebook must search guided, 50-case and 20-pass data libraries')
for alias in ['PP','PC','ABS','POM','PET','PBT','TPU','PMMA','PEEK','PPS','LCP','HDPE','PA66']:
    need(alias in workspace,f'Mould Master token matching must preserve material alias {alias}')

mobile=text('qa/mobile-viewport.spec.js')
for marker in ['Open 20-pass · 200-case atlas','200 advanced process-data cases','data-at20-pass','Inspect evidence case','Compensation trap']:
    need(marker in mobile,f'real mobile browser QA must exercise atlas marker: {marker}')

print('MouldMaster 20-pass process-data atlas QA passed (20 passes; 200 unique cases; 4 normalized signals each; 14,400 cycles; root-cause/evidence/verification/compensation separation; local-only; browser/PWA/desktop packaged)')
