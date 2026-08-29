from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
C=json.loads((ROOT/'data/public-benchmark-contracts/sic-nylon6-alt-release-v1.json').read_text())
R=(ROOT/'tools/run_public_benchmark_sic_nylon6_alt_stage1.py').read_text()
def need(ok,msg):
    if not ok:raise AssertionError(msg)
need(C['datasetId']=='sic-nylon6-injection-moulded-v1','family id drifted')
need(C['source']['primaryDatasetDoi']=='10.17632/ztkc87d6sr.1','primary DOI drifted')
need(C['source']['alternateDatasetDoi']=='10.17632/47k6jswwg7.1','alternate DOI drifted')
need(C['source']['alternateReleaseLicense']=='CC BY-NC 3.0','alternate licence drifted')
need(C['rules']['sameStudyAcrossTwoPublisherRecordsMustCountAsOneDatasetFamily'] is True,'same-study dedup gate missing')
need(C['rules']['alternateReleaseUseScopeMustRemainNonCommercial'] is True,'noncommercial boundary missing')
for marker in ['public-api/datasets','public-files/datasets','structuredNumericCandidateByExtension','imageOnlyCandidateByExtension','sameStudyAlternateReleaseDoesNotCreateSecondFamily','rawPayloadsDownloaded','acceptedMeasuredTimeSeriesSamples']:
    need(marker in R,f'alternate-release profiler guard missing: {marker}')
need('urlopen' in R,'publisher manifest retrieval missing')
need('file_downloaded' in R,'HTML public-file link discovery marker missing')
need('get(file_url' not in R and 'get(furl' not in R,'stage one must not call payload download routes')
print('MouldMaster SiC/Nylon-6 alternate-release stage-one QA passed')
