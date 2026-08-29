from pathlib import Path
ROOT=Path(__file__).resolve().parent
R=(ROOT/'tools/run_public_benchmark_sic_nylon6_alt_stage3.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
for marker in ['coefficient-of-friction','wear','5N','10N','20N','30N','S1','S2','S3','S4','S5','total!=40','recoversPreviouslyBlockedDatasetFamily','createsNewSecondFamilyForAlternateDoi','acceptedRecordLevelMeasuredValues','imageOcrPerformed','commercialReuseAllowed']:
    need(marker in R,f'tribology acceptance guard missing: {marker}')
need("'acceptedRecordLevelMeasuredValues':40" in R,'exact 40-value acceptance missing')
need("'acceptedMeasuredTimeSeriesSamples':0" in R,'tribology source cannot inflate waveform metric')
need("'createsNewSecondFamilyForAlternateDoi':False" in R,'alternate DOI dedup boundary missing')
need("'commercialReuseAllowed':False" in R,'noncommercial boundary missing')
need("'imageOcrPerformed':False" in R,'image OCR must remain disabled')
need("'duplicateSecondPublisherEntryDownloaded':False" in R,'duplicate payload must not be downloaded twice')
print('MouldMaster SiC/Nylon-6 tribology acceptance QA passed')
