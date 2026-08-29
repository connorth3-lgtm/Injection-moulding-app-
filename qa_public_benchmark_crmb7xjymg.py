from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
CONTRACT=ROOT/'data/public-benchmark-contracts/crmb7xjymg-v1.json'
RUNNER=ROOT/'tools/run_public_benchmark_crmb7xjymg.py'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

x=json.loads(CONTRACT.read_text(encoding='utf-8'))
need(x.get('schema')==1,'unsupported XPS contract schema')
need(x.get('datasetId')=='mendeley-crmb7xjymg-v1','XPS dataset id drifted')
need(x['source']['datasetDoi']=='10.17632/crmb7xjymg.1','XPS DOI drifted')
need(x['source']['license']=='CC BY 4.0','XPS licence drifted')
need(len(x['source']['vamasFile']['sha256'])==64,'VAMAS SHA missing')
r=x['semanticRules']
need(r['parseVamasUsingStandardsBasedLibrary'] is True,'standards parser requirement missing')
need(r['acceptedDetectorVariableLabels']==['Counts'],'detector variable gate drifted')
need(r['excludeRegularScanEnergyAxis'] is True,'energy-axis exclusion missing')
need(r['excludeTransmissionAndCalibrationVariables'] is True,'transmission exclusion missing')
need(r['acceptedMeasuredTimeSeriesSamples']==0,'XPS trace points cannot inflate injection-cycle waveform metric')
text=RUNNER.read_text(encoding='utf-8')
for marker in ['from vamas import Vamas','corresponding_variables','y_values','countedAsMeasuredDetectorValues','measuredDetectorCountsValues','acceptedMaterialCharacterizationTraceValues','acceptedMeasuredTimeSeriesSamples\":0','rawSpectralValuesUploadedAsArtifact\":False']:
    need(marker in text,f'XPS runner guard missing: {marker}')
need("label.strip().lower()==\"counts\"" in text,'only Counts variables may be accepted as detector values')
print('MouldMaster XPS VAMAS benchmark QA passed')
