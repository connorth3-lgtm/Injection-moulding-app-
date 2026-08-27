from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent
MODULE='process-data-local-intake.js'

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

need((ROOT/MODULE).exists(),'local process-data intake module missing')
p=subprocess.run(['node','--check',str(ROOT/MODULE)],capture_output=True,text=True)
need(p.returncode==0,'local process-data intake syntax error: '+(p.stderr or p.stdout))

body=text(MODULE)
for marker in [
    'Prepare real shot CSV locally','Prepare shot data without uploading it','pseudonymisation','not guaranteed anonymisation',
    'Raw file contents stay in memory only','Export prepared CSV','Export data dictionary','Download CSV template',
    'shot_index','direct/person identifier','operational identifier replaced with stable per-file alias','numeric process/quality signal',
    'unknown labels aliased per file','MM_PROCESS_DATA_LOCAL_INTAKE','MAX_ROWS=50000','operator_id','employee_id',
    'Sequence review required','Sequence check','sourceShotIndex','timestampChecks','strictly increasing','structured measurement unit'
]:
    need(marker in body,f'local intake marker missing: {marker}')
for forbidden in ['fetch(', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'MM_DATA.exams=', 'correctIndex=', 'regionalQuestions=']:
    need(forbidden not in body,f'local intake must not upload/persist raw data or mutate formal assessment: {forbidden}')
need('no upload/storage/machine control' in body.lower(),'local intake must preserve explicit no-upload/no-storage/no-control scope')

node=f"""
const fs=require('fs'),vm=require('vm');
global.window={{MM_PROCESS_DATA_DIAGNOSTICS:{{open(){{}}}}}};
global.document={{getElementById(){{return null;}},createElement(){{return {{}};}},body:{{appendChild(){{}}}},head:{{appendChild(){{}}}}}};
global.requestAnimationFrame=f=>f();
vm.runInThisContext(fs.readFileSync({json.dumps(str(ROOT/MODULE))},'utf8'),{{filename:{json.dumps(MODULE)}}});
const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;
const csv='timestamp,machine,mould,material_grade,material_lot,operator_id,customer_name,fill_time_s,cycle_time_s,cushion_mm,quality_result,defect_code,comment\\n2026-08-26T10:00:00Z,IMM-A,Tool-X,PA66-GF30,LOT-SECRET,Alice-17,Customer One,1.20,28.4,4.5,PASS,WELD-LINE-SECRET,first shot\\n2026-08-26T10:00:30Z,IMM-A,Tool-X,PA66-GF30,LOT-SECRET,Bob-22,Customer One,1.24,28.7,4.4,FAIL,BURN-SECRET,second shot\\n';
const parsed=api.parseCsv(csv),prepared=api.prepare(parsed);
const badSequence='timestamp,shot_index,machine,fill_time_s,quality_result\\n2026-08-26T10:00:30Z,12,IMM-A,1.20,PASS\\n2026-08-26T10:00:00Z,11,IMM-A,1.24,FAIL\\n';
const badPrepared=api.prepare(api.parseCsv(badSequence));
const pilot='shot_index,cavity_alias,machine_alias,mould_alias,material_alias,lot_alias,phase,fill_time_s,transfer_position_mm,transfer_pressure_mpa,cushion_mm,recovery_time_s,cycle_time_s,tcu_supply_c,tcu_return_c,tcu_flow_lpm,resin_moisture_ppm,hot_runner_actual_c,part_mass_g,dimension_value,dimension_unit,quality_result,defect_alias,intervention_code\\n101,CAV-A,IMM-A,TOOL-A,MAT-A,LOT-A,baseline,0.80,11.2,72,4.6,4.2,24.0,25,27,8.0,320,245,18.1,40.02,mm,PASS,none,NONE\\n102,CAV-A,IMM-A,TOOL-A,MAT-A,LOT-A,fault,0.86,11.0,78,4.8,4.5,24.4,25,29,6.2,520,245,18.0,40.10,mm,FAIL,flash,TEST-01\\n';
const pilotPrepared=api.prepare(api.parseCsv(pilot));
process.stdout.write(JSON.stringify({{parsed,prepared,csv:api.toCsv(prepared),template:api.templateCsv(),scope:api.scope,maxRows:api.maxRows,badPrepared,badCsv:api.toCsv(badPrepared),pilotPrepared}}));
"""
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,'local intake runtime failed: '+p.stderr)
r=json.loads(p.stdout)
prepared=r['prepared']
need(r['maxRows']==50000,'local intake row cap drifted')
need(prepared['schema']==2,'local intake prepared schema must be version 2 after sequence hardening')
need(prepared['summary']['inputRows']==2 and prepared['summary']['outputRows']==2,'local intake must prepare both sample rows')
need(prepared['summary']['aliased']>=4,'machine/tool/material/lot identifiers must be aliased')
need(prepared['summary']['keptNumeric']>=3,'fill/cycle/cushion process signals must be retained as numeric evidence')
need(prepared['summary']['quality']>=2,'quality result and defect category must remain usable without leaking labels')
need(prepared['summary']['dropped']>=4,'timestamp/operator/customer/free-text columns must be dropped')
headers=prepared['headers']
need(headers.count('shot_index')==1,'prepared output must contain exactly one shot_index header')
for dropped in ['timestamp','operator_id','customer_name','comment']:
    need(dropped not in headers,f'{dropped} must not survive prepared output')
for kept in ['shot_index','machine','mould','material_grade','material_lot','fill_time_s','cycle_time_s','cushion_mm','quality_result','defect_code']:
    need(kept in headers,f'prepared output missing {kept}')
row0,row1=prepared['rows']
need(row0['shot_index']==1 and row1['shot_index']==2,'generated shot_index must preserve source file row order when no usable source index is supplied')
need(prepared['sequence']['sourceShotIndex']=='generated','sequence metadata must disclose generated shot_index')
need(prepared['sequence']['timestampChecks'][0]['monotonic'] is True,'monotonic source timestamps should be verified before removal')
need(prepared['sequence']['reviewRequired'] is False,'ordered sample should not raise a sequence warning')
need(row0['machine']=='machine-01' and row0['mould']=='mould-01','operational identifiers must become stable per-file aliases')
need(row0['material_grade']=='material-grade-01' and row0['material_lot']=='material-lot-01','material grade/lot must be pseudonymised rather than leaked')
need(row0['quality_result']=='pass' and row1['quality_result']=='fail','safe quality categories must remain interpretable')
need(row0['defect_code']=='defect-code-01' and row1['defect_code']=='defect-code-02','unknown defect labels must use per-file sequential aliases, not deterministic hashes or raw labels')
need(row0['fill_time_s']==1.2 and row0['cycle_time_s']==28.4 and row0['cushion_mm']==4.5,'legitimate process time/value signals must not be mistaken for timestamp metadata')
serialized=json.dumps(prepared).lower()
for secret in ['imm-a','tool-x','pa66-gf30','lot-secret','alice-17','bob-22','customer one','weld-line-secret','burn-secret','first shot','second shot','2026-08-26t10:00:00z']:
    need(secret not in serialized,f'prepared output leaked raw identifier/text: {secret}')

bad=r['badPrepared']
need(bad['headers'].count('shot_index')==1,'pre-existing shot_index must not create a duplicate output header')
need(bad['rows'][0]['shot_index']==12 and bad['rows'][1]['shot_index']==11,'usable source shot_index values must be preserved rather than renumbered')
need(bad['sequence']['sourceShotIndex']=='preserved','sequence metadata must disclose preserved source shot_index')
need(bad['sequence']['shotIndexMonotonic'] is False,'non-monotonic source shot index must be detected')
need(bad['sequence']['timestampChecks'][0]['monotonic'] is False,'non-monotonic timestamp order must be detected before timestamp removal')
need(bad['sequence']['reviewRequired'] is True and len(bad['sequence']['warnings'])>=2,'non-monotonic sequence must require human review')
need('timestamp' not in bad['headers'],'timestamps must still be stripped from a warned prepared export')
need('2026-08-26t10:00' not in json.dumps(bad).lower(),'sequence warnings must not leak raw timestamp values')
need(r['badCsv'].splitlines()[0].split(',').count('shot_index')==1,'exported CSV must not contain duplicate shot_index headers')

pilot=r['pilotPrepared']
need(pilot['sequence']['sourceShotIndex']=='preserved' and pilot['sequence']['shotIndexMonotonic'] is True,'pilot-style source shot order must survive preparation')
for kept in ['shot_index','phase','dimension_value','dimension_unit','intervention_code','quality_result','defect_alias']:
    need(kept in pilot['headers'],f'pilot-style prepared input must retain {kept}')
need(pilot['rows'][0]['phase']=='baseline' and pilot['rows'][1]['phase']=='fault','controlled pilot phase labels must remain interpretable')
need(pilot['rows'][0]['dimension_unit']=='mm','structured measurement units must survive preparation')
need(pilot['rows'][1]['intervention_code']=='intervention-code-02','intervention codes must be per-file aliases rather than leaked raw labels')
need('test-01' not in json.dumps(pilot).lower(),'raw intervention labels must not survive prepared output')

need('timestamp' in r['template'] and 'shot_index' in r['template'] and 'peak_cavity_pressure_mpa' in r['template'] and 'part_mass_g' in r['template'],'template must request sequence plus high-value shot evidence fields')
need('phase' in r['template'] and 'intervention_code' in r['template'] and 'dimension_unit' in r['template'],'local template must map cleanly toward the prepared pilot schema')
need('pseudonym' in prepared['boundary'].lower() and 'not proof of anonymity' in prepared['boundary'].lower(),'prepared output must preserve the privacy limitation')
need('timestamp and source shot-index values may be inspected in-session only' in prepared['boundary'].lower(),'prepared boundary must disclose transient sequence checking')
need('unknown categorical quality/phase labels are aliased only within the current prepared file' in prepared['boundary'].lower(),'prepared boundary must explain per-file category aliasing')
need('no upload/storage/machine control' in r['scope'].lower(),'runtime scope must preserve local-only/no-control boundary')

privacy=text('privacy.html').lower()
for marker in [
    'local process-data files','does not intentionally upload the raw file','operator/person fields',
    'pseudonymisation, not guaranteed anonymisation','review prepared files before sharing','raw process-data files'
]:
    need(marker in privacy,f'privacy notice must disclose local process-data intake behavior: {marker}')

capture=text('sources/REAL_PROCESS_DATA_INTAKE.md')
for marker in ['Preferred capture hierarchy','Intervention record','Data-quality checks before analysis','Privacy and confidentiality','Engineering boundary']:
    need(marker in capture,f'real process-data capture standard missing section: {marker}')

idx=text('index.html');sw=text('service-worker.js');pkg=json.loads(text('desktop/electron/package.json'));integrity=text('desktop/electron/scripts/generate-integrity.cjs')
need(MODULE in idx,'browser shell missing local intake module')
need(f"'./{MODULE}'" in sw,'offline cache missing local intake module')
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../'+MODULE in froms,'desktop package missing local intake module')
need("'"+MODULE+"'" in integrity,'desktop integrity manifest missing local intake module')
need(idx.index("'./process-data-20-pass-atlas.js'") < idx.index(f"'./{MODULE}'") < idx.index("'./curriculum-integration.js'"),'local intake must load after data libraries and before curriculum integration')

for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/publish-open-desktop.yml','.github/workflows/microsoft-store-msix.yml']:
    need('python qa_process_data_local_intake.py' in text(wf),f'{wf} must gate local process-data intake')
need(f'node --check {MODULE}' in text('.github/workflows/qa.yml'),'release syntax gate missing local intake module')

print('MouldMaster local process-data intake QA passed (unique/preserved shot index; pre-drop sequence audit; pilot phase/unit retention; process-time retention; identifier stripping/aliasing; local-only; browser/PWA/desktop packaged)')