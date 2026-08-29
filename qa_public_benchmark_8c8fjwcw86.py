from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'data/public-benchmark-results/mendeley-wave2-batch3-stage1.json'
RUNNER=ROOT/'tools/run_public_benchmark_8c8fjwcw86.py'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
x=json.loads(MANIFEST.read_text())
s=next(v for v in x['sources'] if v['datasetId']=='mendeley-8c8fjwcw86-v1')
need(s['doi']=='10.17632/8c8fjwcw86.1','Nylon-12 DOI drifted')
need(s['license']=='CC BY 4.0','Nylon-12 licence drifted')
need(len(s['apiFiles'])==2,'Nylon-12 publisher file count drifted')
need({f['name'].split('.')[-1].lower() for f in s['apiFiles']}=={'docx','pptx'},'expected DOCX/PPTX package changed')
text=RUNNER.read_text()
for marker in ['chartCount','numericValuePointCount','oleCompoundFile','safePrintableLabels','tableCount','numericTokenCount','rawNumericValuesEmitted','countsAsFullyProfiledMeasuredDataset','acceptedMeasuredTimeSeriesSamples','rawNumericValuesUploadedAsArtifact']:
    need(marker in text,f'Nylon-12 profiler guard missing: {marker}')
need("'rawNumericValuesEmitted':False" in text,'raw numeric emission must stay disabled')
need("'countsAsFullyProfiledMeasuredDataset':False" in text,'profiler must remain non-accepting until semantic review')
need("'acceptedMeasuredTimeSeriesSamples':0" in text,'Nylon-12 profiler cannot claim waveform samples')
need("'rawNumericValuesUploadedAsArtifact':False" in text,'raw numeric artifact upload must stay disabled')
need('publisher SHA mismatch' in text,'Nylon-12 publisher fingerprint gate missing')
print('MouldMaster Nylon-12 supporting-data QA passed; source profiling required before semantic acceptance')
