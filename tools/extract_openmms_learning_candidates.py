#!/usr/bin/env python3
"""Extract distinct compact OpenMMS authoring candidates from the exact pinned CSV."""
from __future__ import annotations
import csv, hashlib, json, math, tempfile, urllib.request
from pathlib import Path

from prove_openmms_measured_source import URL, EXPECTED_SHA256, EXPECTED_HEADER, EXPECTED_ROWS

OUT=Path('measured-source-proof/openmms-unreviewed-learning-candidates.json')
META={
 'T1':('temperature-1','degC','t','time','s'), 'T2':('temperature-2','degC','t','time','s'),
 'P':('cavity-pressure','bar','t','time','s'), 'F':('extraction-force','N','t','time','s'),
 'Ax':('acceleration-x','g','t2','time','s'), 'Ay':('acceleration-y','g','t2','time','s'), 'Az':('acceleration-z','g','t2','time','s'),
 'Gx':('angular-velocity-x','dps/1000','t2','time','s'), 'Gy':('angular-velocity-y','dps/1000','t2','time','s'), 'Gz':('angular-velocity-z','dps/1000','t2','time','s'),
}

def canonical_sha(v): return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()

def uniform_indices(n,limit=400):
    if n<=limit:return list(range(n))
    return sorted({round(i*(n-1)/(limit-1)) for i in range(limit)})

def window_indices(center,n,radius=100): return list(range(max(0,center-radius),min(n,center+radius+1)))

def signal(channel,rows,indices,reduction):
    semantic,unit,xch,xsem,xunit=META[channel]
    x=[rows[i][xch] for i in indices]; y=[rows[i][channel] for i in indices]
    rep={'xSemantic':xsem,'xUnit':xunit,'xDirection':'increasing','reductionMethod':reduction,'originalPointCount':len(indices),'x':x,'y':y}
    return {'id':channel.lower(),'label':channel,'sourceChannel':channel,'semantic':semantic,'unit':unit,'representation':rep,'representationFingerprint':canonical_sha(rep)}

def candidate(cid,rows,indices,channels,suggested,selection,fp,reduction):
    sigs=[signal(ch,rows,indices,reduction) for ch in channels]
    return {'candidateId':cid,'datasetId':'openmms-t4g','sourceArtifact':'Real_World_Test/Case_Study_Raw_Data.csv','sourceFingerprint':fp,'sourceScope':selection,'signals':sigs,'candidateFingerprint':canonical_sha(sigs),'suggestedCatalogueCases':suggested,'evidenceBoundary':'Compact real sensor evidence from one public case-study recording. Sensor co-movement and event alignment can be observed; these measurements alone do not establish a production root cause or repeatability across independent cycles.'}

def main():
    OUT.parent.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.csv') as tmp:
        with urllib.request.urlopen(URL,timeout=60) as r:
            while True:
                chunk=r.read(1024*1024)
                if not chunk:break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0); payload=tmp.read(); digest=hashlib.sha256(payload).hexdigest()
        if digest!=EXPECTED_SHA256: raise SystemExit(f'OpenMMS SHA mismatch: {digest}')
        tmp.seek(0); reader=csv.DictReader((line.decode('utf-8-sig') for line in tmp))
        if reader.fieldnames!=EXPECTED_HEADER: raise SystemExit(f'OpenMMS header drift: {reader.fieldnames}')
        rows=[]
        for r in reader:
            p={k:float(r[k]) for k in EXPECTED_HEADER}
            if not all(math.isfinite(v) for v in p.values()): raise SystemExit('non-finite OpenMMS value')
            rows.append(p)
    if len(rows)!=EXPECTED_ROWS: raise SystemExit(f'OpenMMS row drift: {len(rows)}')
    if not all(a['t']<b['t'] and a['t2']<b['t2'] for a,b in zip(rows,rows[1:])): raise SystemExit('OpenMMS time ordering drift')
    pressure_peak=max(range(len(rows)),key=lambda i:rows[i]['P'])
    accel_peak=max(range(len(rows)),key=lambda i:rows[i]['Ax']**2+rows[i]['Ay']**2+rows[i]['Az']**2)
    coarse=uniform_indices(len(rows),400)
    pwin=window_indices(pressure_peak,len(rows),100)
    awin=window_indices(accel_peak,len(rows),100)
    fp='sha256:'+digest
    candidates=[
        candidate('OPENMMS-PRESSURE-EVENT-01',rows,pwin,['P','F','T1','T2'],['MLM-021','MLM-025','MLM-026','MLM-058'],{'selection':'201-row source-order window centred on global cavity-pressure maximum','rowStart':pwin[0],'rowEndExclusive':pwin[-1]+1,'centreRow':pressure_peak},fp,'contiguous-source-window-no-interpolation'),
        candidate('OPENMMS-MOTION-EVENT-01',rows,awin,['Ax','Ay','Az','Gx','Gy','Gz'],['MLM-027','MLM-059'],{'selection':'201-row source-order window centred on maximum delivered three-axis acceleration magnitude','rowStart':awin[0],'rowEndExclusive':awin[-1]+1,'centreRow':accel_peak},fp,'contiguous-source-window-no-interpolation'),
        candidate('OPENMMS-DUAL-TIMEBASE-OVERVIEW-01',rows,coarse,['P','T1','Ax','Gx'],['MLM-014','MLM-057','MLM-058'],{'selection':'400-point deterministic overview across the full delivered case-study recording','sourceRows':len(rows),'displayedRows':len(coarse),'timeBases':['t','t2']},fp,'deterministic-endpoint-preserving-index-reduction'),
    ]
    result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':len(candidates),'candidates':candidates,'boundary':'Authoring evidence only. The pressure, motion and dual-time-base selections are deterministic and intentionally distinct. Independent review is required before any learner promotion.'}
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'candidateCount':len(candidates),'candidateIds':[c['candidateId'] for c in candidates]},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
