#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def write(rel,obj): (ROOT/rel).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)
def repl(text,old,new):
    need(text.count(old)==1, f'expected one match for {old[:90]}')
    return text.replace(old,new,1)

res=load('data/public-benchmark-results/yxz2w7ctnh-v1.json')
need(res.get('status')=='completed-profiled-record-level-injection-mechanical-testing','yxz2 result status drifted')
need((res.get('profile') or {}).get('directRecordLevelInjectionMeasuredValues')==489,'yxz2 direct measured count drifted')
need((res.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is True,'yxz2 acceptance drifted')
need((res.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples')==0,'yxz2 must add zero process waveform values')

# targets
t=load('data/content-scale-targets.json')
ft=t['targets']['fully_profiled_measured_datasets']; mt=t['targets']['measured_time_series_samples']
need(ft.get('currentAccepted')==11 and ft.get('currentDiscovered')==24,'yxz2 target baseline must be 11/24')
need(mt.get('currentAccepted')==66521519,'yxz2 waveform baseline drifted')
t['version']='2026.08.30.3'; t['reviewed']='2026-08-30'
ft['currentAccepted']=12; ft['currentDiscovered']=25
ft['notes']=('Twelve exact-source measured dataset families satisfy the profiling definition. In addition to the four prior Wave-2 families, '
             'Mendeley yxz2w7ctnh contributes 489 direct record-level injection-moulded ABS/PLA tensile and bending test values. '
             'FDM/energy content, duplicate worksheet copies, formula-derived cells and impact data without explicit manufacturing-route identity are excluded. '
             'All five Wave-2 promotions are non-process-waveform evidence, so accepted injection-process time-series values remain 66,521,519.')
write('data/content-scale-targets.json',t)

# inventory
inv=load('data/measured-dataset-inventory-v1.json'); rows=inv['datasets']; s=inv['summary']
need(len(rows)==24 and s.get('datasets')==24 and s.get('automatedIngestionAllowed')==13,'yxz2 inventory baseline must be 24/13')
need('mendeley-yxz2w7ctnh-v1' not in {x.get('datasetId') for x in rows},'yxz2 already in inventory')
rows.append({
 'datasetId':'mendeley-yxz2w7ctnh-v1','title':'ABS/PLA injection-moulded mechanical testing comparison dataset',
 'source':'https://doi.org/10.17632/yxz2w7ctnh.1','accessState':'public-open','license':'CC BY 4.0',
 'automatedIngestionAllowed':True,'rawRedistributionAllowedWithAttribution':True,
 'recordUnit':'record-level direct mechanical-test value from explicitly injection-moulded specimen block',
 'count':{'tensileDirectRecordLevelValues':347,'bendingDirectRecordLevelValues':142,'directRecordLevelInjectionMeasuredValues':489,'acceptedMeasuredTimeSeriesSamples':0},
 'signals':['tensile workbook injection-moulded numeric blocks','bending thickness','bending width','maximum force Fmax','bending displacement dL'],
 'quality':['tensile mechanical response','three-point-bending specimen dimensions and response'],
 'sampling':'record-level mechanical testing; repeated worksheet copies deduplicated; not injection-machine/cavity time series',
 'overlapGroup':'mendeley-yxz2w7ctnh-v1','peerReviewedCompanion':None,'priority':25,
 'statusNote':'Exact CC BY 4.0 four-workbook release is fingerprinted and fully profiled. Only numeric constants in regions explicitly marked as injection moulded are accepted: 347 tensile plus 142 bending values = 489 direct record-level measured values. FDM/energy blocks, duplicate worksheet copies, formulas and ambiguous impact sheets are excluded; zero injection-process waveform samples are added.'
})
s['datasets']=25; s['automatedIngestionAllowed']=14
inv['version']='2026.08.30.4'; inv['reviewed']='2026-08-30'; write('data/measured-dataset-inventory-v1.json',inv)

# execution ledger
exe=load('data/measured-dataset-execution-ledger-v1.json'); erows=exe['sources']; es=exe['summary']
need(len(erows)==24 and es.get('total')==24 and es.get('acceptedProfiled')==11,'yxz2 execution baseline must be 24/11')
need('mendeley-yxz2w7ctnh-v1' not in {x.get('datasetId') for x in erows},'yxz2 already in execution ledger')
erows.append({'priority':25,'datasetId':'mendeley-yxz2w7ctnh-v1','state':'accepted-profiled-record-level-injection-mechanical-testing','action':'keep four workbook fingerprints, worksheet deduplication and explicit injection-block selection regression-pinned','reason':'CC BY 4.0 exact source fully profiled; 489 direct record-level injection mechanical-test values; zero injection-process waveform samples'})
exe['version']='2026.08.30.2'; exe['reviewed']='2026-08-30'; es['total']=25; es['acceptedProfiled']=12
write('data/measured-dataset-execution-ledger-v1.json',exe)

# Wave-2 ledger
w=load('data/measured-dataset-wave2-ledger-v1.json'); ws=w['summary']; src=w['sources']
need(ws.get('wave2SourcesReviewed')==6 and ws.get('wave2FullyProfiledAccepted')==4 and ws.get('effectiveFullyProfiledMeasuredDatasetFamilies')==11,'yxz2 Wave-2 baseline drifted')
need('mendeley-yxz2w7ctnh-v1' not in {x.get('datasetId') for x in src},'yxz2 already in Wave-2 ledger')
src.append({'priority':7,'datasetId':'mendeley-yxz2w7ctnh-v1','doi':'10.17632/yxz2w7ctnh.1','license':'CC BY 4.0','state':'accepted-profiled-record-level-injection-mechanical-testing','countsAsFullyProfiledMeasuredDataset':True,'tensileDirectRecordLevelValues':347,'bendingDirectRecordLevelValues':142,'directRecordLevelInjectionMeasuredValues':489,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/yxz2w7ctnh-v1.json'})
w['version']='2026.08.30.2'; w['reviewed']='2026-08-30'; ws['wave2SourcesReviewed']=7; ws['wave2FullyProfiledAccepted']=5; ws['effectiveFullyProfiledMeasuredDatasetFamilies']=12; ws['effectiveAcceptedMeasuredTimeSeriesSamples']=66521519; ws['wave2RecordLevelMeasuredOutcomeValues']=1110
write('data/measured-dataset-wave2-ledger-v1.json',w)

# inventory QA
p=ROOT/'qa_measured_dataset_inventory.py'; x=p.read_text(encoding='utf-8')
x=repl(x,'len(rows) == 24','len(rows) == 25')
x=repl(x,'list(range(1, 25))','list(range(1, 26))')
x=repl(x,"summary.get('datasets') == 24","summary.get('datasets') == 25")
x=repl(x,"summary.get('automatedIngestionAllowed') == automated == 13","summary.get('automatedIngestionAllowed') == automated == 14")
anchor="need(by_id['pmc4753395-hdpe-cenosphere-v1']['count'].get('materialTestTraceValues') == 142884, 'Wave-2 material-test trace count drifted')\n"
insert=anchor+"need(by_id['mendeley-yxz2w7ctnh-v1']['count'].get('directRecordLevelInjectionMeasuredValues') == 489, 'Wave-2 yxz2 direct injection mechanical-test count drifted')\nneed(by_id['mendeley-yxz2w7ctnh-v1'].get('license') == 'CC BY 4.0' and by_id['mendeley-yxz2w7ctnh-v1'].get('automatedIngestionAllowed') is True, 'Wave-2 yxz2 CC BY execution boundary drifted')\n"
x=repl(x,anchor,insert)
x=x.replace('24 sources; 13 legally executable; 2 restricted educational/noncommercial profiles','25 sources; 14 legally executable; 2 restricted educational/noncommercial profiles')
p.write_text(x,encoding='utf-8')

# content QA
p=ROOT/'qa_content_scale_targets.py'; x=p.read_text(encoding='utf-8')
x=repl(x,'len(datasets) == 24','len(datasets) == 25')
x=repl(x,'summary.get("automatedIngestionAllowed") == 13','summary.get("automatedIngestionAllowed") == 14')
x=repl(x,'targets["fully_profiled_measured_datasets"]["currentAccepted"] == 11','targets["fully_profiled_measured_datasets"]["currentAccepted"] == 12')
x=x.replace('24 measured datasets inventoried; 11 fully profiled families including 2 restricted educational/noncommercial profiles; 66,521,519 accepted real measured time-series values; 60 publisher-verified primary measured studies; 13 sources legally executable','25 measured datasets inventoried; 12 fully profiled families including 2 restricted educational/noncommercial profiles; 66,521,519 accepted real measured time-series values; 60 publisher-verified primary measured studies; 14 sources legally executable')
p.write_text(x,encoding='utf-8')

# Wave-2 QA
p=ROOT/'qa_measured_dataset_wave2_ledger.py'; x=p.read_text(encoding='utf-8')
x=repl(x,'summary.get("wave2FullyProfiledAccepted") == 4','summary.get("wave2FullyProfiledAccepted") == 5')
x=repl(x,'summary.get("effectiveFullyProfiledMeasuredDatasetFamilies") == 11','summary.get("effectiveFullyProfiledMeasuredDatasetFamilies") == 12')
x=repl(x,'summary.get("wave2RecordLevelMeasuredOutcomeValues") == 621','summary.get("wave2RecordLevelMeasuredOutcomeValues") == 1110')
x=repl(x,'TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 11','TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 12')
x=repl(x,'TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 24','TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 25')
x=repl(x,'INV["summary"]["datasets"] == 24 and INV["summary"]["automatedIngestionAllowed"] == 13','INV["summary"]["datasets"] == 25 and INV["summary"]["automatedIngestionAllowed"] == 14')
x=repl(x,'"pmc4753395-hdpe-cenosphere-v1"]:', '"pmc4753395-hdpe-cenosphere-v1","mendeley-yxz2w7ctnh-v1"]:')
anchor='need(by_id["pmc4753395-hdpe-cenosphere-v1"]["automatedIngestionAllowed"] is True, "PMC CC BY source should be executable")\n'
x=repl(x,anchor,anchor+'need(by_id["mendeley-yxz2w7ctnh-v1"]["count"].get("directRecordLevelInjectionMeasuredValues") == 489, "yxz2 direct record-level injection mechanical-test count drifted")\nneed(by_id["mendeley-yxz2w7ctnh-v1"]["automatedIngestionAllowed"] is True, "yxz2 CC BY source should be executable")\n')
x=x.replace('7 -> 11 families; 24 inventoried sources; 13 executable','7 -> 12 families; 25 inventoried sources; 14 executable')
p.write_text(x,encoding='utf-8')

# compiler: append yxz2 to specialized specs and count 12
p=ROOT/'tools/compile_master_data.py'; x=p.read_text(encoding='utf-8')
anchor='        ("pmc4753395-hdpe-cenosphere-v1", "data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json", "data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json", "accepted-profiled-material-test-traces"),\n'
x=repl(x,anchor,anchor+'        ("mendeley-yxz2w7ctnh-v1", "data/public-benchmark-contracts/yxz2w7ctnh-v1.json", "data/public-benchmark-results/yxz2w7ctnh-v1.json", "completed-profiled-record-level-injection-mechanical-testing"),\n')
x=repl(x,'== accepted_profiled == 11','== accepted_profiled == 12')
p.write_text(x,encoding='utf-8')

# master QA
p=ROOT/'qa_master_data_compile.py'; x=p.read_text(encoding='utf-8')
x=repl(x,'need(expected_profiled == 11, "audited profiled-dataset baseline drifted")','need(expected_profiled == 12, "audited profiled-dataset baseline drifted")')
x=repl(x,'"measuredDatasetInventory": 24,','"measuredDatasetInventory": 25,')
x=repl(x,'"automatedIngestionAllowedDatasets": 13,','"automatedIngestionAllowedDatasets": 14,')
x=repl(x,'need(inv["summary"]["datasets"] == 24, "compiled measured dataset inventory drifted")','need(inv["summary"]["datasets"] == 25, "compiled measured dataset inventory drifted")')
x=repl(x,'need(inv["summary"]["automatedIngestionAllowed"] == 13, "compiled executable measured-source count drifted")','need(inv["summary"]["automatedIngestionAllowed"] == 14, "compiled executable measured-source count drifted")')
x=repl(x,'need("assert c[\'automatedIngestionAllowedDatasets\']==13" in workflow_text, "master-data workflow executable-source assertion is stale")','need("assert c[\'automatedIngestionAllowedDatasets\']==14" in workflow_text, "master-data workflow executable-source assertion is stale")')
old='need(set(specialized) == {"mendeley-6k8fpbrd9s-v1", "mendeley-4h98rz9f92-v3", "pmc4753395-hdpe-cenosphere-v1"}, f"specialized measured benchmark set drifted: {set(specialized)}")'
new='need(set(specialized) == {"mendeley-6k8fpbrd9s-v1", "mendeley-4h98rz9f92-v3", "pmc4753395-hdpe-cenosphere-v1", "mendeley-yxz2w7ctnh-v1"}, f"specialized measured benchmark set drifted: {set(specialized)}")'
x=repl(x,old,new)
anchor='    need((specialized["pmc4753395-hdpe-cenosphere-v1"].get("profile") or {}).get("materialTestTraceValues") == 142884, "compiled Wave-2 material-test count drifted")\n'
x=repl(x,anchor,anchor+'    need((specialized["mendeley-yxz2w7ctnh-v1"].get("profile") or {}).get("directRecordLevelInjectionMeasuredValues") == 489, "compiled Wave-2 yxz2 injection mechanical-test count drifted")\n')
x=x.replace('24 measured datasets; 13 legally executable sources;','25 measured datasets; 14 legally executable sources;')
p.write_text(x,encoding='utf-8')

print('yxz2 family-12 reconciliation prepared successfully')
