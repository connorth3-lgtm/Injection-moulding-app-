from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
CONTRACT=ROOT/'data/public-benchmark-contracts/yxz2w7ctnh-v1.json'
RUNNER=ROOT/'tools/run_public_benchmark_yxz2w7ctnh_stage1.py'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
x=json.loads(CONTRACT.read_text())
need(x['schema']==1,'unsupported yxz2w7ctnh contract schema')
need(x['datasetId']=='mendeley-yxz2w7ctnh-v1','dataset id drifted')
need(x['status']=='stage1-manifest-candidate','stage-one state drifted')
need(x['source']['datasetDoi']=='10.17632/yxz2w7ctnh.1','DOI drifted')
need(x['source']['license']=='CC BY 4.0','licence drifted')
need(x['source']['version']==1,'version drifted')
r=x['stage1Rules']; need(r['publisherManifestOnly'] is True,'stage one must be manifest-only'); need(r['downloadDatasetPayloads'] is False,'stage one cannot download payloads'); need(r['routeMustBeResolvedBeforeMeasurementCounting'] is True,'route boundary missing'); need(r['injectionAndFdmMeasurementsMustNotBeCombined'] is True,'route separation missing'); need(r['countsAsFullyProfiledMeasuredDataset'] is False,'stage one cannot count'); need(r['acceptedInjectionProcessTimeSeriesSamples']==0,'stage one cannot add process samples')
text=RUNNER.read_text()
for marker in ['data.mendeley.com/public-api/datasets','injectionFilesByName','fdmFilesByName','mechanicalTestFilesByName','energyFilesByName','rawPayloadsDownloaded\':False','acceptedInjectionProcessTimeSeriesSamples\':0']:
    need(marker in text,f'runner guard missing: {marker}')
need('request_bytes(item' not in text,'stage-one runner must not download listed file payloads')
print('MouldMaster yxz2w7ctnh metadata-only stage-one QA passed')
