from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/strathclyde-rtim-tablets-v1.json'
R=ROOT/'tools/run_public_benchmark_strathclyde_rtim.py'
def need(ok,msg):
    if not ok:raise AssertionError(msg)
x=json.loads(C.read_text())
need(x['datasetId']=='strathclyde-rtim-tablets-v1','Strathclyde RTIM dataset id drifted')
need(x['source']['datasetDoi']=='10.15129/e1a516b3-41ad-4b38-81e1-6ebec17b8e7d','dataset DOI drifted')
need(x['source']['license']=='CC BY 4.0','dataset licence drifted')
need(x['source']['expectedPublisherFile']=='doi.org_10.1016_j.ijpharm.2022.121956_AllData.xlsx','publisher workbook identity drifted')
need(x['source']['companionArticleDoi']=='10.1016/j.ijpharm.2022.121956','companion DOI drifted')
text=R.read_text()
for marker in ['discover_xlsx','zipfile.is_zipfile','numericLiteralCells','formulaCells','safeTextLabels','rawNumericValuesEmitted','countsAsFullyProfiledMeasuredDataset','acceptedMeasuredTimeSeriesSamples','rawNumericValuesUploadedAsArtifact']:
    need(marker in text,f'Strathclyde RTIM guard missing: {marker}')
need("'countsAsFullyProfiledMeasuredDataset':False" in text,'stage one must remain non-accepting')
need("'acceptedMeasuredTimeSeriesSamples':0" in text,'stage one cannot claim machine time-series samples')
need("'rawNumericValuesUploadedAsArtifact':False" in text,'raw numeric artifact upload must stay disabled')
print('MouldMaster Strathclyde RTIM stage-one QA passed')
