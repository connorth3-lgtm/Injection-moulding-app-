from pathlib import Path
import json, subprocess, sys
ROOT = Path(__file__).resolve().parent
C = ROOT/'data/public-benchmark-contracts/openmms-t4g-v1.json'
R = ROOT/'tools/run_public_benchmark_openmms_t4g.py'
W = ROOT/'.github/workflows/public-benchmark-openmms-t4g.yml'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

for p in [C,R]: need(p.exists(), f'missing OpenMMS dependency: {p.relative_to(ROOT)}')
c=json.loads(C.read_text())
need(c['datasetId']=='openmms-t4g','dataset id drifted')
need(c['source']['repositoryCommit']=='cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7','source commit drifted')
need(c['source']['license']=='BSD-3-Clause','license drifted')
need(c['source']['peerReviewedCompanion']=='10.3390/s23073569','companion DOI drifted')
need(c['file']['path']=='Real_World_Test/Case_Study_Raw_Data.csv','raw path drifted')
need(c['file']['gitBlobSha1']=='d035660bce92f21954818a6379326d2897eebae8','blob drifted')
need(c['file']['sizeBytes']==2872573,'file size drifted')
p=subprocess.run([sys.executable,'-m','py_compile',str(R)],capture_output=True,text=True)
need(p.returncode==0,'OpenMMS runner syntax error: '+(p.stderr or p.stdout))
t=R.read_text()
for marker in ['sha256_file','time_profile','rawRowsOrCellValuesEmitted','rawPublisherFileCommitted','shutil.rmtree(work']:
    need(marker in t, f'OpenMMS runner boundary missing: {marker}')
for bad in ['git add','git commit','git push','read_pickle','pickle.load']:
    need(bad not in t, f'forbidden OpenMMS operation: {bad}')
if W.exists():
    w=W.read_text()
    for marker in ['MouldMaster Public Measured Benchmark — OpenMMS-T4G','qa_public_benchmark_openmms.py','run_public_benchmark_openmms_t4g.py','actions/upload-artifact@v7']:
        need(marker in w, f'OpenMMS workflow marker missing: {marker}')
    for bad in ['*.csv','publisher/**','.benchmark-work/**']:
        need(bad not in w, f'OpenMMS workflow must not upload raw data: {bad}')
print('MouldMaster OpenMMS benchmark QA passed (pinned article-linked raw CSV; BSD-3-Clause; aggregate-only profile)')