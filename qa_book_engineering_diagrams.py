#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re

ROOT=Path(__file__).resolve().parent
LEDGER=ROOT/'data/book-engineering-diagrams-v1.json'
SME=ROOT/'data/book-sme-review-v1.json'
BINDING=ROOT/'data/book-sme-release-binding-v1.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def git_blob_sha1(path):
    body=path.read_bytes()
    return hashlib.sha1(f'blob {len(body)}\0'.encode()+body).hexdigest()

data=json.loads(LEDGER.read_text(encoding='utf-8'))
binding=json.loads(BINDING.read_text(encoding='utf-8'))
rows=data.get('diagrams') or []
need(data.get('release')==binding.get('contentRelease') and data.get('status')=='governed-instructional-diagrams','diagram release identity mismatch')
need(len(rows)==8 and len({x['id'] for x in rows})==8 and len({x['chapterId'] for x in rows})==8,'diagram identity/chapter coverage mismatch')
for row in rows:
    path=ROOT/row['asset']
    need(path.is_file(),f"missing diagram asset: {row['asset']}")
    need(re.fullmatch(r'[0-9a-f]{40}',str(row.get('gitBlobSha1') or '')) is not None,f"invalid diagram hash: {row['id']}")
    need(git_blob_sha1(path)==row['gitBlobSha1'],f"diagram byte drift: {row['id']}")
    text=path.read_text(encoding='utf-8')
    for marker in ['<title','<desc','role="img"']:
        need(marker in text,f"diagram accessibility marker missing: {row['id']} / {marker}")
    need(row.get('alt') and row.get('caption'),'diagram learner explanation missing')
boundary=data.get('authorityBoundary') or {}
need(boundary=={'productionUse':'advisory-only','machineSpecific':False,'scaleDrawing':False,'validatedDesignAuthority':False,'independentSmeStatus':'hold'},'diagram authority boundary weakened')
sme=json.loads(SME.read_text(encoding='utf-8'))
need(sme.get('status')=='hold' and sme.get('reviews')==[],'diagram integration must not manufacture independent SME approval')
need(sme.get('diagramIds')==[x['id'] for x in rows],'SME contract does not cover every governed diagram')
print('MouldMaster Book diagram QA passed: 8 exact-byte instructional SVGs retain accessibility and non-design/non-scale boundaries.')
