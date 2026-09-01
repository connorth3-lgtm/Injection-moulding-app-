from pathlib import Path
import hashlib
import json
import subprocess

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'data'/'canonical-assessment-manifest-v1.json'


def need(ok,msg):
    if not ok: raise AssertionError(msg)

need(MANIFEST.exists(),'canonical assessment manifest is missing')
p=subprocess.run(['python','tools/generate_assessment_manifest.py','--check'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
need(p.returncode==0,'canonical manifest drifted: '+(p.stderr or p.stdout)[:8000])
data=json.loads(MANIFEST.read_text(encoding='utf-8'))
need(data.get('schema')==1 and data.get('version')=='2026.09.02.1','canonical manifest schema/version drifted')
need(data.get('counts',{}).get('total')==209,'canonical manifest must cover 209 keyed decisions')
need(data['counts'].get('standardized')==197 and data['counts'].get('realMeasured')==12,'197 + 12 assessment split drifted')
items=data.get('items',[]);need(len(items)==209,'canonical item array length mismatch')
ids=[x.get('id') for x in items];need(len(ids)==len(set(ids)),'canonical stable IDs must be unique')
for x in items:
    need(isinstance(x.get('stem'),str) and x['stem'].strip(),f"{x.get('id')} stem missing")
    need(isinstance(x.get('options'),list) and len(x['options'])==4 and len(set(x['options']))==4,f"{x.get('id')} option integrity failed")
    need(isinstance(x.get('answerKey'),int) and 0<=x['answerKey']<4,f"{x.get('id')} answer key invalid")
    need(isinstance(x.get('rationale'),str) and x['rationale'].strip(),f"{x.get('id')} rationale missing")
    need(x.get('approval',{}).get('status')=='approved-internal',f"{x.get('id')} approval tracking missing")
    need(isinstance(x.get('revision'),int) and x['revision']>=1,f"{x.get('id')} revision missing")
    fp=x.get('fingerprint','');need(fp.startswith('sha256-') and len(fp)==71,f"{x.get('id')} fingerprint malformed")
    need(x.get('evidence',{}).get('mode'),f"{x.get('id')} evidence mode missing")
need(data.get('discriminationHardening',{}).get('targetedItems')==111,'canonical manifest must record the 111-item discrimination rewrite')
need(data['discriminationHardening'].get('cueWarningsAfter')==0,'canonical manifest contains unresolved audited cue warnings')
need(str(data.get('runtimeFingerprint','')).startswith('sha256-'),'canonical runtime fingerprint missing')
print('Canonical assessment manifest QA passed: 209 unique keyed decisions, evidence/approval/revision/fingerprint fields present and generator output deterministic.')
