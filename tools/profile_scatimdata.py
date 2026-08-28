#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,io,json,tempfile,urllib.request,zipfile
from pathlib import Path

BASE='https://raw.githubusercontent.com/sc4t1m/scatimdata/main'
ARCHIVES=['dataset1.zip','dataset2.zip','dataset3.zip']
PHYSICAL_H5={
    'Einspritzdruck/block0_values':'injection-pressure',
    'Einspritzstrom/block0_values':'injection-flow',
    'Werkzeuginnendruck/block0_values':'cavity-pressure',
}
CSV_SIGNAL={'injectionpressure':'injection-pressure','injectionflow':'injection-flow'}

def sha(b): return hashlib.sha256(b).hexdigest()

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster/1.0 evidence profiler'})
    with urllib.request.urlopen(req,timeout=90) as r:return r.read()

def profile_csv(raw,name):
    sample=raw[:65536].decode('utf-8-sig','replace')
    try:dialect=csv.Sniffer().sniff(sample,delimiters=',;\t|')
    except Exception:dialect=csv.excel
    reader=csv.reader(io.TextIOWrapper(io.BytesIO(raw),encoding='utf-8-sig',errors='replace',newline=''),dialect)
    try:header=next(reader)
    except StopIteration:return {'format':'csv','rows':0,'columns':0,'headers':[]}
    rows=sum(1 for r in reader if r)
    return {'format':'csv','rows':rows,'columns':len(header),'headers':header[:80]}

def profile_h5(raw):
    import h5py
    datasets=[]
    with tempfile.NamedTemporaryFile(suffix='.h5') as f:
        f.write(raw);f.flush()
        with h5py.File(f.name,'r') as h:
            def visit(path,obj):
                if isinstance(obj,h5py.Dataset):
                    datasets.append({'path':path,'shape':list(obj.shape),'dtype':str(obj.dtype),'size':int(obj.size)})
            h.visititems(visit)
    return {'format':'h5','datasets':datasets}

def signal_from_csv(path):
    p=path.lower()
    for needle,label in CSV_SIGNAL.items():
        if needle in p:return label
    return None

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',default='data/public-benchmark-results/scatimdata-v1.json');args=ap.parse_args()
    archives=[];signals=[];scalar_tables=[]
    for archive_name in ARCHIVES:
        url=f'{BASE}/{archive_name}';blob=get(url)
        arc={'name':archive_name,'url':url,'sizeBytes':len(blob),'sha256':sha(blob),'members':[]}
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            for info in [x for x in z.infolist() if not x.is_dir()]:
                raw=z.read(info);m={'path':info.filename,'sizeBytes':len(raw),'sha256':sha(raw)}
                ext=Path(info.filename).suffix.lower()
                if ext in {'.csv','.txt','.tsv'}:
                    m.update(profile_csv(raw,info.filename));sig=signal_from_csv(info.filename)
                    if sig and m['rows']>=1000 and m['columns']>1:
                        # Source CSV: first column is the time axis; remaining columns are cycle-linked measured curves.
                        rec={'archive':archive_name,'member':info.filename,'signal':sig,'pointsPerCurveObserved':m['rows'],
                             'cycleColumns':m['columns']-1,'sampleCount':m['rows']*(m['columns']-1),'storage':'csv-matrix'}
                        signals.append(rec)
                    elif 'scalar' in info.filename.lower():
                        scalar_tables.append({'archive':archive_name,'member':info.filename,'rows':m['rows'],'columns':m['columns'],'headers':m['headers']})
                elif ext in {'.h5','.hdf5'}:
                    m.update(profile_h5(raw))
                    for d in m['datasets']:
                        if d['path'] in PHYSICAL_H5 and d['dtype'].startswith('float') and len(d['shape'])==2:
                            rec={'archive':archive_name,'member':info.filename,'dataset':d['path'],'signal':PHYSICAL_H5[d['path']],
                                 'pointsPerCurveObserved':d['shape'][0],'cycleColumns':d['shape'][1],
                                 'sampleCount':d['size'],'storage':'hdf5-float-matrix'}
                            signals.append(rec)
                else:m['format']=ext.lstrip('.') or 'unknown'
                arc['members'].append(m)
        arc['memberCount']=len(arc['members']);archives.append(arc)
    total=sum(s['sampleCount'] for s in signals)
    cycle_counts={}
    for s in signals:cycle_counts.setdefault(s['archive'],set()).add(s['cycleColumns'])
    payload={
      'schema_version':2,'status':'completed-public-measured-timeseries-benchmark','completed_date':'2026-08-28',
      'source':{
        'title':'High-resolution injection-moulding time-series datasets (scatimdata)','repository':'https://github.com/sc4t1m/scatimdata',
        'license':'CC BY 4.0','peerReviewedCompanion':'10.3390/polym15040978',
        'machine':'Arburg Allrounder 520E 1500-800, 45 mm screw','moulds':'two industrial-representative single-cavity hot-runner moulds',
        'materials':'two polyamide granules','machineInterface':'OPC UA / EUROMAP 63 via AVAPS','samplingIntervalMsPublished':6
      },
      'publishedStructure':{
        'pointsPerTimeSeriesReported':2049,'signalsPerCycleUsedForPrediction':['injection pressure curve','injection flow curve'],
        'qualityPerCycle':['part weight','geometric dimension'],'cycleLinkage':True
      },
      'observedSourceStructure':{
        'pointsPerCurveInDownloadedMatrices':2048,
        'note':'The article reports 2049 points per series; the published machine-readable signal matrices contain 2048 numeric time rows. MouldMaster counts the downloaded numeric values rather than inflating to the nominal article value.',
        'physicalSignalMatrices':signals,'scalarTables':scalar_tables,
        'cycleColumnCountsByArchive':{k:sorted(v) for k,v in cycle_counts.items()}
      },
      'archives':archives,
      'acceptedMeasuredTimeSeriesSamples':total,
      'sampleCountBySignal':{label:sum(s['sampleCount'] for s in signals if s['signal']==label) for label in sorted({s['signal'] for s in signals})},
      'rawSourceRowsCommitted':False,
      'boundary':'Only float physical signal matrices and cycle-linked numeric CSV signal matrices are counted. HDF5 axes, identifiers and *_states arrays are excluded. One sample is one measured scalar value in a time-series channel, not one cycle. Raw source rows are not emitted.'
    }
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'acceptedMeasuredTimeSeriesSamples':total,'sampleCountBySignal':payload['sampleCountBySignal'],'signals':signals},indent=2))
if __name__=='__main__':main()
