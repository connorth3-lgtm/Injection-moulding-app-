from __future__ import annotations
import argparse,csv,hashlib,json,math,re
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data/real-pilot-analysis-contract-v1.json'
FORBIDDEN=('customer','operator','person','name','email','phone','address','timestamp','datetime','comment','free_text')
def num(v):
    try:
        x=float(v);return x if math.isfinite(x) else None
    except Exception:return None
def mean(xs):return sum(xs)/len(xs) if xs else None
def controlled_quality(value,contract):
    raw=str(value or '').strip().lower()
    if not raw:return 'missing'
    allowed={str(x).strip().lower() for x in contract.get('allowedQualityValues',[]) if str(x).strip()}
    if raw in allowed:return raw
    pattern=str(contract.get('qualityAliasPattern') or '')
    if pattern and re.fullmatch(pattern,raw):return raw
    raise SystemExit('Prepared file contains uncontrolled/free-text quality_result value; use a controlled value or local preparer alias before aggregate analysis')
def main():
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--approved',action='store_true');p.add_argument('--synthetic-fixture',action='store_true');a=p.parse_args()
    if not (a.approved or a.synthetic_fixture):raise SystemExit('Refusing real pilot analysis without --approved. Use --synthetic-fixture only for repository QA data.')
    contract=json.loads(CONTRACT.read_text(encoding='utf-8'));raw=a.input.read_bytes();rows=list(csv.DictReader(raw.decode('utf-8-sig').splitlines()));
    if not rows:raise SystemExit('No data rows')
    headers=list(rows[0]);missing=[x for x in contract['requiredColumns'] if x not in headers]
    if missing:raise SystemExit('Missing required columns: '+', '.join(missing))
    bad=[h for h in headers if any(term in h.lower() for term in FORBIDDEN)]
    if bad:raise SystemExit('Prepared file contains forbidden identifier/free-text fields: '+', '.join(bad))
    quality_values=[controlled_quality(r.get('quality_result',''),contract) for r in rows]
    numeric=[]
    for h in headers:
        vals=[num(r.get(h,'')) for r in rows];present=[x for x in vals if x is not None]
        if present and len(present)>=max(2,len(rows)//2) and h!='shot_index':numeric.append(h)
    if len(numeric)<contract['minimumNumericSignals']:raise SystemExit('Not enough numeric process/quality signals')
    phases=defaultdict(list)
    for r in rows:
        ph=str(r.get('phase','')).strip().lower()
        if ph not in contract['allowedPhases']:raise SystemExit('Unknown phase: '+ph)
        phases[ph].append(r)
    comparisons={}
    for h in numeric:
        pm={ph:mean([x for x in (num(r.get(h,'')) for r in rs) if x is not None]) for ph,rs in phases.items()}
        b,f,rec=pm.get('baseline'),pm.get('fault'),pm.get('recovery')
        delta=None if b is None or f is None else f-b
        recovery_distance=None if b is None or rec is None else abs(rec-b)
        fault_distance=None if b is None or f is None else abs(f-b)
        recovery_fraction=None if not fault_distance else max(0.0,1-recovery_distance/fault_distance)
        comparisons[h]={'phaseMeans':pm,'faultMinusBaseline':delta,'recoveryTowardBaselineFraction':recovery_fraction}
    result={'schema':1,'version':contract['version'],'status':'aggregate-review-required','source':{'sha256':hashlib.sha256(raw).hexdigest(),'rows':len(rows),'columns':len(headers),'syntheticFixture':bool(a.synthetic_fixture)},'phaseCounts':{k:len(v) for k,v in phases.items()},'qualityCounts':dict(Counter(quality_values)),'numericSignals':numeric,'comparisons':comparisons,'rawValuesEmitted':False,'boundary':contract['analysisBoundary']}
    a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
if __name__=='__main__':main()
