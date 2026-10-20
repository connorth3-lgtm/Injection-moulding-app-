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
    def write_rows(data):
        with csv_path.open('w',encoding='utf-8',newline='') as f:
            w=csv.writer(f);w.writerow(headers);w.writerows(data)
    def run(review_data):
        review_path.write_text(json.dumps(review_data),encoding='utf-8')
        return subprocess.run([sys.executable,str(TOOL),'--prepared-csv',str(csv_path),'--review-json',str(review_path),'--output',str(out)],cwd=ROOT,text=True,capture_output=True)

    write_rows(rows)
    proc=run(accepted)
    need(proc.returncode==0,f'accepted synthetic governance fixture failed evaluator: {proc.stderr or proc.stdout}')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['schema']==2,'hardened pilot report schema must be 2')
    need(report['status']=='accepted-real-site-pilot','accepted fixture did not reach bounded pilot status')
    need(report['prepared_input']['shot_index_validated'] is True,'accepted fixture did not validate shot sequence')
    need(len(report['prepared_input']['phase_spanning_numeric_fields'])>=3,'accepted fixture did not prove three numeric evidence fields across all phases')
    need(report['prepared_input']['phase_row_counts']=={'baseline':2,'fault':2,'recovery':1},'aggregate phase row counts are wrong')
    need(report['prepared_input']['raw_rows_emitted'] is False and report['prepared_input']['raw_values_emitted'] is False,'pilot report leaked raw data')
    text=json.dumps(report)
    for forbidden in ['"raw_rows":','"minimum":','"maximum":','cavity-01','maintenance-01','no cavity-pressure trace','retain ambiguity note']:
        need(forbidden not in text,f'pilot report leaked source detail/free text: {forbidden}')

    blocked=dict(accepted);blocked['site_authorisation_confirmed']=False
    proc=run(blocked)
    need(proc.returncode==2,'evaluator must fail closed when site authorisation is absent')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['status']=='pilot-review-incomplete','blocked fixture must remain pilot-review-incomplete')
    need(report['claim_allowed']=='pilot-ready','blocked fixture must not claim real-site completion')

    blank_evidence=[list(r) for r in rows]
    for r in blank_evidence:
        r[3]=r[4]=r[5]=''
    write_rows(blank_evidence)
    proc=run(accepted)
    need(proc.returncode==2,'blank evidence columns must not satisfy real-site acceptance')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(any('numeric evidence fields span baseline, fault and recovery' in x for x in report['acceptance']['reasons']),'blank-evidence failure reason missing')

    bad_numeric=[list(r) for r in rows];bad_numeric[2][3]='not-a-number'
    write_rows(bad_numeric)
    proc=run(accepted)
    need(proc.returncode==2,'non-numeric populated evidence must fail closed')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(any('non-numeric or non-finite' in x for x in report['acceptance']['reasons']),'non-numeric evidence failure reason missing')

    duplicate_shot=[list(r) for r in rows];duplicate_shot[3][0]=duplicate_shot[2][0]
    write_rows(duplicate_shot)
    proc=run(accepted)
    need(proc.returncode==2,'duplicate shot_index must fail closed')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(any('shot_index values are not unique' in x for x in report['acceptance']['reasons']),'duplicate-shot failure reason missing')

    write_rows(rows)
    unsafe_alias=dict(accepted);unsafe_alias['case_alias']='Customer-X-machine-2'
    proc=run(unsafe_alias)
    need(proc.returncode==2,'identifier-like case alias must fail closed')
    report=json.loads(out.read_text(encoding='utf-8'))
    need(report['case_alias']=='CASE-REDACTED','unsafe case alias must not be copied to report')

print('MouldMaster authorised site-pilot framework QA passed (bounded acceptance requires numeric phase-spanning evidence + valid shot sequence + explicit authorisation/independent review; raw rows/values/free text stay out)')
