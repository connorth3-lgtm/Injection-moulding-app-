from pathlib import Path
import json
import re

TARGET_FILE=Path('data/deep-dive-v2-targets.json'); PROGRAMME_FILE=Path('sources/DEEP_DIVE_V2_PROGRAMME.md'); SEED_FILE=Path('sources/DEEP_DIVE_V2_SEED_RESEARCH.md'); WAVE6_DOC=Path('sources/DEEP_DIVE_V2_WAVE6_EXECUTION.md'); REPORT_FILE=Path('deep-dive-v2-report.json')
WAVE_FILES=[Path('data/deep-dive-v2-100-pass.json')]+[Path(f'data/deep-dive-v2-wave{i}-100-pass.json') for i in range(2,7)]
for p in [TARGET_FILE,PROGRAMME_FILE,SEED_FILE,WAVE6_DOC,*WAVE_FILES]: assert p.exists(),f'missing {p}'
data=json.loads(TARGET_FILE.read_text()); assert data['targets']['research_evidence_domains']>=600; assert data['execution_state']['cumulative_passes']==600; assert data['execution_state']['wave6_primary_seeded']==92; assert data['execution_state']['wave6_explicit_gaps']==8
programme=PROGRAMME_FILE.read_text()
for m in ['2,000','1,000','600 cumulative research/evidence passes','Wave 6 IDs 501–600','Real-data-first rule','Evidence maturity','prediction','model accuracy','causality','Do not relabel synthetic data as measured']: assert m in programme,m
seed=SEED_FILE.read_text(); assert len(re.findall(r'^\| .*?\| https?://',seed,flags=re.M))>=6
mins=[78,59,93,69,95,92]; titles=[]; counts={}
for i,p in enumerate(WAVE_FILES,1):
 o=json.loads(p.read_text()); start=1 if i==1 else (i-1)*100+1; end=i*100; assert o['pass_count']==100
 if i>1: assert o['id_range']==[start,end] and o['cumulative_pass_count']==end
 raw=o['passes']; assert len(raw)==100
 rows=[{'id':r[0],'title':r[1],'theme':r[2],'status':r[3],'evidence_anchors':r[4]} for r in raw] if o.get('columns') else raw
 assert [r['id'] for r in rows]==list(range(start,end+1)); wave_titles=[r['title'] for r in rows]; assert len(set(wave_titles))==100; titles+=wave_titles
 for r in rows: assert r['theme'] and r['status'] in {'seeded_with_primary','gap_seeded'} and r['evidence_anchors']
 seeded=sum(r['status']=='seeded_with_primary' for r in rows); gaps=100-seeded; assert seeded>=mins[i-1]; s=o.get('summary',{}).get('by_status',{}); assert s.get('seeded_with_primary')==seeded and s.get('gap_seeded')==gaps; counts[f'wave{i}']={'seeded':seeded,'gaps':gaps}
assert len(set(titles))==600 and counts['wave6']=={'seeded':92,'gaps':8}
wave6=WAVE_FILES[-1].read_text()
for m in ['10.1515/polyeng-2023-0201','10.18494/SAM.2019.2357','10.2478/ama-2024-0067','10.1016/j.jmapro.2024.02.021','10.1002/pls2.70012','10.1177/0731684407086627','10.1109/TIM.2024.3522402','10.3390/polym18010032','10.3389/FRAI.2020.578152']: assert m in wave6,m
doc=WAVE6_DOC.read_text()
for m in ['IDs **501–600**','primary/experimental-seeded passes: **92**','explicit evidence gaps retained: **8**','cumulative passes: **600**']: assert m in doc,m
REPORT_FILE.write_text(json.dumps({'programme':data['programme'],'status_date':data['status_date'],'targets':data['targets'],'execution_passes':600,'wave_counts':counts,'evidence_levels':list(data['evidence_levels']),'status':'pass'},indent=2)+'\n')
print('MouldMaster Deep Dive v2 QA passed — 600 cumulative passes protected')
