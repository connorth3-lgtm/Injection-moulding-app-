from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/su13148102-supplement-v1.json'
R=ROOT/'tools/run_public_benchmark_su13148102.py'
W=ROOT/'.github/workflows/public-benchmark-su13148102.yml'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
for p in [C,R]: need(p.exists(),f'missing dependency: {p.relative_to(ROOT)}')
c=json.loads(C.read_text())
need(c['datasetId']=='su13148102-supplement','dataset id drifted')
need(c['source']['articleDoi']=='10.3390/su13148102','DOI drifted')
need(c['source']['license']=='CC BY 4.0','license drifted')
need(c['paperReported']['rows']==955 and c['paperReported']['columns']==42 and c['paperReported']['materials']==5,'paper dimensions drifted')
d=c['deliveredRelease']
need(d['rows']==955 and d['columns']==45 and d['materials']==5,'delivered release dimensions drifted')
need(len(d['sha256'])==64,'delivered release fingerprint missing')
need('42' in d['schemaDiscrepancy'] and '45' in d['schemaDiscrepancy'],'paper/release schema discrepancy must stay explicit')
p=subprocess.run([sys.executable,'-m','py_compile',str(R)],capture_output=True,text=True)
need(p.returncode==0,'runner syntax error: '+(p.stderr or p.stdout))
t=R.read_text()
for marker in ['sha256','safe_zip','paperReleaseColumnDelta','countsAsTimeSeriesSamples','rawRowsOrCellValuesEmitted','shutil.rmtree(work']:
    need(marker in t,f'runner boundary missing: {marker}')
for bad in ['git add','git commit','git push','read_pickle','pickle.load']:
    need(bad not in t,f'forbidden operation: {bad}')
if W.exists():
    w=W.read_text()
    for marker in ['MouldMaster Public Measured Benchmark — Sustainability 8102 supplement','qa_public_benchmark_su13148102.py','run_public_benchmark_su13148102.py','actions/upload-artifact@v4']:
        need(marker in w,f'workflow marker missing: {marker}')
    for bad in ['*.csv','*.zip','publisher/**']:
        need(bad not in w,f'workflow must not upload raw data: {bad}')
print('MouldMaster Sustainability 8102 supplement QA passed (paper 955x42; exact publisher release 955x45 across five materials; discrepancy explicit; record-level only)')
