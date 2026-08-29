from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent; C=ROOT/'data/public-benchmark-contracts/yxz2w7ctnh-v1.json'; R=ROOT/'tools/run_public_benchmark_yxz2w7ctnh_stage4.py'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
x=json.loads(C.read_text()); need(x['status']=='stage4-injection-count-candidate','stage4 state drifted'); need(x['source']['datasetDoi']=='10.17632/yxz2w7ctnh.1','DOI drifted'); need(x['source']['license']=='CC BY 4.0','licence drifted'); e=x['stage3Evidence']; need(e['impactExcludedFromAcceptance'] is True,'impact must remain excluded'); need(set(e['injectionRegions'])=={'bending_PLA','bending_ABS','tensile_PLA','tensile_ABS'},'injection region set drifted')
r=x['stage4Rules']; need(r['useOnlyPinnedInjectionColumns'] is True,'pinned-column gate missing'); need(r['countNumericConstantsOnly'] is True,'numeric-constant gate missing'); need(r['formulaCellsAreDerivedAndExcluded'] is True,'formula exclusion missing'); need(r['sampleIdentifiersAreExcluded'] is True,'sample-id exclusion missing'); need(r['tensileS0GeometryColumnExcluded'] is True,'S0 exclusion missing'); need(r['fdmRegionsExcluded'] is True,'FDM exclusion missing'); need(r['impactExcludedUntilRouteResolved'] is True,'impact route gate missing'); need(r['acceptedInjectionProcessTimeSeriesSamples']==0,'material scalars cannot inflate process waveforms')
t=R.read_text()
for m in ['EXPECTED_TOTAL=450','count_numeric_constants','acceptedInjectionMaterialTestDirectPhysicalValues','formulaCellsInPinnedDirectColumnsExcluded','impactWorkbookRetrieved\':False','energyWorkbookRetrieved\':False','acceptedInjectionProcessTimeSeriesSamples\':0','rawNumericValuesEmitted\':False']:
    need(m in t,f'runner guard missing: {m}')
print('MouldMaster yxz2w7ctnh stage-four QA passed')
