from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / 'data' / 'public-benchmark-contracts' / 'rwth-pcr-2025-v1.json'
DELIVERY_REVIEW = ROOT / 'data' / 'rwth-pcr-delivery-review-2026-08-30.json'
RUNNER = ROOT / 'tools' / 'run_public_benchmark_rwth_pcr.py'
WORKFLOW = ROOT / '.github' / 'workflows' / 'public-benchmark-rwth-pcr.yml'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


c = json.loads(CONTRACT.read_text(encoding='utf-8'))
need(c.get('schema') == 1, 'RWTH contract schema drifted')
need(c.get('datasetId') == 'rwth-pcr-2025', 'RWTH dataset ID drifted')
need(c.get('status') == 'candidate-until-source-archive-and-measurement-semantics-pass', 'RWTH contract must remain fail-closed before source profiling')
s = c.get('source') or {}
need(s.get('datasetDoi') == '10.18154/RWTH-2025-06809', 'RWTH dataset DOI drifted')
need(s.get('recordUrl') == 'https://publications.rwth-aachen.de/record/1016199', 'RWTH authoritative record drifted')
need(s.get('filesPageUrl') == 'https://publications.rwth-aachen.de/record/1016199/files/', 'RWTH authoritative Files page drifted')
need(s.get('downloadUrl') == 'https://publications.rwth-aachen.de/record/1016199/files/ExperimentalData.zip?version=1', 'RWTH exact versioned archive URL drifted')
need(s.get('publisherFileName') == 'ExperimentalData.zip', 'RWTH publisher archive name drifted')
need(s.get('publisherFileVersion') == 1, 'RWTH publisher file version drifted')
need(s.get('publisherDisplayedSize') == '1,007.55 KB', 'RWTH publisher-displayed archive size drifted')
need(s.get('publisherDisplayedDate') == '2026-04-14', 'RWTH publisher archive date drifted')
need(s.get('license') == 'CC BY 4.0', 'RWTH licence must remain explicit')
need('publications.rwth-aachen.de' in s.get('licenseEvidenceUrl', ''), 'RWTH authoritative licence evidence missing')
need(s.get('peerReviewedCompanion') == '10.1016/j.jprocont.2026.103725', 'RWTH peer-reviewed companion drifted')
context = c.get('experimentContext') or {}
need(context.get('machine') == 'Arburg Allrounder 520 A 1500-800', 'RWTH machine context drifted')
need(len(context.get('materials') or []) == 2, 'RWTH material context drifted')
need(len(context.get('publisherDescribedTimeSeriesSignals') or []) == 5, 'RWTH source-described signal set drifted')
need('part mass' in [str(x).lower() for x in context.get('publisherDescribedPartMassIterationFields') or []], 'RWTH part-mass outcome context missing')
final = c.get('finalAcceptanceRequires') or []
need(len(final) >= 7, 'RWTH final acceptance gate is too weak')
need(any('measured signals' in x.lower() and 'commands' in x.lower() for x in final), 'RWTH measured-vs-command boundary missing')
need(any('time bases' in x.lower() for x in final), 'RWTH time-basis acceptance gate missing')
need(any('raw third-party' in x.lower() for x in final), 'RWTH raw-data boundary missing')

review = json.loads(DELIVERY_REVIEW.read_text(encoding='utf-8'))
need(review.get('datasetId') == 'rwth-pcr-2025', 'RWTH delivery-review dataset id drifted')
archive = review.get('publisherArchive') or {}
need(archive.get('fileName') == 'ExperimentalData.zip', 'RWTH delivery-review filename drifted')
need(archive.get('version') == 1, 'RWTH delivery-review file version drifted')
need(archive.get('accessLabel') == 'OpenAccess', 'RWTH publisher file must remain OpenAccess')
need(archive.get('versionedDownloadUrl') == s.get('downloadUrl'), 'RWTH contract must use the exact publisher versioned file link')
prior = review.get('priorExecution') or {}
need(prior.get('workflowRun') == 33229910280, 'RWTH prior blocked execution provenance drifted')
need(prior.get('testedVersionedPublisherUrl') is False, 'Prior RWTH run must remain documented as not testing the versioned publisher URL')
need((review.get('countingBoundary') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'RWTH delivery retry must not pre-count samples')

text = RUNNER.read_text(encoding='utf-8')
for marker in [
    'retrieved-profile-needs-semantic-review',
    'retrieval-blocked-non-archive-response',
    'countsAsFullyProfiledMeasuredDataset',
    'acceptedMeasuredTimeSeriesSamples',
    'rawRowsOrCellValuesEmitted',
    'rawRowsOrArraysUploadedAsArtifact',
    'rawResponseBodiesUploadedAsArtifact',
    'retrievalAttempts',
    'zipfile.ZipFile',
    'zipfile.is_zipfile',
    'sha256_stream',
    'allArchivePathsSafe',
    'HTTPCookieProcessor',
    'download=1',
]:
    need(marker in text, f'RWTH profiler safety/profile marker missing: {marker}')
need('countsAsFullyProfiledMeasuredDataset": False' in text, 'RWTH stage-1 profiler must not auto-promote dataset family')
need('"acceptedMeasuredTimeSeriesSamples": 0' in text, 'RWTH stage-1 profiler must not auto-count samples')
need('rawPublisherArchiveCommitted": False' in text, 'RWTH profiler must not claim raw archive committed')
need('rawResponseBodyEmitted": False' in text, 'RWTH retrieval diagnostics must never emit response bodies')

workflow = WORKFLOW.read_text(encoding='utf-8')
need('retrieval-blocked-non-archive-response' in workflow, 'RWTH workflow must accept safe fail-closed retrieval diagnostics')
need("x['acceptance']['countsAsFullyProfiledMeasuredDataset'] is False" in workflow, 'RWTH workflow must keep dataset promotion disabled')
need("x['acceptance']['acceptedMeasuredTimeSeriesSamples']==0" in workflow, 'RWTH workflow must keep measured sample count at zero before semantic acceptance')
need("rawResponseBodiesUploadedAsArtifact" in workflow, 'RWTH workflow must guard against raw response-body artifacts')

print('MouldMaster RWTH PCR stage-1 benchmark QA passed (CC BY 4.0 source and exact version-1 publisher archive pinned; aggregate-only fail-closed retrieval; promotion remains disabled)')
