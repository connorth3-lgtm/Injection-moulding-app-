#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, time, urllib.parse, urllib.request
from pathlib import Path

WAVES=[
 'data/deep-dive-v2-100-pass.json','data/deep-dive-v2-wave2-100-pass.json','data/deep-dive-v2-wave3-100-pass.json',
 'data/deep-dive-v2-wave4-100-pass.json','data/deep-dive-v2-wave5-100-pass.json','data/deep-dive-v2-wave6-100-pass.json'
]
OPENALEX='https://api.openalex.org/works/https://doi.org/'
CROSSREF='https://api.crossref.org/works/'

PUBLISHER_ALLOW=[
 'elsevier','springer','wiley','sage','taylor & francis','informa','mdpi','ieee','american chemical society','acs',
 'royal society of chemistry','iop publishing','aip publishing','emerald','de gruyter','hanser','society of plastics engineers',
 'scientific.net','nature portfolio','hindawi','asme international','american society of mechanical engineers','cambridge university press',
 'oxford university press','world scientific','inderscience','sciencedirect'
]
EXPERIMENT_MARKERS=['experiment','experimental','measured','measurement','measurements','tested','testing','trial','trials','produced','moulded','molded','fabricated','manufactured','sensor','monitoring']
SIGNALS={
 'cavity-pressure':['cavity pressure'],'injection-pressure':['injection pressure'],'nozzle-pressure':['nozzle pressure'],
 'pressure':['pressure'],'temperature':['temperature','thermocouple'],'injection-flow':['injection flow','flow rate','flow curve'],
 'screw-position-velocity':['screw position','screw velocity','injection velocity'],'clamp-force':['clamping force','clamp force','tie-bar','tie bar'],
 'strain':['strain'],'ultrasound':['ultrasonic','ultrasound'],'dielectric-capacitance':['dielectric','capacitance'],
 'vibration-current':['vibration','motor current','electrical current'],'energy':['energy consumption','specific energy','electricity consumption'],
 'rheology-viscosity':['viscosity','rheology','melt flow'],'moisture':['moisture','water content']
}
OUTCOMES={
 'weight-mass':['part weight','product weight','weight','mass'],'dimensions':['dimension','dimensional','thickness'],
 'warpage-shrinkage':['warpage','shrinkage'],'mechanical-strength':['tensile','strength','modulus','impact'],
 'defect-quality':['defect','quality','short shot','burn mark','weld line','sink mark','void','flash'],
 'surface-morphology':['surface','morphology'],'energy':['energy'],'cycle-stability':['repeatability','stability','variation','cycle time']
}
REVIEW_MARKERS=['review','systematic review','literature review','survey']
SIM_MARKERS=['simulation only','numerical study only','finite element only','pure simulation']


def request_json(url, ua, timeout=60):
    req=urllib.request.Request(url,headers={'User-Agent':ua,'Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=timeout) as r: return json.load(r)

def norm_doi(x):
    if not x:return None
    x=x.strip().lower(); x=re.sub(r'^https?://(dx\.)?doi\.org/','',x); return x or None

def abstract_text(work):
    inv=work.get('abstract_inverted_index') or {}; pos=[]
    for tok,idxs in inv.items():
        for i in idxs: pos.append((i,tok))
    pos.sort(); return ' '.join(t for _,t in pos)

def extract_wave_records():
    by={}
    for path in WAVES:
        obj=json.loads(Path(path).read_text(encoding='utf-8'))
        passes=obj.get('passes') or []
        for p in passes:
            if isinstance(p,dict):
                pid=p.get('id'); title=p.get('title') or ''; theme=p.get('theme') or ''; status=p.get('status'); anchors=p.get('evidence_anchors') or []
            else:
                pid=p[0] if len(p)>0 else None; title=p[1] if len(p)>1 else ''; theme=p[2] if len(p)>2 else ''; status=p[3] if len(p)>3 else None; anchors=p[4] if len(p)>4 else []
            if status!='seeded_with_primary': continue
            for a in anchors:
                doi=norm_doi(a)
                if not doi or not doi.startswith('10.'): continue
                rec=by.setdefault(doi,{'doi':doi,'deepDiveLinks':[]})
                rec['deepDiveLinks'].append({'passId':pid,'title':title,'theme':theme,'wavePath':path})
    return by

def marker_hits(text, rules):
    out=[]
    for label,needles in rules.items():
        if any(n in text for n in needles): out.append(label)
    return out

def first_crossref_date(msg):
    for k in ['published-print','published-online','published','issued']:
        dp=((msg.get(k) or {}).get('date-parts') or [])
        if dp and dp[0]: return dp[0][0]
    return None

def verify_one(doi, links, ua):
    rec={'doi':doi,'deepDiveLinks':links,'verification':{}}
    cr=None; oa=None; errors=[]
    try:
        cr=request_json(CROSSREF+urllib.parse.quote(doi,safe=''),ua).get('message') or {}
    except Exception as e: errors.append('crossref:'+type(e).__name__)
    try:
        oa=request_json(OPENALEX+urllib.parse.quote(doi,safe='/.'),ua)
    except Exception as e: errors.append('openalex:'+type(e).__name__)
    title=''; venue=''; publisher=''; year=None; oa_type=None; source_type=None; is_oa=False; authors=[]; abstract=''
    if cr:
        title=((cr.get('title') or [''])[0] or '').strip(); venue=((cr.get('container-title') or [''])[0] or '').strip(); publisher=(cr.get('publisher') or '').strip(); year=first_crossref_date(cr)
    if oa:
        title=title or (oa.get('title') or '').strip(); year=year or oa.get('publication_year'); oa_type=oa.get('type')
        src=((oa.get('primary_location') or {}).get('source') or {}); venue=venue or (src.get('display_name') or '').strip(); source_type=src.get('type')
        is_oa=bool((oa.get('open_access') or {}).get('is_oa')); abstract=abstract_text(oa)
        for a in oa.get('authorships') or []:
            nm=((a.get('author') or {}).get('display_name') or '').strip()
            if nm and nm not in authors: authors.append(nm)
            if len(authors)>=12: break
    text=(title+' '+abstract).lower()
    exact_injection=bool(re.search(r'\binjection[-\s](?:mold|mould)(?:ing|ed)?\b|\bmicro[-\s]?injection\b',text))
    review_like=any(m in text for m in REVIEW_MARKERS)
    simulation_only=any(m in text for m in SIM_MARKERS)
    exp_hits=sorted({m for m in EXPERIMENT_MARKERS if m in text})
    sig_hits=marker_hits(text,SIGNALS); out_hits=marker_hits(text,OUTCOMES)
    cr_type=(cr or {}).get('type'); publisher_ok=any(p in publisher.lower() for p in PUBLISHER_ALLOW) if publisher else False
    journal_article=bool(cr_type=='journal-article' and oa_type=='article' and source_type=='journal' and venue and title)
    bibliographic_verified=bool(cr and oa and norm_doi(oa.get('doi'))==doi and journal_article)
    peer_reviewed_confirmed=bool(bibliographic_verified and publisher_ok)
    primary_measured=bool(peer_reviewed_confirmed and exact_injection and not review_like and not simulation_only and exp_hits and sig_hits and out_hits)
    rec.update({'title':title,'year':year,'venue':venue,'publisher':publisher,'authors':authors,'isOpenAccess':is_oa,
                'crossrefType':cr_type,'openAlexType':oa_type,'sourceType':source_type})
    rec['classification']={'exactInjectionMouldingText':exact_injection,'reviewLike':review_like,'simulationOnly':simulation_only,
                           'experimentalMarkerHits':exp_hits[:12],'measuredSignalHits':sig_hits,'measuredOutcomeHits':out_hits,
                           'themes':sorted({x.get('theme') for x in links if x.get('theme')})}
    rec['finding']=('Measured injection-moulding study evidence involving '+', '.join(sig_hits[:5])+' with outcomes '+', '.join(out_hits[:5])+'.') if primary_measured else 'Bibliographic anchor screened against publisher/OpenAlex metadata; not promoted as primary measured unless explicit experimental signal/outcome criteria are met.'
    rec['limitation']='Evidence remains specific to the cited study material, machine, mould, measurement setup and experimental design; it is not a universal production setting or standalone causal diagnosis.'
    rec['verification']={'bibliographicReviewed':bibliographic_verified,'publisherJournalConfirmed':bool(cr_type=='journal-article' and publisher_ok),
                         'peerReviewedConfirmed':peer_reviewed_confirmed,'primaryMeasuredReviewed':primary_measured,
                         'reviewMethod':'Crossref DOI metadata + OpenAlex journal/abstract screening + Deep Dive seeded-primary provenance',
                         'errors':errors}
    return rec

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--output',default='data/deep-dive-anchor-verification-v1.json'); ap.add_argument('--sleep',type=float,default=.08); ap.add_argument('--mailto',default=''); args=ap.parse_args()
    ua='MouldMasterEvidenceVerifier/1.0'+((' mailto:'+args.mailto) if args.mailto else '')
    anchors=extract_wave_records(); out=[]
    for i,(doi,base) in enumerate(sorted(anchors.items()),1):
        out.append(verify_one(doi,base['deepDiveLinks'],ua))
        if i%25==0: print('verified',i,'/',len(anchors),flush=True)
        time.sleep(args.sleep)
    payload={'schema':1,'reviewed':'2026-08-28','sourceAnchorCount':len(out),
             'bibliographicVerifiedCount':sum(r['verification']['bibliographicReviewed'] for r in out),
             'peerReviewedConfirmedCount':sum(r['verification']['peerReviewedConfirmed'] for r in out),
             'primaryMeasuredReviewedCount':sum(r['verification']['primaryMeasuredReviewed'] for r in out),
             'records':out,
             'boundary':'Only records passing DOI agreement, journal-article metadata, approved academic publisher, exact injection-moulding text, explicit experimental markers, measured-signal markers and measured-outcome markers are promoted by this automated explicit-review pass. Failed/ambiguous records remain non-counting.'}
    Path(args.output).parent.mkdir(parents=True,exist_ok=True); Path(args.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({k:payload[k] for k in ['sourceAnchorCount','bibliographicVerifiedCount','peerReviewedConfirmedCount','primaryMeasuredReviewedCount']},indent=2))
if __name__=='__main__': main()
