#!/usr/bin/env python3
"""Prove the pinned CC BY 4.0 Sustainability supplement and emit compact schema evidence."""
from __future__ import annotations
import csv, hashlib, io, json, tempfile, urllib.request, zipfile
from pathlib import Path

URL='https://mdpi-res.com/d_attachment/sustainability/sustainability-13-08102/article_deploy/sustainability-13-08102-s001.zip'
EXPECTED_SHA='b546abea4eb9f14b6736dec415dc43c00240965b91de4c7ca92b2494321c6ace'
MEMBER='sustainability-1272832-supplementary.csv'
EXPECTED_ROWS=955


def main():
    out=Path('measured-source-proof'); out.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp:
        with urllib.request.urlopen(URL, timeout=60) as r:
            while True:
                chunk=r.read(1024*1024)
                if not chunk: break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0)
        digest=hashlib.sha256(tmp.read()).hexdigest()
        if digest!=EXPECTED_SHA: raise SystemExit(f'Sustainability SHA mismatch: {digest}')
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as z:
            if MEMBER not in z.namelist(): raise SystemExit(f'missing expected member {MEMBER}')
            raw=z.read(MEMBER).decode('utf-8-sig')
    reader=csv.DictReader(io.StringIO(raw))
    rows=list(reader)
    if len(rows)!=EXPECTED_ROWS: raise SystemExit(f'row count mismatch: {len(rows)}')
    headers=reader.fieldnames or []
    selected=['Cycle #','Cycle Time, s','Max Inj Pres, MPa','Max Cav1 Pres, MPa','Inj Flow Rate, ccps','Melt Temp, C','Thickness, mm','Max Strain, pct','Ult Stress, MPa','Modulus, MPa','Toughness, MJ/m^3']
    missing=[h for h in selected if h not in headers]
    if missing: raise SystemExit(f'missing governed fields: {missing}')
    def rng(name):
        vals=[float(r[name]) for r in rows if r[name].strip()!='']
        return [min(vals),max(vals)]
    proof={'schemaVersion':1,'status':'source-proof-passed','datasetId':'su13148102-supplement','url':URL,'sha256':'sha256:'+digest,'sourceMember':MEMBER,'rows':len(rows),'columns':len(headers),'headers':headers,'governedFieldRanges':{name:rng(name) for name in selected},'rawSourceRetained':False,'boundary':'Exact source proof and aggregate ranges only; raw rows are not retained or uploaded.'}
    (out/'sustainability-source-proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':proof['status'],'datasetId':proof['datasetId'],'sha256':proof['sha256'],'rows':proof['rows'],'columns':proof['columns']},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
