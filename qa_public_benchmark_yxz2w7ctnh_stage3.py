from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent; C=ROOT/'data/public-benchmark-contracts/yxz2w7ctnh-v1.json'; R=ROOT/'tools/run_public_benchmark_yxz2w7ctnh_stage3.py'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
x=json.loads(C.read_text()); need(x['status']=='stage3-route-coordinate-candidate','stage3 state drifted'); need(x['source']['datasetDoi']=='10.17632/yxz2w7ctnh.1','DOI drifted'); need(x['source']['license']=='CC BY 4.0','licence drifted'); c=x['stage2Evidence']['canonicalTestSheets']; need(set(c)=={'bending','tensile','impact'},'canonical family set drifted'); need(sum(len(v['sheets']) for v in c.values())==6,'canonical sheet count drifted'); need(len(x['stage2Evidence']['duplicateSheetsExcludedFromImpactWorkbook'])==4,'duplicate exclusion drifted'); need(len(x['stage2Evidence']['energySheetsExcludedFromImpactWorkbook'])==3,'energy sheet exclusion drifted')
r=x['stage3Rules']; need(r['useCanonicalSheetsOnly'] is True,'canonical-only rule missing'); need(r['duplicateEmbeddedSheetsMustNotDoubleCount'] is True,'dedupe rule missing'); need(r['mapTextCellCoordinatesBeforeNumericCounting'] is True,'coordinate rule missing'); need(r['injectionAndFdmRegionsMustBeSeparated'] is True,'route separation missing'); need(r['rawNumericValuesMustNotBeEmitted'] is True,'numeric privacy rule missing'); need(r['countsAsFullyProfiledMeasuredDataset'] is False,'stage3 cannot count')
t=R.read_text()
for m in ['routeAnchors','textCells','numericCellsByColumn','numericCellsByRow','duplicateEmbeddedSheetsCounted\':False','energySheetsCounted\':False','rawNumericValuesEmitted\':False']:
    need(m in t,f'runner guard missing: {m}')
print('MouldMaster yxz2w7ctnh stage-three QA passed')
