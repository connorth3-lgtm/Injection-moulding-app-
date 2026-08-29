from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
M=json.loads((ROOT/'data/public-benchmark-results/sic-nylon6-alt-stage1.json').read_text())
R=(ROOT/'tools/run_public_benchmark_sic_nylon6_alt_stage2.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
need(M['source']['alternateDatasetDoi']=='10.17632/47k6jswwg7.1','alternate DOI drifted')
need(M['source']['alternateLicense']=='CC BY-NC 3.0','licence drifted')
need(M['manifest']['uniquePayloadHashes']==1,'duplicate payload dedup drifted')
need(M['manifest']['duplicatePublisherEntriesByHash']==1,'duplicate entry count drifted')
for marker in ['doc_tables','doc_paragraphs','chart_profile','numericValuePointCount','categoryPointCount','embeddedObjectCount','mediaImageCount','imageOcrPerformed','sameStudyAlternateReleaseDoesNotCreateSecondFamily','duplicateSecondPublisherEntryDownloaded','publisher SHA mismatch']:
    need(marker in R,f'DOCX profiler guard missing: {marker}')
need("'imageOcrPerformed':False" in R,'image OCR must remain disabled')
need("'countsAsFullyProfiledMeasuredDataset':False" in R,'semantic profile cannot auto-accept')
need("'acceptedMeasuredTimeSeriesSamples':0" in R,'document profile cannot claim waveform samples')
need("'duplicateSecondPublisherEntryDownloaded':False" in R,'duplicate publisher payload cannot be downloaded twice')
need("'rawNumericValuesUploadedAsArtifact':False" in R,'raw numeric values cannot be uploaded')
print('MouldMaster SiC/Nylon-6 DOCX stage-two QA passed')
