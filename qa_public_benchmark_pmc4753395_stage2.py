from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json'
R=ROOT/'tools/run_public_benchmark_pmc4753395_stage2.py'
RESULT=ROOT/'data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json'

def need(x,m):
    if not x: raise AssertionError(m)
c=json.loads(C.read_text())
need(c['status'] in {'stage2-semantic-profile-candidate','accepted-profiled-material-test-traces'},'stage2 status drifted')
e=c['stage1Evidence']; need(len(e['supplementSha256'])==64 and len(e['nestedRarSha256'])==64 and len(e['measuredWorkbookSha256'])==64,'fingerprints missing')
r=c['stage2Rules']; need(r['theoreticalWorkbookMustBeExcluded'] is True,'theoretical exclusion missing'); need(r['plotSheetMustBeExcluded'] is True,'plot exclusion missing'); need(r['injectionMachineTimeSeriesSamplesAdded']==0,'material test cannot inflate injection process metric')
if c['status']=='accepted-profiled-material-test-traces':
    a=c['acceptanceEvidence']; need(a['materialTestTraceValues']==142884,'accepted trace count drifted'); need(a['stressStrainTracePointPairs']==71442,'paired point count drifted'); need(a['preHeaderNumericCellsExcluded']==20,'pre-header exclusion drifted'); need(a['plotNumericCellsExcluded']==4,'plot exclusion drifted'); need(a['theoreticalWorkbookValuesAccepted']==0,'theoretical values cannot count'); need(a['acceptedInjectionProcessTimeSeriesSamplesAdded']==0,'material test cannot add process samples')
    z=json.loads(RESULT.read_text()); need(z['acceptance']['countsAsFullyProfiledMeasuredDataset'] is True,'committed PMC result lost acceptance'); need(z['profile']['materialTestTraceValues']==142884,'committed trace values drifted'); need(z['profile']['sourceDeliveredStressStrainTracePointPairs']==71442,'committed paired points drifted')
t=R.read_text()
for marker in ['Stress (MPa)','Strain (%)','sourceDeliveredStressStrainTraceValues','preHeaderNumericCellsExcluded','theoreticalWorkbookValuesAccepted','injectionMachineTimeSeriesSamplesAdded','rawNumericValuesEmitted','7z','supplementSha256']:
    need(marker in t,f'stage2 guard missing: {marker}')
need("'PLots'" in t,'PLots exclusion missing')
print('MouldMaster PMC4753395 stage-two semantic QA passed')
