#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'process-atlas-case-evidence-v1.json'
PACKS=['process-data-20-pass-01-05.js','process-data-20-pass-06-10.js','process-data-20-pass-11-15.js','process-data-20-pass-16-20.js']
ATLAS='process-data-20-pass-atlas.js';OVERLAY='process-atlas-case-evidence.js'


def build():
    node=r'''
const fs=require('fs'),vm=require('vm');
global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}},MM_EVIDENCE_SOURCES:{sources:{}}};
global.document={addEventListener(){},getElementById(){return null;},createElement(){return {style:{},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{appendChild(){}}};
global.requestAnimationFrame=f=>f();global.clearTimeout=()=>{};global.setTimeout=f=>{f();return 1};
for(const f of %s)vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
vm.runInThisContext(fs.readFileSync(%s,'utf8'),{filename:%s});
process.stdout.write(JSON.stringify({meta:window.MM_PROCESS_ATLAS_CASE_EVIDENCE,cases:window.MM_PROCESS_DATA_20_PASS_ATLAS.caseEvidence}));
'''%(json.dumps([str(ROOT/x) for x in PACKS]),json.dumps(str(ROOT/ATLAS)),json.dumps(str(ROOT/ATLAS)),json.dumps(str(ROOT/OVERLAY)),json.dumps(str(ROOT/OVERLAY)))
    p=subprocess.run(['node','-e',node],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    if p.returncode:raise AssertionError('case evidence runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout)
    if data.get('meta',{}).get('status')!='approved' or len(data.get('cases',[]))!=200:raise AssertionError(f'case evidence mapping not approved: {data.get("meta")}')
    return {'schema':1,'version':'2026.09.02.1','scope':'Machine-generated case-level source-role mapping for the 200 normalized synthetic process-data atlas cases. Sources are selected only from each case pass reviewed source pool; token ranking is a relevance aid, not a new scientific claim.','meta':data['meta'],'cases':data['cases']}


def render(x):return json.dumps(x,ensure_ascii=False,indent=2)+'\n'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args();payload=render(build())
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding='utf-8')!=payload:
            print(f'{OUT.relative_to(ROOT)} is stale; run tools/generate_process_case_evidence.py',file=sys.stderr);return 1
        print('Process-atlas case evidence artifact is current: 200 cases.');return 0
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(payload,encoding='utf-8');print(f'Wrote {OUT.relative_to(ROOT)} with 200 case-level mappings.');return 0

if __name__=='__main__':raise SystemExit(main())
