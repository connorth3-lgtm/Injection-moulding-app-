from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/pet-preform-v2.json'
R=ROOT/'tools/run_public_benchmark_pet_preform.py'
W=ROOT/'.github/workflows/public-benchmark-pet-preform.yml'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
for p in [C,R]: need(p.exists(),f'missing dependency: {p.relative_to(ROOT)}')
c=json.loads(C.read_text(encoding='utf-8'))
need(c['datasetId']=='pet-preform-v2','dataset id drifted')
need(c['source']['datasetDoi']=='10.17632/vc3k9tt5zj.2','DOI drifted')
need(c['source']['datasetVersion']==2,'dataset version drifted')
need(c['source']['license']=='CC BY 4.0','license drifted')
p=subprocess.run([sys.executable,'-m','py_compile',str(R)],capture_output=True,text=True)
need(p.returncode==0,'runner syntax error: '+(p.stderr or p.stdout))
t=R.read_text(encoding='utf-8')
for marker in ['file_links','sha256','safe_extract','headerNames','simulationHeaderMarkers','qualityHeaderMarkers','rawRowsOrCellValuesEmitted','shutil.rmtree(work']:
    need(marker in t,f'runner boundary missing: {marker}')
for bad in ['git add','git commit','git push','pickle.load','read_pickle']:
    need(bad not in t,f'forbidden operation: {bad}')
if W.exists():
    w=W.read_text(encoding='utf-8')
    for marker in ['MouldMaster Public Measured Benchmark — PET preform v2','qa_public_benchmark_pet_preform.py','run_public_benchmark_pet_preform.py','actions/upload-artifact@v4']:
        need(marker in w,f'workflow marker missing: {marker}')
    for bad in ['*.csv','*.xlsx','*.zip','publisher/**']:
        need(bad not in w,f'workflow must not upload raw data: {bad}')
print('MouldMaster PET-preform v2 benchmark QA passed (version-pinned CC BY 4.0 retrieval; measured/simulation semantics remain fail-closed until source-file review)')
