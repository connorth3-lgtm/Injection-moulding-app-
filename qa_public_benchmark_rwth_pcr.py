from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / 'data' / 'public-benchmark-contracts' / 'rwth-pcr-2025-v1.json'
RUNNER = ROOT / 'tools' / 'run_public_benchmark_rwth_pcr.py'


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
need(s.get('downloadUrl') == 'https://publications.rwth-aachen.de/record/1016199/files/ExperimentalData.zip', 'RWTH archive URL drifted')
need(s.get('publisherFileName') == 'ExperimentalData.zip', 'RWTH publisher archive name drifted')
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

text = RUNNER.read_text(encoding='utf-8')
for marker in [
    'retrieved-profile-needs-semantic-review',
    'countsAsFullyProfiledMeasuredDataset',
    'acceptedMeasuredTimeSeriesSamples',
    'rawRowsOrCellValuesEmitted',
    'rawRowsOrArraysUploadedAsArtifact',
    'zipfile.ZipFile',
    'sha256_stream',
    'allArchivePathsSafe',
]:
    need(marker in text, f'RWTH profiler safety/profile marker missing: {marker}')
need('countsAsFullyProfiledMeasuredDataset": False' in text, 'RWTH stage-1 profiler must not auto-promote dataset family')
need('"acceptedMeasuredTimeSeriesSamples": 0' in text, 'RWTH stage-1 profiler must not auto-count samples')
need('rawPublisherArchiveCommitted": False' in text, 'RWTH profiler must not claim raw archive committed')

print('MouldMaster RWTH PCR stage-1 benchmark QA passed (CC BY 4.0 source pinned; aggregate-only archive/schema profiling; promotion remains fail-closed)')
