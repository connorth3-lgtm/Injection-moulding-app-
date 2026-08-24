from pathlib import Path
from datetime import date, datetime
import argparse, json, re, ssl, urllib.request

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'sources'/'SOURCE_FRESHNESS.json'
REPORT=ROOT/'source-freshness-report.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def parse_day(s): return datetime.strptime(s,'%Y-%m-%d').date()

def static_check(data):
    need(data.get('schema')==1,'source freshness schema must be 1')
    reviewed=parse_day(data['reviewed']); review_by=parse_day(data['review_by']); today=date.today()
    need(reviewed<=today,'source freshness reviewed date cannot be in the future')
    need(review_by>reviewed,'source freshness review_by must be later than reviewed')
    need(review_by>=today,'authoritative source review is overdue; refresh source status before release')
    rows=data.get('sources',[]); need(len(rows)>=8,'source freshness manifest unexpectedly small')
    ids=[]; urls=[]
    for x in rows:
        ids.append(x.get('id')); urls.append(x.get('url'))
        need(x.get('id') and re.fullmatch(r'[a-z0-9-]+',x['id']),'source id must be stable kebab-case')
        need(str(x.get('url','')).startswith('https://'),'freshness sources must use HTTPS')
        need(x.get('authority') and x.get('kind') and x.get('status'),'freshness source metadata incomplete')
        need(isinstance(x.get('expected_any'),list) and len(x['expected_any'])>=2,'each freshness source needs multiple expected markers')
    need(len(ids)==len(set(ids)),'duplicate source freshness ids')
    need(len(urls)==len(set(urls)),'duplicate source freshness urls')
    return rows

def fetch_source(row):
    req=urllib.request.Request(row['url'],headers={'User-Agent':'MouldMaster-Source-Freshness/1.0 (+https://github.com/connorth3-lgtm/Injection-moulding-app-)','Accept':'text/html,application/xhtml+xml,application/pdf;q=0.5,*/*;q=0.1'})
    try:
        with urllib.request.urlopen(req,timeout=20,context=ssl.create_default_context()) as r:
            raw=r.read(1_500_000); status=getattr(r,'status',200); ctype=r.headers.get('content-type','')
        page=raw.decode('utf-8','ignore').lower()
        markers=[m for m in row['expected_any'] if m.lower() in page]
        return {'id':row['id'],'url':row['url'],'http_status':status,'content_type':ctype,'matched_markers':markers,'result':'ok' if markers else 'changed-marker'}
    except Exception as e:
        return {'id':row['id'],'url':row['url'],'result':'unreachable','error':type(e).__name__+': '+str(e)[:240]}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--network',action='store_true'); args=ap.parse_args()
    need(MANIFEST.exists(),'sources/SOURCE_FRESHNESS.json missing')
    data=json.loads(MANIFEST.read_text(encoding='utf-8')); rows=static_check(data)
    report={'schema':1,'checked_at':datetime.utcnow().replace(microsecond=0).isoformat()+'Z','mode':'network' if args.network else 'static','manifest_reviewed':data['reviewed'],'manifest_review_by':data['review_by'],'results':[]}
    changed=[]
    if args.network:
        for row in rows:
            result=fetch_source(row); report['results'].append(result)
            if result['result']=='changed-marker': changed.append(row['id'])
            elif result['result']=='unreachable': print(f"WARNING: {row['id']} could not be checked: {result.get('error')}")
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    if changed: raise AssertionError('authoritative source marker changed; human review required: '+', '.join(changed))
    print(f"MouldMaster source freshness QA passed ({len(rows)} authoritative sources; mode={report['mode']})")

if __name__=='__main__': main()
