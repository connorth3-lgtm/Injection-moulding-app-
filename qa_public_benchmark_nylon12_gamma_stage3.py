from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent; C=ROOT/'data/public-benchmark-contracts/nylon12-gamma-8c8fjwcw86-v1.json'; R=ROOT/'tools/run_public_benchmark_nylon12_gamma_stage3.py'
def need(x,m):
    if not x: raise AssertionError(m)
c=json.loads(C.read_text()); need(c['status']=='stage3-slide-context-candidate','stage3 status drifted'); need(c['source']['license']=='CC BY 4.0','licence drifted'); r=c['stage3Rules']; need(r['boxPlotQuartilesAndOutliersAreDerivedAndExcluded'] is True,'boxplot exclusion missing'); need(r['mixedRouteStructuralChartsAreExcluded'] is True,'mixed-route exclusion missing'); need(r['onlyPairedStressDisplacementTracePointsMayBecomeMaterialTestEvidence'] is True,'trace rule missing'); need(r['acceptedInjectionProcessTimeSeriesSamples']==0,'material test cannot inflate process samples')
t=R.read_text()
for marker in ['slideRouteMarkers','combinedRouteMarkers','derived-boxplot','tensile-stress-displacement-trace','candidateInjectionMaterialTracePointPairs','mixed','rawNumericValuesEmitted']:
    need(marker in t,f'runner guard missing:{marker}')
print('MouldMaster Nylon-12 gamma stage-three slide-context QA passed')
