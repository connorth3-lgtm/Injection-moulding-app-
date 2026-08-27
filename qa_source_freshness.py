from pathlib import Path
from datetime import date, datetime, timezone
import argparse, json, re, ssl, urllib.error, urllib.request

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
    rows=data.get('sources',[]); need(len(rows)>=12,'source freshness manifest unexpectedly small')
    ids=[]; urls=[]
    for x in rows:
        ids.append(x.get('id')); urls.append(x.get('url'))
        need(x.get('id') and re.fullmatch(r'[a-z0-9-]+',x['id']),'source id must be stable kebab-case')
        need(str(x.get('url','')).startswith('https://'),'freshness sources must use HTTPS')
        need(x.get('authority') and x.get('kind') and x.get('status'),'freshness source metadata incomplete')
        need(isinstance(x.get('expected_any'),list) and len(x['expected_any'])>=2,'each freshness source needs multiple expected markers')
        network_check=x.get('network_check','markers')
        need(network_check in ('markers','reachability'),'network_check must be markers or reachability')
        groups=x.get('expected_groups')
        if groups is not None:
            need(isinstance(groups,list) and groups,'expected_groups must be a non-empty list')
            need(all(isinstance(g,list) and g and all(str(m).strip() for m in g) for g in groups),'expected_groups entries must contain marker alternatives')
    need(len(ids)==len(set(ids)),'duplicate source freshness ids')
    need(len(urls)==len(set(urls)),'duplicate source freshness urls')
    return rows

def fetch_source(row):
    req=urllib.request.Request(row['url'],headers={'User-Agent':'MouldMaster-Source-Freshness/1.2 (+https://github.com/connorth3-lgtm/Injection-moulding-app-)','Accept':'text/html,application/xhtml+xml,application/pdf;q=0.5,*/*;q=0.1'})
    try:
        with urllib.request.urlopen(req,timeout=20,context=ssl.create_default_context()) as r:
            raw=r.read(2_000_000); status=getattr(r,'status',200); ctype=r.headers.get('content-type',''); final_url=r.geturl()
        base={'id':row['id'],'url':row['url'],'final_url':final_url,'http_status':status,'content_type':ctype}
        if status!=200:
            return {**base,'result':'unreachable','error':f'HTTP {status}; marker content not evaluated'}
        if row.get('network_check','markers')=='reachability':
            return {**base,'bytes':len(raw),'result':'ok-reachability'}
        media=ctype.split(';',1)[0].strip().lower()
        if media and media not in ('text/html','application/xhtml+xml','text/plain','application/xml','text/xml'):
            return {**base,'bytes':len(raw),'result':'unreachable','error':f'HTTP 200 {media}; marker text not evaluated'}
        page=raw.decode('utf-8','ignore').lower()
        markers=[m for m in row['expected_any'] if m.lower() in page]
        groups=row.get('expected_groups') or []
        group_results=[]
        for group in groups:
            matched=[m for m in group if m.lower() in page]
            group_results.append({'expected':group,'matched':matched})
        if groups:
            ok=all(x['matched'] for x in group_results)
        else:
            ok=bool(markers)
        return {**base,'matched_markers':markers,'marker_groups':group_results,'result':'ok' if ok else 'changed-marker'}
    except urllib.error.HTTPError as e:
        return {'id':row['id'],'url':row['url'],'http_status':e.code,'result':'gone' if e.code in (404,410) else 'unreachable','error':f'HTTP {e.code}'}
    except Exception as e:
        return {'id':row['id'],'url':row['url'],'result':'unreachable','error':type(e).__name__+': '+str(e)[:240]}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--network',action='store_true'); args=ap.parse_args()
    need(MANIFEST.exists(),'sources/SOURCE_FRESHNESS.json missing')
    data=json.loads(MANIFEST.read_text(encoding='utf-8')); rows=static_check(data)
    quality=(ROOT/'assessment-quality-suite.js').read_text(encoding='utf-8')
    shell=(ROOT/'pwa-shell.js').read_text(encoding='utf-8')
    need(f"const SOURCE_REVIEWED='{data['reviewed']}'" in quality,'assessment source-reviewed date must match the authoritative manifest')
    need(f"const SOURCE_REVIEW_BY='{data['review_by']}'" in quality,'assessment source review-by date must match the authoritative manifest')
    need('sourceReviewDisplayDate' in shell and 'qualitySuite?.sourceFreshnessReviewed' in shell,'visible standards review date must derive from validated assessment source metadata')
    need('References reviewed\\s+\\d{1,2}' in shell,'visible standards review-date replacement must accept future review dates')
    need('26 August 2026' not in shell,'PWA shell must not pin a specific source-review date')
    report={'schema':1,'checked_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'mode':'network' if args.network else 'static','manifest_reviewed':data['reviewed'],'manifest_review_by':data['review_by'],'results':[]}
    changed=[]; gone=[]
    if args.network:
        for row in rows:
            result=fetch_source(row); report['results'].append(result)
            if result['result']=='changed-marker': changed.append(row['id'])
            elif result['result']=='gone': gone.append(row['id'])
            elif result['result']=='unreachable': print(f"WARNING: {row['id']} could not be marker-checked: {result.get('error')}")
        successful=sum(x['result'] in ('ok','ok-reachability') for x in report['results'])
        report['network_coverage']={'successful':successful,'total':len(rows),'minimum':(len(rows)+1)//2}
        need(successful>=(len(rows)+1)//2,'source freshness network coverage below 50%; retry before treating the run as successful')
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    failures=[]
    if changed: failures.append('official source identity/status marker changed: '+', '.join(changed))
    if gone: failures.append('official source returned 404/410: '+', '.join(gone))
    if failures: raise AssertionError('; '.join(failures)+'; human review required')
    print(f"MouldMaster source freshness QA passed ({len(rows)} authoritative sources; mode={report['mode']})")

if __name__=='__main__': main()
