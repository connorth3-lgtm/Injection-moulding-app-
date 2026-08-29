from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/yxz2w7ctnh-v1.json'; R=ROOT/'tools/run_public_benchmark_yxz2w7ctnh_stage2.py'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
x=json.loads(C.read_text()); need(x['status']=='stage2-schema-candidate','stage2 status drifted'); need(x['source']['datasetDoi']=='10.17632/yxz2w7ctnh.1','DOI drifted'); need(x['source']['license']=='CC BY 4.0','licence drifted'); need(len(x['stage1Evidence']['mechanicalFiles'])==3,'mechanical manifest drifted'); need(x['stage1Evidence']['excludedEnergyFile']['filename']=='data_energy_3d_print_d_ryan.xlsx','energy exclusion drifted')
r=x['stage2Rules']; need(r['retrieveOnlyThreeMechanicalFiles'] is True,'mechanical-only retrieval missing'); need(r['publisherSha256MustMatch'] is True,'hash gate missing'); need(r['energyWorkbookMustNotBeRetrieved'] is True,'energy gate missing'); need(r['rawNumericValuesMustNotBeEmitted'] is True,'numeric privacy gate missing'); need(r['countsAsFullyProfiledMeasuredDataset'] is False,'stage2 cannot count')
t=R.read_text()
for m in ['publisherSha256Matched','textLabels','routeMaterialTestMarkers','energyWorkbookRetrieved\':False','rawNumericValuesEmitted\':False','acceptedInjectionProcessTimeSeriesSamples\':0']:
    need(m in t,f'runner guard missing: {m}')
need("stage1Evidence']['mechanicalFiles'" in t,'runner must be contract-driven'); need("excludedEnergyFile" not in t,'runner must not retrieve energy workbook')
print('MouldMaster yxz2w7ctnh stage-two QA passed')
