from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/nylon12-gamma-8c8fjwcw86-v1.json'; R=ROOT/'tools/run_public_benchmark_nylon12_gamma_stage2.py'

def need(x,m):
    if not x: raise AssertionError(m)
c=json.loads(C.read_text()); need(c['status']=='stage2-ooxml-profile-candidate','stage2 status drifted'); need(c['source']['license']=='CC BY 4.0','licence drifted'); need(len(c['stage1Evidence']['files'])==2,'publisher file manifest drifted')
for f in c['stage1Evidence']['files']: need(len(f['sha256'])==64,'file fingerprint missing')
r=c['stage2Rules']; need(r['injectionAndSlsEvidenceMustRemainSeparated'] is True,'route separation missing'); need(r['rawNumericValuesMustNotBeEmitted'] is True,'numeric-value guard missing'); need(r['countsAsFullyProfiledMeasuredDataset'] is False,'stage2 cannot accept automatically')
t=R.read_text()
for marker in ['embeddedWorkbookCount','chartCachedPointElements','injection','sls','rawNumericValuesEmitted','rawImagesEmitted','file_downloaded','sha256']:
    need(marker in t,f'runner guard missing:{marker}')
print('MouldMaster Nylon-12 gamma stage-two OOXML QA passed')
