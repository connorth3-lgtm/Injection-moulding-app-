from pathlib import Path
ROOT=Path(__file__).resolve().parent
R=(ROOT/'tools/run_public_benchmark_ypf95p4bs4_stage3.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
for marker in ['Limpieza 2023 (Mtto)','Setup 2023','Paradas de Maquinaria 2023','Tiempos de Setup (Westinghouse)','Tiempo (m)','Tiempo(h)','Observaciones (min)','publisher SHA mismatch','directRecordLevelInjectionOperationalMeasurements','acceptedRecordLevelMeasuredValues','acceptedMeasuredTimeSeriesSamples']:
    need(marker in R,f'semantic counter guard missing: {marker}')
need("'validationWorkbookDownloaded':False" in R,'validation workbook must remain untouched in acceptance pass')
need("'doeFilesDownloaded':False" in R,'Arena .doe files must remain untouched')
need("'acceptedMeasuredTimeSeriesSamples':0" in R,'record-level source cannot inflate waveform metric')
need("'rawNumericValuesUploadedAsArtifact':False" in R,'raw numeric values must never be uploaded')
need("norm(ws.cell(r,cm).value)=='inyectora'" in R,'injector-only machine filtering missing')
need("'cambio de molde' in op" in R,'mould-change record filter missing')
print('MouldMaster ypf95p4bs4 semantic acceptance QA passed')
