from pathlib import Path
import csv,json,subprocess,sys,tempfile

ROOT=Path(__file__).resolve().parent
TOOL=ROOT/'tools'/'evaluate_authorised_site_pilot.py'
TEMPLATE=ROOT/'data'/'authorised-site-pilot-review-template.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

need(TOOL.exists(),'authorised site-pilot evaluator missing')
need(TEMPLATE.exists(),'authorised site-pilot review template missing')
review=json.loads(TEMPLATE.read_text(encoding='utf-8'))
need(review['site_authorisation_confirmed'] is False,'public template must fail closed on site authorisation')
need(review['raw_data_retained_outside_public_repository'] is True,'raw-data public-repository boundary missing')
need('notes_boundary' in review,'review template privacy boundary missing')

headers=['shot_index','phase','cavity_alias','fill_time_s','cushion_mm','recovery_time_s','part_mass_g','quality_result','intervention_code']
rows=[
 [1,'baseline','cavity-01',1.00,4.2,8.0,10.1,'pass',''],
 [2,'baseline','cavity-01',1.01,4.1,8.1,10.1,'pass',''],
 [3,'fault','cavity-01',1.06,2.9,9.8,9.7,'fail',''],
 [4,'fault','cavity-01',1.08,2.7,10.1,9.6,'fail',''],
 [5,'recovery','cavity-01',1.01,4.1,8.2,10.1,'pass','maintenance-01'],
]
accepted={
 'schema':1,'case_alias':'CASE-QA','site_authorisation_confirmed':True,
 'approved_learning_research_use_confirmed':True,'raw_data_retained_outside_public_repository':True,
 'prepared_data_human_reviewed_for_reidentification_risk':True,'independent_reviewer_role':'independent process engineer',
 'independent_finding_category':'shot-delivery repeatability','mouldmaster_ranked_mechanisms':['shot-delivery repeatability','material feed variation'],
 'independent_finding_compared':True,'top_rank_alignment':'aligned','evidence_requested_before_setting_change':True,
 'root_cause_separated_from_compensation':True,'recovery_checked_against_mechanism':True,
 'ambiguities_or_missing_signals':['no cavity-pressure trace'],'content_or_data_actions':['retain ambiguity note'],
 'evidence_retention_governance_confirmed':True
}
with tempfile.TemporaryDirectory() as td:
    td=Path(td);csv_path=td/'prepared.csv';review_path=td/'review.json';out=td/'report.json'
    with csv_path.open('w',encoding='utf-8',newline='') as f:
        w=csv.writer(f);w.writerow(headers);w.writerows(rows)
    review_path.write_text(json.dumps(accepted),encoding='utf-8')
    proc=subprocess.run([sys.executable,str(TOOL),'--prepared-csv',str(csv_path),'--review-json',str(review_path),'--output',str(out)],cwd=ROOT,text=True,capture_output=True)
    need(proc.returncode==0,f'accepted synthetic governance fixture failed evaluator: {proc.stderr or proc.stdout}')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['status']=='accepted-real-site-pilot','accepted fixture did not reach bounded pilot status')
    need(report['prepared_input']['raw_rows_emitted'] is False and report['prepared_input']['raw_values_emitted'] is False,'pilot report leaked raw data')
    text=json.dumps(report)
    for forbidden in ['"raw_rows":','"minimum":','"maximum":','cavity-01']:
        need(forbidden not in text,f'pilot report leaked source detail: {forbidden}')
    blocked=dict(accepted);blocked['site_authorisation_confirmed']=False
    review_path.write_text(json.dumps(blocked),encoding='utf-8')
    proc=subprocess.run([sys.executable,str(TOOL),'--prepared-csv',str(csv_path),'--review-json',str(review_path),'--output',str(out)],cwd=ROOT,text=True,capture_output=True)
    need(proc.returncode==2,'evaluator must fail closed when site authorisation is absent')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['status']=='pilot-review-incomplete','blocked fixture must remain pilot-review-incomplete')
    need(report['claim_allowed']=='pilot-ready','blocked fixture must not claim real-site completion')

print('MouldMaster authorised site-pilot framework QA passed (bounded acceptance possible only with explicit authorisation + independent review; no raw rows/values emitted)')
