from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
M=json.loads((ROOT/'data/public-benchmark-results/ypf95p4bs4-stage1.json').read_text())
R=(ROOT/'tools/run_public_benchmark_ypf95p4bs4_stage2.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
need(M['source']['datasetDoi']=='10.17632/ypf95p4bs4.1','DOI drifted')
need(M['source']['license']=='CC BY 4.0','licence drifted')
need(sum(1 for x in M['manifest']['files'] if x['classification']=='arena-model-noncounting')==3,'Arena model exclusion count drifted')
need(sum(1 for x in M['manifest']['files'] if x['classification'].startswith('stage2-'))==2,'XLSX candidate count drifted')
for marker in ['publisher SHA mismatch','profile_book','semanticMarkers','numericLiteralCells','formulaCells','doeFilesDownloaded','acceptedRecordLevelMeasuredValues','rawNumericValuesUploadedAsArtifact']:
    need(marker in R,f'stage-two guard missing: {marker}')
need("'doeFilesDownloaded':False" in R,'.doe payloads must never be downloaded')
need("'countsAsFullyProfiledMeasuredDataset':False" in R,'stage two must remain non-accepting before semantic decision')
need("'acceptedMeasuredTimeSeriesSamples':0" in R,'stage two cannot claim machine waveform samples')
print('MouldMaster ypf95p4bs4 workbook stage-two QA passed')
