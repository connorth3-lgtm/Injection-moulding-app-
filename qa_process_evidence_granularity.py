from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parent
MODULE=ROOT/'src/domains/process/evidence-granularity.js'
EVIDENCE=ROOT/'assessment-evidence-sources.js'
ATLAS=ROOT/'process-data-20-pass-atlas.js'
PACKS=[
    ROOT/'process-data-20-pass-01-05.js',
    ROOT/'process-data-20-pass-06-10.js',
    ROOT/'process-data-20-pass-11-15.js',
    ROOT/'process-data-20-pass-16-20.js',
]


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


for path in [MODULE,EVIDENCE,ATLAS,*PACKS]:
    need(path.exists(),f'missing process evidence dependency: {path.relative_to(ROOT)}')
for path in [MODULE,EVIDENCE,ATLAS,*PACKS]:
    p=subprocess.run(['node','--check',str(path)],capture_output=True,text=True,encoding='utf-8',errors='replace')
    need(p.returncode==0,f'{path.relative_to(ROOT)} syntax error: {p.stderr or p.stdout}')

node=r'''
const fs=require('fs'),vm=require('vm');
global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}}};
global.document={
  addEventListener(){},getElementById(){return null;},
  createElement(){return {style:{},appendChild(){},addEventListener(){}}},
  head:{appendChild(){}},body:{appendChild(){}}
};
global.requestAnimationFrame=f=>f();
global.clearTimeout=()=>{};
global.setTimeout=f=>{f();return 1};
function load(path){vm.runInThisContext(fs.readFileSync(path,'utf8'),{filename:path})}
load(process.argv[1]);
window.MM_PROCESS_DATA_20_PASS_PACKS=[];
for(const path of JSON.parse(process.argv[2]))load(path);
load(process.argv[3]);
window.MM_PROCESS_EVIDENCE_DATASETS={datasets:Array.from({length:14},(_,i)=>({id:`guided-${i+1}`,sourceIds:['autodesk-fill-pack','nist-doe']}))};
window.MM_PROCESS_DATA_DEEP_DIVE_PACKS=[{cases:Array.from({length:50},(_,i)=>[`deep-${i+1}`,'Synthetic QA case','qa',['autodesk-fill-pack','nist-doe']])}];
window.MM_DATA_SPINE={fingerprint:value=>`qa:${JSON.stringify(value).length}`};
const before=JSON.stringify(window.MM_PROCESS_DATA_20_PASS_ATLAS.datasets.map(d=>({id:d.id,sourceIds:d.sourceIds})));
load(process.argv[4]);
const api=window.MM_PROCESS_CASE_EVIDENCE;
const records=api.records();
const summary=api.summary();
const after=JSON.stringify(window.MM_PROCESS_DATA_20_PASS_ATLAS.datasets.map(d=>({id:d.id,sourceIds:d.sourceIds})));
const registry=window.MM_EVIDENCE_SOURCES;
window.MM_EVIDENCE_SOURCES=null;
const fallback=api.records();
window.MM_EVIDENCE_SOURCES=registry;
process.stdout.write(JSON.stringify({records,summary,before,after,fallback,boundary:api.boundary}));
'''
proc=subprocess.run([
    'node','-e',node,str(EVIDENCE),json.dumps([str(x) for x in PACKS]),str(ATLAS),str(MODULE)
],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
need(proc.returncode==0,'process evidence runtime QA failed: '+(proc.stderr or proc.stdout)[:8000])
data=json.loads(proc.stdout)
records=data['records'];summary=data['summary']
atlas=[x for x in records if x.get('passId')]
need(len(records)==264,f'expected 264 process evidence records, got {len(records)}')
need(summary.get('total')==264,'process evidence summary total drift')
need(summary.get('caseSupported')==64,'guided + deep case-supported count must remain 64')
need(len(atlas)==200,'all 200 atlas cases must receive explicit evidence records')
need(summary.get('atlasContextSubsets')==200,'all atlas cases must receive contextual case source subsets when the evidence registry is available')
need(summary.get('explicitPassInherited')==0,'normal runtime must not fall back to pass-inherited evidence when reviewed source metadata is available')
need(summary.get('uniqueAtlasSourceSignatures',0)>=20,'atlas contextual mapping must not collapse to one global source signature')
need(summary.get('directValidationClaimed')==0,'contextual source selection must never claim direct validation')
need(data['before']==data['after'],'case-context evidence derivation must not mutate authored atlas sourceIds')
for row in atlas:
    selected=row.get('sourceIds') or []
    pool=row.get('passSourceIds') or []
    evidence=row.get('caseEvidence') or []
    need(row.get('granularity')=='case-context-subset-from-pass-reviewed-pool',f"{row.get('caseId')} granularity drift")
    need(row.get('relationship')=='context-support-not-direct-validation',f"{row.get('caseId')} relationship drift")
    need(row.get('selection')=='case-token-ranked-from-reviewed-pass-sources',f"{row.get('caseId')} selection mode drift")
    need(len(selected)==2 and len(set(selected))==2,f"{row.get('caseId')} must select two distinct contextual sources")
    need(set(selected).issubset(set(pool)),f"{row.get('caseId')} selected a source outside its reviewed pass pool")
    need(len(evidence)==2 and {x.get('role') for x in evidence}=={'mechanism-context','measurement-or-verification-method'},f"{row.get('caseId')} contextual evidence roles drift")
    need(all(x.get('sourceId') in selected for x in evidence),f"{row.get('caseId')} role references an unselected source")
    need(all(x.get('selection')=='case-token-ranked-from-reviewed-pass-sources' for x in evidence),f"{row.get('caseId')} role selection provenance drift")

fallback_atlas=[x for x in data['fallback'] if x.get('passId')]
need(len(fallback_atlas)==200,'fallback path must retain all 200 atlas records')
need(all(x.get('granularity')=='explicit-pass-inherited' for x in fallback_atlas),'missing evidence registry must fail closed to pass-inherited context')
need(all(x.get('relationship')=='context-support-not-direct-validation' for x in fallback_atlas),'fallback must remain contextual only')
need(all(x.get('sourceIds')==x.get('passSourceIds') for x in fallback_atlas),'fallback must preserve the complete reviewed pass source pool')
need('relevance aid, not a new scientific claim' in data['boundary'],'boundary must explicitly reject token ranking as new scientific validation')
print(f"Process evidence granularity QA passed: {summary['atlasContextSubsets']} atlas case-context subsets, {summary['uniqueAtlasSourceSignatures']} source signatures, zero direct-validation claims, non-mutating fallback-safe derivation.")
