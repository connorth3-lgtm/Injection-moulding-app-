#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, io, json, posixpath, re, urllib.request, zipfile
from pathlib import Path, PurePosixPath
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data/public-benchmark-contracts/nylon12-gamma-8c8fjwcw86-v1.json'
UA='MouldMaster-Educational-Evidence-Profiler/1.0'
PUBLIC_BASE='https://data.mendeley.com/public-files/datasets/8c8fjwcw86/files'

def get(url):
    req=urllib.request.Request(url,headers={'Accept':'*/*','User-Agent':UA})
    with urllib.request.urlopen(req,timeout=180) as r: return r.read()

def safe(name):
    p=PurePosixPath(name); return not p.is_absolute() and '..' not in p.parts

def xml_text(data):
    try: root=ET.fromstring(data)
    except ET.ParseError: return []
    return [' '.join(e.text.split()) for e in root.iter() if e.text and e.text.strip()]

def markers(strings):
    joined=' '.join(strings); low=joined.lower()
    inj=sum(low.count(x) for x in ['injection mold','injection mould','injection-mold','injection_mold'])+len(re.findall(r'\bIM\b',joined,re.I))
    sls=low.count('selective laser sinter')+len(re.findall(r'\bSLS\b',joined,re.I))
    return {'injection':inj,'sls':sls}

def context_labels(strings):
    out=[]
    for s in strings:
        low=s.lower()
        if any(k in low for k in ['injection','sls','selective laser','stress','tensile','displacement','mrad','nylon']):
            t=s[:160]
            if t not in out: out.append(t)
    return out[:40]

def numeric_points(node):
    count=0
    for pt in node.iter():
        if not pt.tag.endswith('}pt'): continue
        for child in pt.iter():
            if child.tag.endswith('}v') and child.text:
                try: float(child.text); count+=1
                except ValueError: pass
                break
    return count

def series_profile(ser):
    strings=[' '.join(e.text.split()) for e in ser.iter() if e.text and e.text.strip() and not re.fullmatch(r'[-+0-9.eE%]+',e.text.strip())]
    x=y=0
    for child in list(ser):
        tag=child.tag.rsplit('}',1)[-1]
        if tag in {'xVal','cat'}: x+=numeric_points(child)
        elif tag in {'yVal','val'}: y+=numeric_points(child)
    return {'xNumericPoints':x,'yNumericPoints':y,'pairedPointCount':x if x>0 and x==y else 0,'routeMarkers':markers(strings),'textLabels':list(dict.fromkeys(strings))[:30],'rawNumericValuesEmitted':False}

def chart_kind(strings):
    low=' '.join(strings).lower()
    if 'q1' in low and ('q3-q2' in low or 'min outlier' in low): return 'derived-boxplot'
    if 'cross head displacement' in low and 'stress (mpa)' in low: return 'tensile-stress-displacement-trace'
    if 'diffraction angle' in low and 'intensity' in low: return 'structural-xrd'
    return 'other-or-ambiguous'

def route_of(m):
    if m['injection']>0 and m['sls']==0: return 'injection'
    if m['sls']>0 and m['injection']==0: return 'sls'
    if m['sls']>0 and m['injection']>0: return 'mixed'
    return 'unknown'

def main():
    a=argparse.ArgumentParser(); a.add_argument('--output',type=Path,required=True); a.add_argument('--retrieved-date',required=True); args=a.parse_args(); c=json.loads(CONTRACT.read_text())
    ppt=next(f for f in c['stage1Evidence']['files'] if f['filename'].lower().endswith('.pptx'))
    data=get(f"{PUBLIC_BASE}/{ppt['id']}/file_downloaded")
    if hashlib.sha256(data).hexdigest()!=ppt['sha256']: raise RuntimeError('PPTX hash drift')
    charts={}; slides={}; chart_to_slides={}
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names=set(z.namelist())
        for name in names:
            if not safe(name): raise RuntimeError('unsafe OOXML path')
            if re.fullmatch(r'ppt/slides/slide\d+\.xml',name):
                strings=xml_text(z.read(name)); slides[name]={'routeMarkers':markers(strings),'contextLabels':context_labels(strings)}
                rel='ppt/slides/_rels/'+Path(name).name+'.rels'
                if rel in names:
                    root=ET.fromstring(z.read(rel))
                    for r in root:
                        target=r.attrib.get('Target',''); typ=r.attrib.get('Type','')
                        if typ.endswith('/chart') and target:
                            chart=posixpath.normpath(posixpath.join(posixpath.dirname(name),target))
                            chart_to_slides.setdefault(chart,[]).append(name)
        for name in sorted(n for n in names if re.fullmatch(r'ppt/charts/chart\d+\.xml',n)):
            raw=z.read(name); root=ET.fromstring(raw); strings=xml_text(raw); series=[]
            for e in root.iter():
                if e.tag.endswith('}ser'): series.append(series_profile(e))
            related=chart_to_slides.get(name,[]); slide_strings=[]; slide_mark={'injection':0,'sls':0}
            for s in related:
                slide_mark['injection']+=slides[s]['routeMarkers']['injection']; slide_mark['sls']+=slides[s]['routeMarkers']['sls']; slide_strings.extend(slides[s]['contextLabels'])
            chart_mark=markers(strings); combined={'injection':chart_mark['injection']+slide_mark['injection']+sum(x['routeMarkers']['injection'] for x in series),'sls':chart_mark['sls']+slide_mark['sls']+sum(x['routeMarkers']['sls'] for x in series)}
            kind=chart_kind(strings); route=route_of(combined); paired=sum(x['pairedPointCount'] for x in series)
            candidate=paired if kind=='tensile-stress-displacement-trace' and route=='injection' and paired>0 else 0
            charts[name]={'slides':related,'kind':kind,'route':route,'chartRouteMarkers':chart_mark,'slideRouteMarkers':slide_mark,'combinedRouteMarkers':combined,'contextLabels':list(dict.fromkeys(slide_strings+context_labels(strings)))[:50],'series':series,'pairedPointCount':paired,'candidateInjectionMaterialTracePointPairs':candidate,'candidateInjectionMaterialTraceValues':candidate*2,'rawNumericValuesEmitted':False}
    candidates=sum(x['candidateInjectionMaterialTracePointPairs'] for x in charts.values()); values=sum(x['candidateInjectionMaterialTraceValues'] for x in charts.values())
    derived=sum(x['pairedPointCount'] for x in charts.values() if x['kind']=='derived-boxplot'); mixed=sum(x['pairedPointCount'] for x in charts.values() if x['route']=='mixed')
    status='slide-context-profile-complete-needs-acceptance' if candidates>0 else 'slide-context-profile-no-acceptable-injection-trace'
    result={'schema':1,'status':status,'retrievedDate':args.retrieved_date,'source':{'datasetId':c['datasetId'],'datasetDoi':c['source']['datasetDoi'],'license':c['source']['license'],'pptxSha256':ppt['sha256']},'semanticProfile':{'charts':charts,'chartCount':len(charts),'candidateInjectionMaterialTracePointPairs':candidates,'candidateInjectionMaterialTraceValues':values,'derivedBoxPlotPairedPointsExcluded':derived,'mixedRoutePairedPointsExcluded':mixed,'acceptedInjectionProcessTimeSeriesSamplesAdded':0,'rawNumericValuesEmitted':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'stage4AcceptanceRequired':candidates>0,'acceptedInjectionProcessTimeSeriesSamplesAdded':0},'evidenceBoundary':c['evidenceBoundary']}
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':status,'chartCount':len(charts),'candidateInjectionMaterialTracePointPairs':candidates,'candidateInjectionMaterialTraceValues':values,'chartSummary':{k:{'kind':v['kind'],'route':v['route'],'paired':v['pairedPointCount'],'candidatePairs':v['candidateInjectionMaterialTracePointPairs'],'slides':v['slides']} for k,v in charts.items()}},indent=2))
if __name__=='__main__': main()
