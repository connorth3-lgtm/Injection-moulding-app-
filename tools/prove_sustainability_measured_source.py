#!/usr/bin/env python3
"""Prove the pinned CC BY 4.0 Sustainability supplement and emit compact schema evidence."""
from __future__ import annotations
import csv, hashlib, io, json, tempfile, urllib.request, zipfile
from pathlib import Path

URLS=[
 'https://www.mdpi.com/article/10.3390/su13148102/s1',
 'https://mdpi-res.com/d_attachment/sustainability/sustainability-13-08102/article_deploy/sustainability-13-08102-s001.zip'
]
EXPECTED_SHA='b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace'
MEMBER='sustainability-1272832-supplementary.csv'
EXPECTED_ROWS=955
HEADERS={'User-Agent':'Mozilla/5.0 (compatible; MouldMaster measured evidence verification)','Referer':'https://www.mdpi.com/2071-1050/13/14/8102','Accept':'application/zip,application/octet-stream,*/*'}


def retrieve(tmp):
    errors=[]
    for url in URLS:
        try:
            req=urllib.request.Request(url,headers=HEADERS)
            with urllib.request.urlopen(req,timeout=60) as r:
                payload=r.read()
            if not payload.startswith(b'PK'):
                errors.append(f'{url}: response was not a ZIP ({len(payload)} bytes)')
                continue
            tmp.seek(0); tmp.truncate(0); tmp.write(payload); tmp.flush()
            return url
        except Exception as exc:
            errors.append(f'{url}: {exc}')
    raise SystemExit('Sustainability public supplement retrieval failed: '+'; '.join(errors))


def main():
    out=Path('measured-source-proof'); out.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp:
        used_url=retrieve(tmp)
        tmp.seek(0); digest=hashlib.sha256(tmp.read()).hexdigest()
        if digest!=EXPECTED_SHA: raise SystemExit(f'Sustainability SHA mismatch: {digest}')
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as z:
            if MEMBER not in z.namelist(): raise SystemExit(f'missing expected member {MEMBER}')
            raw=z.read(MEMBER).decode('utf-8-sig')
    reader=csv.DictReader(io.StringIO(raw)); rows=list(reader)
    if len(rows)!=EXPECTED_ROWS: raise SystemExit(f'row count mismatch: {len(rows)}')
    headers=reader.fieldnames or []
    selected=['Cycle #','Cycle Time, s','Max Inj Pres, MPa','Max Cav1 Pres, MPa','Inj Flow Rate, ccps','Melt Temp, C','Thickness, mm','Max Strain, pct','Ult Stress, MPa','Modulus, MPa','Toughness, MJ/m^3']
    missing=[h for h in selected if h not in headers]
    if missing: raise SystemExit(f'missing governed fields: {missing}')
    def rng(name):
        vals=[float(r[name]) for r in rows if r[name].strip()!='']
        return [min(vals),max(vals)]
    proof={'schemaVersion':1,'status':'source-proof-passed','datasetId':'su13148102-supplement','retrievalUrl':used_url,'sha256':'sha256:'+digest,'sourceMember':MEMBER,'rows':len(rows),'columns':len(headers),'headers':headers,'governedFieldRanges':{name:rng(name) for name in selected},'rawSourceRetained':False,'boundary':'Exact source proof and aggregate ranges only; raw rows are not retained or uploaded.'}
    (out/'sustainability-source-proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':proof['status'],'datasetId':proof['datasetId'],'sha256':proof['sha256'],'rows':proof['rows'],'columns':proof['columns']},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
