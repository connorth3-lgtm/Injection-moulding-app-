from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parent
PACKS=[
    'process-data-20-pass-01-05.js',
    'process-data-20-pass-06-10.js',
    'process-data-20-pass-11-15.js',
    'process-data-20-pass-16-20.js',
]
ATLAS='process-data-20-pass-atlas.js'
OVERLAY='process-atlas-case-evidence.js'
ARTIFACT=ROOT/'data'/'process-atlas-case-evidence-v1.json'


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


for name in [*PACKS,ATLAS,OVERLAY]:
    need((ROOT/name).exists(),f'missing case-evidence dependency: {name}')
    p=subprocess.run(['node','--check',str(ROOT/name)],capture_output=True,text=True)
    need(p.returncode==0,f'{name} syntax error: {p.stderr or p.stdout}')

node=r'''
const fs=require('fs'),vm=require('vm');
global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}},MM_EVIDENCE_SOURCES:{sources:{}}};
global.document={addEventListener(){},getElementById(){return null;},createElement(){return {style:{},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{appendChild(){}}};
global.requestAnimationFrame=f=>f();global.clearTimeout=()=>{};global.setTimeout=f=>{f();return 1};
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
process.stdout.write(JSON.stringify({atlas:window.MM_PROCESS_DATA_20_PASS_ATLAS,meta:window.MM_PROCESS_ATLAS_CASE_EVIDENCE}));
'''%(json.dumps([str(ROOT/x) for x in PACKS]),json.dumps(str(ROOT/ATLAS)),json.dumps(str(ROOT/ATLAS)),json.dumps(str(ROOT/OVERLAY)),json.dumps(str(ROOT/OVERLAY)))
p=subprocess.run(['node','-e',node],capture_output=True,text=True,encoding='utf-8',errors='replace')
need(p.returncode==0,'case-level atlas evidence runtime failed: '+(p.stderr or p.stdout)[:8000])
data=json.loads(p.stdout);atlas=data['atlas'];meta=data['meta']
need(meta and meta.get('status')=='approved',f'case-level evidence mapping not approved: {meta}')
need(meta.get('cases')==200,'all 200 atlas cases must receive case-level evidence')
need(atlas.get('caseEvidenceCount')==200 and len(atlas.get('caseEvidence',[]))==200,'atlas case-evidence export incomplete')
need(meta.get('uniqueSourceSignatures',0)>=20,'case evidence must not collapse to one global source signature')
by_id={x['id']:x for x in atlas['datasets']}
for row in atlas['caseEvidence']:
    cid=row['id'];need(cid in by_id,f'unknown mapped case {cid}')
    d=by_id[cid];ids=row.get('sourceIds',[]);pass_ids=d.get('passSourceIds',[])
    need(len(ids)>=2,f'{cid} must retain at least two case-level evidence sources')
    need(set(ids).issubset(set(pass_ids)),f'{cid} case mapping invented a source outside the reviewed pass pool')
    records=row.get('caseEvidence',[]);need(len(records)==len(ids),f'{cid} case evidence records/source IDs mismatch')
    roles={r.get('role') for r in records};need('mechanism-context' in roles and 'measurement-or-verification-method' in roles,f'{cid} must separate mechanism and measurement/verification evidence roles')
    for r in records:
        need(r.get('sourceId') in ids,f'{cid} evidence record references an unselected source')
        need(r.get('selection')=='case-token-ranked-from-reviewed-pass-sources',f'{cid} mapping mode drifted')

need(ARTIFACT.exists(),'checked-in process-atlas case-evidence artifact is missing')
check=subprocess.run(['python','tools/generate_process_case_evidence.py','--check'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
need(check.returncode==0,'checked-in process-atlas case-evidence artifact drifted: '+(check.stderr or check.stdout)[:8000])
artifact=json.loads(ARTIFACT.read_text(encoding='utf-8'))
need(artifact.get('schema')==1 and artifact.get('version')=='2026.09.02.1','case-evidence artifact schema/version drifted')
need(len(artifact.get('cases',[]))==200 and artifact.get('meta',{}).get('cases')==200,'case-evidence artifact must contain 200 mappings')
need(artifact.get('meta',{}).get('uniqueSourceSignatures')==meta.get('uniqueSourceSignatures'),'case-evidence artifact/runtime signature count mismatch')

idx=(ROOT/'index.html').read_text(encoding='utf-8');sw=(ROOT/'service-worker.js').read_text(encoding='utf-8');pkg=json.loads((ROOT/'desktop/electron/package.json').read_text(encoding='utf-8'));integ=(ROOT/'desktop/electron/scripts/generate-integrity.cjs').read_text(encoding='utf-8')
resources={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need(OVERLAY in idx,'browser shell missing process-atlas-case-evidence.js')
need("'./process-atlas-case-evidence.js'" in sw,'offline cache missing process-atlas-case-evidence.js')
need('../../process-atlas-case-evidence.js' in resources,'desktop package missing process-atlas-case-evidence.js')
need("'process-atlas-case-evidence.js'" in integ,'desktop integrity manifest missing process-atlas-case-evidence.js')
need(idx.index("'./process-data-20-pass-atlas.js'") < idx.index("'./process-atlas-case-evidence.js'") < idx.index("'./process-data-local-intake.js'"),'case evidence overlay must load immediately after the atlas')
print('Process-atlas case evidence QA passed: 200 explicit case mappings, reviewed-source subsets only, deterministic artifact current, mechanism and verification roles separated.')
