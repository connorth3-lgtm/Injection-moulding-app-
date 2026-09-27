#!/usr/bin/env python3
import json, pathlib
ROOT=pathlib.Path(__file__).resolve().parent
p=ROOT/'data'/'asian-material-grade-extraction-wave1-v1.json'
d=json.loads(p.read_text())
rows=d.get('records',[])
assert len(rows)>=40, f'Asian material extraction unexpectedly small: {len(rows)}'
keys=set(); primary=0; conditioned=0; directional=0
for r in rows:
    for k in ('manufacturer','country','polymer','grade','conditioning','source','status'): assert r.get(k), (k,r)
    assert str(r['source']).startswith('https://'), r['source']
    key=(r['manufacturer'].lower(),r['grade'].lower())
    assert key not in keys, f'duplicate grade identity: {key}'
    keys.add(key)
    assert r['status'] in {'candidate-complete','candidate-partial','candidate-conditional','discovery-only'}
    if r['status']!='discovery-only': primary+=1
    txt=json.dumps(r).lower()
    if any(x in txt for x in ('conditioning','typical','not guaranteed','not specification','23c','mfr','mfi','mvr')): conditioned+=1
    if any(x in txt for x in ('flow_pct','transverse','parallel','perpendicular','clte_flow','clte_transverse','shrinkagemd','shrinkagetd')): directional+=1
assert primary>=35, primary
assert conditioned>=35, conditioned
assert directional>=10, directional
assert d.get('promotionRules',{}).get('noUniversalSettings') is True
assert d.get('promotionRules',{}).get('noInterpolationAcrossGrades') is True
print(f'PASS: {len(rows)} Asian material records; {primary} grade candidates; {directional} directional/anisotropy records')
