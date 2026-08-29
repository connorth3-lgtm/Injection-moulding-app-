from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=json.loads((ROOT/'data/public-benchmark-contracts/ypf95p4bs4-v1.json').read_text())
R=(ROOT/'tools/run_public_benchmark_ypf95p4bs4_stage1.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
need(C['datasetId']=='mendeley-ypf95p4bs4-v1','dataset id drifted')
need(C['source']['datasetDoi']=='10.17632/ypf95p4bs4.1','DOI drifted')
need(C['source']['license']=='CC BY 4.0','licence drifted')
need(C['stage1Rules']['downloadDatasetPayloads'] is False,'stage one must remain metadata only')
need(C['stage1Rules']['simulationOutputsNeverCountAsMeasuredEvidence'] is True,'simulation exclusion missing')
need(C['stage1Rules']['acceptedMeasuredTimeSeriesSamples']==0,'stage one cannot claim time-series samples')
for marker in ['public-api/datasets','likelySimulationByName','likelyOperationalByName','rawPayloadDownloaded','rawPayloadsDownloaded','rawRowsOrArraysEmitted','countsAsFullyProfiledMeasuredDataset','acceptedMeasuredTimeSeriesSamples']:
    need(marker in R,f'runner guard missing: {marker}')
need('file_downloaded' not in R,'stage-one runner must not call payload download endpoints')
print('MouldMaster ypf95p4bs4 metadata-only stage-one QA passed')
