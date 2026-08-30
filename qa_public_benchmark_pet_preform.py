from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parent
C=ROOT/'data/public-benchmark-contracts/pet-preform-v2.json'
R=ROOT/'tools/run_public_benchmark_pet_preform.py'
W=ROOT/'.github/workflows/public-benchmark-pet-preform.yml'
S=ROOT/'data/pet-preform-semantic-review-2026-08-30.json'
P=ROOT/'data/public-benchmark-results/pet-preform-v2.json'
def need(ok,msg):
    if not ok: raise AssertionError(msg)
for p in [C,R,S,P]: need(p.exists(),f'missing dependency: {p.relative_to(ROOT)}')
c=json.loads(C.read_text(encoding='utf-8'))
s=json.loads(S.read_text(encoding='utf-8'))
r=json.loads(P.read_text(encoding='utf-8'))
need(c['datasetId']=='pet-preform-v2','dataset id drifted')
need(c['source']['datasetDoi']=='10.17632/vc3k9tt5zj.2','DOI drifted')
need(c['source']['datasetVersion']==2,'dataset version drifted')
need(c['source']['license']=='CC BY 4.0','license drifted')
need(c['status']=='terminal-profiled-zero-measured-simulation-optimization-model-workbook','PET terminal status drifted')
need(c['retrievedRelease']['sha256']=='20f6704a93df7638d682b692ae4cb7432ca7d94bbc950ef2bdd0cfc17db124dc','PET source fingerprint drifted')
need(c['retrievedRelease']['rows']==27 and c['retrievedRelease']['columns']==26,'PET delivered table dimensions drifted')
sem=c['semanticDecision']
need(sem['controlledProcessSettingColumns']==5,'PET settings-column count drifted')
need(sem['solidworksSimulationResultColumns']==7,'PET simulation-column count drifted')
need(sem['modelValidationColumns']==1,'PET validation-column count drifted')
need(sem['annHiddenLayerIntermediateColumns']==6,'PET hidden-layer count drifted')
need(sem['annPredictionColumns']==7,'PET prediction-column count drifted')
need(sum(sem[k] for k in ['controlledProcessSettingColumns','solidworksSimulationResultColumns','modelValidationColumns','annHiddenLayerIntermediateColumns','annPredictionColumns'])==26,'PET semantic groups must account for all 26 columns')
need(sem['sourceDefinedMeasuredOutcomeColumns']==0,'PET published workbook must not claim a measured outcome')
need(sem['acceptedMeasuredProcessValues']==0 and sem['acceptedMeasuredQualityValues']==0 and sem['acceptedMeasuredTimeSeriesSamples']==0,'PET measured values must remain zero')
need(sem['fullyProfiledMeasuredFamily'] is False,'PET must not become a measured family')
need(c['acceptance']['simulationOnlyOutputsNeverEnterMeasuredCounts'] is True,'PET simulation exclusion gate missing')
need(c['acceptance']['modelIntermediatesAndPredictionsNeverEnterMeasuredCounts'] is True,'PET model exclusion gate missing')
need(c['acceptance']['controlledSettingsNeverEnterMeasuredCounts'] is True,'PET setting exclusion gate missing')

need(s['decision']=='terminal-zero-measured-values-simulation-optimization-model-workbook','PET semantic review decision drifted')
need(s['deliveredTable']['rows']==27 and s['deliveredTable']['columns']==26,'PET semantic review dimensions drifted')
groups={g['group']:g for g in s['fieldGroups']}
need(len(groups['controlled-process-settings']['columns'])==5,'PET semantic review settings group drifted')
need(len(groups['solidworks-plastics-simulation-results']['columns'])==7,'PET semantic review simulation group drifted')
need(groups['solidworks-plastics-simulation-results']['measuredEvidenceEligible'] is False,'PET simulation results must remain non-measured')
need(len(groups['jmp-neural-hidden-layer-intermediates']['columns'])==6,'PET hidden-node group drifted')
need(groups['jmp-neural-hidden-layer-intermediates']['measuredEvidenceEligible'] is False,'PET hidden nodes must remain non-measured')
need(len(groups['ann-predictions']['columns'])==7,'PET prediction group drifted')
need(groups['ann-predictions']['measuredEvidenceEligible'] is False,'PET predictions must remain non-measured')
need(s['articleEvidence']['publishedWorkbookDoesNotContainIdentifiableMeasuredQualityOutcome'] is True,'PET measured-outcome absence gate drifted')
need(s['countingBoundary']['acceptedMeasuredProcessValues']==0,'PET semantic review process count must be zero')
need(s['countingBoundary']['acceptedMeasuredQualityValues']==0,'PET semantic review quality count must be zero')
need(s['countingBoundary']['acceptedMeasuredTimeSeriesSamples']==0,'PET semantic review time-series count must be zero')
need(s['countingBoundary']['settingsExcludedFromMeasuredCounts'] is True,'PET settings exclusion missing')
need(s['countingBoundary']['simulationValuesExcluded'] is True,'PET simulation exclusion missing')
need(s['countingBoundary']['predictedValuesExcluded'] is True,'PET prediction exclusion missing')
need(s['countingBoundary']['modelIntermediateValuesExcluded'] is True,'PET model-intermediate exclusion missing')

need(r['status']=='completed-profiled-zero-measured-simulation-optimization-model-workbook','PET committed result terminal status drifted')
need(r['source']['datasetDoi']=='10.17632/vc3k9tt5zj.2','PET result DOI drifted')
need(r['files'][0]['sha256']=='20f6704a93df7638d682b692ae4cb7432ca7d94bbc950ef2bdd0cfc17db124dc','PET result source hash drifted')
profile=r['profile']
need(profile['totalTabularRowsAcrossTables']==27,'PET result row count drifted')
need(profile['controlledProcessSettingColumns']==5 and profile['simulationResultColumns']==7,'PET result semantic group counts drifted')
need(profile['modelValidationColumns']==1 and profile['annHiddenLayerIntermediateColumns']==6 and profile['annPredictionColumns']==7,'PET result model group counts drifted')
need(profile['sourceDefinedMeasuredOutcomeColumns']==0,'PET result must not invent measured outcomes')
need(profile['acceptedMeasuredProcessValues']==0 and profile['acceptedMeasuredQualityValues']==0 and profile['acceptedMeasuredTimeSeriesSamples']==0,'PET committed measured counts must remain zero')
need(profile['rawRowsOrCellValuesEmitted'] is False,'PET result must remain aggregate-only')

p=subprocess.run([sys.executable,'-m','py_compile',str(R)],capture_output=True,text=True)
need(p.returncode==0,'runner syntax error: '+(p.stderr or p.stdout))
t=R.read_text(encoding='utf-8')
for marker in ['file_links','sha256','safe_extract','headerNames','simulationHeaderMarkers','qualityHeaderMarkers','rawRowsOrCellValuesEmitted','shutil.rmtree(work']:
    need(marker in t,f'runner boundary missing: {marker}')
for bad in ['git add','git commit','git push','pickle.load','read_pickle']:
    need(bad not in t,f'forbidden operation: {bad}')
if W.exists():
    w=W.read_text(encoding='utf-8')
    for marker in ['MouldMaster Public Measured Benchmark — PET preform v2','qa_public_benchmark_pet_preform.py','run_public_benchmark_pet_preform.py','actions/upload-artifact@v4','pet-preform-semantic-review-2026-08-30.json']:
        need(marker in w,f'workflow marker missing: {marker}')
    for bad in ['*.csv','*.xlsx','*.zip','publisher/**']:
        need(bad not in w,f'workflow must not upload raw data: {bad}')
print('MouldMaster PET-preform v2 benchmark QA passed (exact CC BY 4.0 release fully profiled; all 26 columns classified as settings/simulation/validation/ANN intermediates/predictions; accepted measured values = 0)')
