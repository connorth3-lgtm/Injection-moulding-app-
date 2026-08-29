from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json'
R=ROOT/'tools/run_public_benchmark_pmc4753395_stage2.py'

def need(x,m):
    if not x: raise AssertionError(m)
c=json.loads(C.read_text())
need(c['status']=='stage2-semantic-profile-candidate','stage2 status drifted')
e=c['stage1Evidence']; need(len(e['supplementSha256'])==64 and len(e['nestedRarSha256'])==64 and len(e['measuredWorkbookSha256'])==64,'fingerprints missing')
r=c['stage2Rules']; need(r['theoreticalWorkbookMustBeExcluded'] is True,'theoretical exclusion missing'); need(r['plotSheetMustBeExcluded'] is True,'plot exclusion missing'); need(r['injectionMachineTimeSeriesSamplesAdded']==0,'material test cannot inflate injection process metric')
t=R.read_text()
for marker in ['Stress (MPa)','Strain (%)','sourceDeliveredStressStrainTraceValues','theoreticalWorkbookValuesAccepted','injectionMachineTimeSeriesSamplesAdded','rawNumericValuesEmitted','7z','supplementSha256']:
    need(marker in t,f'stage2 guard missing: {marker}')
need("'PLots'" in t,'PLots exclusion missing')
print('MouldMaster PMC4753395 stage-two semantic QA passed')
