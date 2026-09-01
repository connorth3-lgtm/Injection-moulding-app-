#!/usr/bin/env python3
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'canonical-assessment-manifest-v1.json'
sys.path.insert(0,str(ROOT))
import qa_assessment_discrimination as discrimination

VERSION='2026.09.02.1'
REVIEWED='2026-09-02'
REVIEW_BY='2026-12-02'


def sha(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')).hexdigest()


def revision_map():
    path=ROOT/'sources'/'QUESTION_REVISION_INDEX.json'
    data=json.loads(path.read_text(encoding='utf-8'))
    out={x:1 for x in data.get('all_stable_ids',[])}
    for bucket in ('revision2','revision3'):
        for qid,row in data.get(bucket,{}).items():
            out[qid]=max(out.get(qid,1),int(row.get('revision',1)))
    return out


def measured_cases():
    src=(ROOT/'real-measured-data-assessment.js').read_text(encoding='utf-8')
    start=src.find('const CASES=[');end=src.find('\nconst esc=',start)
    if start<0 or end<=start:
        raise AssertionError('real measured-data CASES block not found')
    block=src[start:end]
    node="'use strict';\n"+block+"\nprocess.stdout.write(JSON.stringify(CASES));\n"
    p=subprocess.run(['node','-e',node],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    if p.returncode:
        raise AssertionError('could not extract real measured-data cases: '+(p.stderr or p.stdout)[:8000])
    rows=json.loads(p.stdout)
    if len(rows)!=4 or sum(len(x.get('questions',[])) for x in rows)!=12:
        raise AssertionError('real measured-data question coverage must remain 4 cases / 12 decisions')
    return rows


def evidence_for(item):
    kind=item.get('kind')
    if kind=='regional-exam':
        return {'mode':'direct-question-source','reference':item.get('reference',''),'sourceUrl':item.get('sourceUrl')}
    if kind in ('material-lab','optional-material-practice'):
        return {'mode':'explicit-source-ids','sourceIds':item.get('sourceIds',[]),'focus':item.get('focus','')}
    if kind=='diagnostic-lab':
        return {'mode':'mapped-authoritative-source','focus':item.get('focus',''),'labId':item.get('labId')}
    return {'mode':'mapped-or-direct-authoritative-source','reference':item.get('reference',''),'sourceUrl':item.get('sourceUrl'),'category':item.get('category','')}


def approval_for(item):
    kind=item.get('kind')
    if kind=='optional-material-practice':
        basis='canonical-v2 explicit source-ID governance'
    else:
        basis='existing evidence approval layer plus canonical-v2 runtime fingerprint'
    return {'status':'approved-internal','reviewedOn':REVIEWED,'reviewBy':REVIEW_BY,'basis':basis,'scope':'Internal educational content approval; not external accreditation or independent third-party SME endorsement.'}


def build_manifest():
    before,standardized,meta=discrimination.load_discrimination_runtime()
    if not meta or meta.get('status')!='approved':
        raise AssertionError(f'discrimination runtime not approved: {meta}')
    revisions=revision_map();target_ids=set(meta.get('targetIds') or [])
    items=[]
    for x in standardized:
        base_revision=revisions.get(x['id'],1)
        revision=base_revision+(1 if x['id'] in target_ids else 0)
        row={
            'id':x['id'],'kind':x['kind'],'scope':x.get('scope','formal'),'level':x.get('level',''),'region':x.get('region'),
            'labId':x.get('labId'),'category':x.get('category'),'stage':x.get('stage'),'critical':bool(x.get('critical')),
            'stem':x.get('stem',''),'options':x.get('options',[]),'answerKey':x.get('correct'),'rationale':x.get('rationale',''),'feedback':x.get('feedback',[]),
            'evidence':evidence_for(x),'approval':approval_for(x),'revision':revision,
            'runtimeLayers':['assessment-psychometric-hardening.js']+(['assessment-discrimination-hardening.js'] if x['id'] in target_ids else [])
        }
        row['fingerprint']='sha256-'+sha({k:row[k] for k in ['id','stem','options','answerKey','rationale','evidence','revision']})
        items.append(row)
    for case in measured_cases():
        for qi,q in enumerate(case['questions']):
            qid=f"measured:{case['id']}:{qi}"
            row={
                'id':qid,'kind':'real-measured-data','scope':'formative-measured','level':'','region':None,'labId':case['id'],'category':'measured-evidence','stage':f'decision-{qi+1}','critical':False,
                'stem':q[0],'options':q[1],'answerKey':q[2],'rationale':q[3],'feedback':[q[3] if i==q[2] else 'Re-check the audited data contract and its evidence boundary.' for i in range(4)],
                'evidence':{'mode':'pinned-measured-data-contract','sourceId':case.get('source'),'contractPath':case.get('contractPath'),'contractBlob':case.get('contractBlob'),'license':case.get('license'),'evidenceType':case.get('evidenceType'),'boundary':case.get('boundary')},
                'approval':{'status':'approved-internal','reviewedOn':REVIEWED,'reviewBy':REVIEW_BY,'basis':'pinned measured-data contract and explicit evidence boundary','scope':'Internal formative evidence-literacy approval; not a universal process-setting claim.'},
                'revision':1,'runtimeLayers':['real-measured-data-assessment.js']
            }
            row['fingerprint']='sha256-'+sha({k:row[k] for k in ['id','stem','options','answerKey','rationale','evidence','revision']})
            items.append(row)
    ids=[x['id'] for x in items]
    if len(items)!=209 or len(ids)!=len(set(ids)):
        raise AssertionError(f'canonical manifest must contain 209 unique decisions, got {len(items)} / {len(set(ids))}')
    counts={}
    for row in items:counts[row['kind']]=counts.get(row['kind'],0)+1
    fingerprints=[x['fingerprint'] for x in items]
    return {
        'schema':1,'version':VERSION,'reviewedOn':REVIEWED,'reviewBy':REVIEW_BY,
        'scope':'Canonical machine-generated learner assessment manifest. It covers the 197 standardized learner decisions plus 12 real-measured-data decisions. It is descriptive governance evidence, not external accreditation.',
        'counts':{'total':len(items),'standardized':197,'realMeasured':12,'byKind':dict(sorted(counts.items()))},
        'discriminationHardening':{'version':meta.get('version'),'targetedItems':meta.get('targetedItems'),'cueWarningsBefore':meta.get('cueWarningsBefore'),'cueWarningsAfter':meta.get('cueWarningsAfter'),'answerKeysChanged':meta.get('answerKeysChanged')},
        'runtimeFingerprint':'sha256-'+sha(fingerprints),'items':items
    }


def render(manifest):
    return json.dumps(manifest,ensure_ascii=False,indent=2,sort_keys=False)+'\n'


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    payload=render(build_manifest())
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding='utf-8')!=payload:
            print(f'{OUT.relative_to(ROOT)} is stale; run tools/generate_assessment_manifest.py',file=sys.stderr);return 1
        print('Canonical assessment manifest is current: 209 keyed learner decisions.');return 0
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(payload,encoding='utf-8');print(f'Wrote {OUT.relative_to(ROOT)} with 209 keyed learner decisions.');return 0


if __name__=='__main__':
    raise SystemExit(main())
