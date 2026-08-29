from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/nylon12-gamma-8c8fjwcw86-v1.json'
R=ROOT/'tools/run_public_benchmark_nylon12_gamma_stage1.py'

def need(x,m):
    if not x: raise AssertionError(m)
c=json.loads(C.read_text())
need(c['datasetId']=='mendeley-8c8fjwcw86-v1','dataset id drifted'); need(c['source']['datasetDoi']=='10.17632/8c8fjwcw86.1','DOI drifted'); need(c['source']['license']=='CC BY 4.0','licence drifted')
r=c['stage1Rules']; need(r['publisherMetadataOnly'] is True,'stage one must be metadata only'); need(r['downloadPayloads'] is False,'stage one must not download payloads'); need(r['injectionAndSlsSubsetsMustBeSeparatedBeforeDownload'] is True,'route separation missing'); need(r['countsAsFullyProfiledMeasuredDataset'] is False,'stage one cannot count')
t=R.read_text()
for marker in ['public-api/datasets','injectionCandidateFiles','slsCandidateFiles','ambiguousRouteFiles','payloadDownloadEndpointsCalled','rawPayloadsDownloaded']:
    need(marker in t,f'runner guard missing:{marker}')
need("get(item" not in t,'stage one must not fetch discovered file payloads')
print('MouldMaster Nylon-12 gamma stage-one QA passed')
