from pathlib import Path
import json
import re

TARGET_FILE=Path('data/deep-dive-v2-targets.json'); PROGRAMME_FILE=Path('sources/DEEP_DIVE_V2_PROGRAMME.md'); SEED_FILE=Path('sources/DEEP_DIVE_V2_SEED_RESEARCH.md'); WAVE7_DOC=Path('sources/DEEP_DIVE_V2_WAVE7_EXECUTION.md'); REPORT_FILE=Path('deep-dive-v2-report.json')
WAVE_FILES=[Path('data/deep-dive-v2-100-pass.json')]+[Path(f'data/deep-dive-v2-wave{i}-100-pass.json') for i in range(2,8)]
for p in [TARGET_FILE,PROGRAMME_FILE,SEED_FILE,WAVE7_DOC,*WAVE_FILES]: assert p.exists(),f'missing {p}'
data=json.loads(TARGET_FILE.read_text()); assert data['targets']['research_evidence_domains']>=700; assert data['execution_state']['cumulative_passes']==700; assert data['execution_state']['wave7_primary_seeded']==89; assert data['execution_state']['wave7_explicit_gaps']==11
programme=PROGRAMME_FILE.read_text()
for m in ['2,000','1,000','700 cumulative research/evidence passes','Wave 7 IDs 601–700','Real-data-first rule','Evidence maturity','prediction','model accuracy','causality','Do not relabel synthetic data as measured']: assert m in programme,m
seed=SEED_FILE.read_text(); assert len(re.findall(r'^\| .*?\| https?://',seed,flags=re.M))>=6
mins=[78,59,93,69,95,92,89]; titles=[]; counts={}
for i,p in enumerate(WAVE_FILES,1):
 o=json.loads(p.read_text()); start=1 if i==1 else (i-1)*100+1; end=i*100; assert o['pass_count']==100
 if i>1: assert o['id_range']==[start,end] and o['cumulative_pass_count']==end
 raw=o['passes']; assert len(raw)==100
 rows=[{'id':r[0],'title':r[1],'theme':r[2],'status':r[3],'evidence_anchors':r[4]} for r in raw] if o.get('columns') else raw
 assert [r['id'] for r in rows]==list(range(start,end+1)); wave_titles=[r['title'] for r in rows]; assert len(set(wave_titles))==100; titles+=wave_titles
 for r in rows: assert r['theme'] and r['status'] in {'seeded_with_primary','gap_seeded'} and r['evidence_anchors']
 seeded=sum(r['status']=='seeded_with_primary' for r in rows); gaps=100-seeded; assert seeded>=mins[i-1]; s=o.get('summary',{}).get('by_status',{}); assert s.get('seeded_with_primary')==seeded and s.get('gap_seeded')==gaps; counts[f'wave{i}']={'seeded':seeded,'gaps':gaps}
assert len(set(titles))==700 and counts['wave7']=={'seeded':89,'gaps':11}
wave7=WAVE_FILES[-1].read_text()
for m in ['10.5545/SV-JME.2013.1000','10.1002/PEN.760312308','10.1016/J.CIRPJ.2021.01.009','10.1002/APP.27057','10.1002/pen.26756','10.1109/tim.2024.3522402','10.1007/S00170-020-06011-4','10.1109/IJCNN52387.2021.9534461','10.1002/pen.70028','10.1080/19397038.2014.895067']: assert m in wave7,m
doc=WAVE7_DOC.read_text()
for m in ['IDs **601–700**','primary/experimental-seeded passes: **89**','explicit evidence gaps retained: **11**','cumulative passes: **700**']: assert m in doc,m
REPORT_FILE.write_text(json.dumps({'programme':data['programme'],'status_date':data['status_date'],'targets':data['targets'],'execution_passes':700,'wave_counts':counts,'evidence_levels':list(data['evidence_levels']),'status':'pass'},indent=2)+'\n')
print('MouldMaster Deep Dive v2 QA passed — 700 cumulative passes protected')
