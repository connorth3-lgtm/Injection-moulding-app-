from pathlib import Path
from datetime import date, datetime, timedelta, timezone
import argparse, json, re, ssl, time, urllib.error, urllib.request

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'sources'/'RESEARCH_SOURCE_FRESHNESS.json'
REPORT=ROOT/'research-source-freshness-report.json'
DOI_RE=re.compile(r"https://doi\.org/10\.\d{4,9}/[^\s\"'<>`\]]+",re.I)

# CI runners use UTC, while review metadata may be recorded in the reviewer's
# local calendar date. Civil time zones can legitimately be one calendar day
# ahead of UTC, so tolerate exactly that boundary but reject anything further
# in the future. This keeps the future-date guard meaningful and cross-platform
# without depending on OS timezone databases.
MAX_LOCAL_DATE_LEAD_DAYS=1

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def parse_day(s): return datetime.strptime(s,'%Y-%m-%d').date()

def clean_doi_url(raw):
    url=raw.rstrip(".,;:]}`*")
    # Parentheses are valid inside legacy DOI suffixes. Remove only unmatched
    # closing punctuation added by surrounding prose/Markdown.
    while url.endswith(')') and url.count(')')>url.count('('):
        url=url[:-1].rstrip(".,;:]}`*")
    return url

def discover(data):
    need(data.get('schema')==1,'research freshness schema must be 1')
    today=date.today(); reviewed=parse_day(data['reviewed']); review_by=parse_day(data['review_by'])
    need(reviewed<=today+timedelta(days=MAX_LOCAL_DATE_LEAD_DAYS),'research freshness reviewed date is more than one local-calendar day in the future')
    need(review_by>reviewed,'research freshness review_by must follow reviewed')
    need(review_by>=today,'research DOI review is overdue')
    files=data.get('source_files') or []; need(len(files)>=5,'research freshness source-file set unexpectedly small')
    urls=set(); per_file={}; locations={}
    for name in files:
        p=ROOT/name; need(p.exists(),f'research freshness source file missing: {name}')
        found=[]
        for raw in DOI_RE.findall(p.read_text(encoding='utf-8')):
            url=clean_doi_url(raw)
            found.append(url); key=url.lower(); urls.add(key); locations.setdefault(key,[]).append(name)
        per_file[name]=len(set(x.lower() for x in found))
    minimum=int(data.get('doi_minimum',0)); need(minimum>=20,'research DOI minimum is too weak')
    need(len(urls)>=minimum,f'research DOI coverage unexpectedly small: {len(urls)} < {minimum}')
    need(all(u.startswith('https://doi.org/10.') and '`' not in u for u in urls),'invalid DOI resolver URL found')
    need(all(u.count('(')==u.count(')') for u in urls),'unbalanced DOI parentheses found')
    return sorted(urls),per_file,{u:sorted(set(v)) for u,v in locations.items()}

def check_doi(url):
    req=urllib.request.Request(url,headers={
        'User-Agent':'MouldMaster-Research-Freshness/1.1 (+https://github.com/connorth3-lgtm/Injection-moulding-app-)',
        'Accept':'application/vnd.citationstyles.csl+json, application/json;q=0.9, text/html;q=0.2, */*;q=0.1'
    })
    try:
        with urllib.request.urlopen(req,timeout=15,context=ssl.create_default_context()) as r:
            raw=r.read(250000); status=getattr(r,'status',200); final_url=r.geturl(); ctype=r.headers.get('content-type','')
        result='ok' if 200<=status<400 else 'unreachable'
        return {'url':url,'http_status':status,'final_url':final_url,'content_type':ctype,'bytes':len(raw),'result':result}
    except urllib.error.HTTPError as e:
        return {'url':url,'http_status':e.code,'final_url':getattr(e,'url',url),'result':'gone' if e.code in (404,410) else 'unreachable','error':f'HTTP {e.code}'}
    except Exception as e:
        return {'url':url,'result':'unreachable','error':type(e).__name__+': '+str(e)[:240]}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--network',action='store_true'); args=ap.parse_args()
    need(MANIFEST.exists(),'sources/RESEARCH_SOURCE_FRESHNESS.json missing')
    data=json.loads(MANIFEST.read_text(encoding='utf-8')); urls,per_file,locations=discover(data)
    report={'schema':1,'checked_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'mode':'network' if args.network else 'static','manifest_reviewed':data['reviewed'],'manifest_review_by':data['review_by'],'doi_count':len(urls),'source_file_counts':per_file,'source_locations':locations,'results':[]}
    gone=[]
    if args.network:
        # Resolve politely and deterministically rather than bursting dozens of
        # requests at doi.org, which can turn valid citations into HTTP 429s.
        for url in urls:
            time.sleep(0.30)
            result=check_doi(url); report['results'].append(result)
            if result['result']=='gone': gone.append(result['url'])
            elif result['result']=='unreachable': print(f"WARNING: DOI could not be resolved now: {result['url']} ({result.get('error','network/access restriction')})")
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    if gone: raise AssertionError('research DOI resolver returned 404/410; human source review required: '+', '.join(gone))
    print(f"MouldMaster research DOI freshness QA passed ({len(urls)} DOI citations; mode={report['mode']})")

if __name__=='__main__': main()
