from pathlib import Path
import csv
import hashlib
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
PROTOCOL = ROOT / 'sources' / 'REAL_PROCESS_DATA_PILOT_PROTOCOL.md'
TEMPLATE = ROOT / 'data' / 'real-process-data-pilot-template.csv'
INTAKE = ROOT / 'sources' / 'REAL_PROCESS_DATA_INTAKE.md'
PUBLIC_BENCHMARKS = ROOT / 'sources' / 'PUBLIC_REAL_PROCESS_DATA_BENCHMARKS.md'
BENCHMARK_TOOL = ROOT / 'tools' / 'profile_public_benchmark.py'
BENCHMARK_CONTRACT = ROOT / 'data' / 'public-benchmark-contracts' / 'gtnb4j7bfx-v1.json'
BENCHMARK_FIXTURE = ROOT / 'qa' / 'fixtures' / 'public-benchmark-gtnb4j7bfx-synthetic.csv'
LIVE_READINESS = ROOT / 'data' / 'live-release-readiness.json'
LIVE_READINESS_DOC = ROOT / 'sources' / 'LIVE_RELEASE_READINESS.md'
README = ROOT / 'README.md'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


for path in [
    PROTOCOL, TEMPLATE, INTAKE, PUBLIC_BENCHMARKS, BENCHMARK_TOOL,
    BENCHMARK_CONTRACT, BENCHMARK_FIXTURE, LIVE_READINESS,
    LIVE_READINESS_DOC, README
]:
    need(path.exists(), f'real-data pilot file missing: {path.relative_to(ROOT)}')

protocol = PROTOCOL.read_text(encoding='utf-8')
intake = INTAKE.read_text(encoding='utf-8')
benchmarks = PUBLIC_BENCHMARKS.read_text(encoding='utf-8')
live_doc = LIVE_READINESS_DOC.read_text(encoding='utf-8')
live_policy = json.loads(LIVE_READINESS.read_text(encoding='utf-8'))
readme = README.read_text(encoding='utf-8')

for marker in [
    '264-case synthetic library',
    'pseudonymised, not guaranteed anonymous',
    'never commit raw production exports',
    'known-good period',
    'intervention',
    'recovery/verification',
    'commanded values and actual values',
    'missing values remain missing',
    'root-cause action from a compensating setting change',
    'pilot-ready',
    'No pilot finding authorises a real production change',
    'not a prerequisite for public learner deployment',
    'validated on real production data',
    'data/live-release-readiness.json',
]:
    need(marker in protocol, f'pilot protocol safeguard missing: {marker}')

for marker in [
    'shot order, cavity identity, actual machine response',
    'pseudonymisation, not guaranteed anonymisation',
    'Raw selected CSV data are not uploaded or persisted',
]:
    need(marker in intake, f'real-data intake boundary missing: {marker}')

# Public measured benchmarks can exercise ingestion/evidence handling before a
# private site pilot is available, but must not silently become MouldMaster-owned
# training data or be used to claim a validated real troubleshooting workflow.
for marker in [
    'external benchmark register — not a substitute for an authorised site pilot',
    '10.17632/gtnb4j7bfx.1',
    '10.17632/vc3k9tt5zj.2',
    'CC BY 4.0',
    '10.5281/zenodo.20744054',
    'licence must be verified before reuse',
    'Current state in this review: **embargoed**',
    'Preserve missing values as missing',
    'distinguish commanded/target values from actual measured values',
    'do not build field mappings from metadata alone',
    'authorised site-pilot evidence tracked in issue #50',
    'No benchmark result authorises a production change',
    'profile_public_benchmark.py',
    '--confirm-process-separated',
    'raw measured file stays outside this repository',
]:
    need(marker in benchmarks, f'public real-data benchmark safeguard missing: {marker}')

need(benchmarks.count('CC BY 4.0') >= 2, 'at least two benchmark candidates must have explicit reuse licences')
need('REAL_PROCESS_DATA_PILOT_PROTOCOL.md' in readme, 'README must link the real-data pilot protocol')
need('real-process-data-pilot-template.csv' in readme, 'README must link the pilot CSV template')
need('pilot-ready' in protocol and 'validated on real production data' in protocol, 'pilot maturity claim gate missing')

# Public deployment, site-validation evidence, and production-control authority
# are separate states. A missing external site pilot must not silently become a
# software release blocker, while the stronger real-production validation claim
# must still fail closed until the evidence exists.
need(live_policy.get('schema') == 1, 'live-release policy schema drifted')
need(live_policy.get('reviewed') == '2026-08-31', 'live-release policy review date drifted')
public_release = live_policy.get('public_learner_release', {})
site_evidence = live_policy.get('real_site_evidence', {})
production_authority = live_policy.get('production_control_authority', {})
need(public_release.get('status') == 'eligible-when-release-qa-passes', 'public learner release must remain QA-gated')
need(public_release.get('requires_authorised_site_pilot') is False, 'authorised site pilot must not block ordinary learner deployment')
need(public_release.get('requires_real_production_validation_claim') is False, 'public learner deployment must not require an unsupported production-validation claim')
need(site_evidence.get('status') == 'pilot-ready-human-comparison-required', 'real-site evidence maturity status drifted')
need(site_evidence.get('requires_external_site_authorisation') is True, 'real-site evidence must retain external authorisation')
need(site_evidence.get('requires_independent_engineering_finding_or_review') is True, 'real-site evidence must retain independent engineering comparison')
need(site_evidence.get('blocks_public_learner_release') is False, 'site evidence maturity must not block public learner release')
need(site_evidence.get('claim_allowed_before_completion') == 'pilot-ready', 'permitted pre-pilot claim drifted')
need(site_evidence.get('claim_forbidden_before_completion') == 'validated on real production data', 'forbidden pre-pilot claim drifted')
need(production_authority.get('status') == 'not_provided', 'educational app must not gain production-control authority')
need(production_authority.get('blocks_public_learner_release') is False, 'absence of production-control authority must define scope, not block learner deployment')
need(production_authority.get('claim_forbidden') is True, 'production-control authority claim must remain forbidden')
for marker in [
    'public learner release is not blocked',
    'eligible-when-release-qa-passes',
    'pilot-ready-human-comparison-required',
    'validated on real production data',
    'Production-control authority',
    'CI must fail',
]:
    need(marker in live_doc, f'live-release readiness boundary missing: {marker}')

rows = list(csv.reader(TEMPLATE.read_text(encoding='utf-8').splitlines()))
need(len(rows) == 1, 'public pilot template must contain header only, not production/example rows')
header = rows[0]
need(len(header) == len(set(header)), 'pilot template contains duplicate columns')

required = {
    'shot_index', 'cavity_alias', 'machine_alias', 'mould_alias', 'material_alias',
    'lot_alias', 'phase', 'fill_time_s', 'transfer_position_mm',
    'transfer_pressure_mpa', 'cushion_mm', 'recovery_time_s', 'cycle_time_s',
    'quality_result', 'defect_alias', 'intervention_code'
}
need(required.issubset(set(header)), f'pilot template missing required fields: {sorted(required - set(header))}')

forbidden_terms = {
    'customer', 'operator', 'person', 'name', 'email', 'phone', 'address',
    'timestamp', 'datetime', 'part_number', 'customer_part', 'comment', 'free_text'
}
for col in header:
    lower = col.lower()
    need(not any(term in lower for term in forbidden_terms), f'pilot template exposes direct/proprietary identifier field: {col}')

for col in ['fill_time_s', 'transfer_position_mm', 'transfer_pressure_mpa', 'cushion_mm',
            'recovery_time_s', 'cycle_time_s', 'tcu_supply_c', 'tcu_return_c',
            'tcu_flow_lpm', 'resin_moisture_ppm', 'hot_runner_actual_c', 'part_mass_g']:
    need(col in header, f'pilot template must retain useful physical evidence field: {col}')

need(not any('setpoint' in col.lower() for col in header), 'pilot template must not make setpoints the default evidence schema')

# Validate the first public benchmark source contract. It is based on the exact
# licensed dataset/version plus the associated peer-reviewed variable table, not
# on guessed ranges or copied third-party rows.
contract = json.loads(BENCHMARK_CONTRACT.read_text(encoding='utf-8'))
need(contract['dataset']['doi'] == '10.17632/gtnb4j7bfx.1', 'benchmark contract DOI drifted')
need(contract['dataset']['version'] == '1', 'benchmark contract version drifted')
need(contract['dataset']['license'] == 'CC BY 4.0', 'benchmark contract licence drifted')
need(contract['source_article']['doi'] == '10.3390/su17167445', 'associated variable-table source missing')
need(contract['benchmark_scope']['required_process_context'] == 'injection-moulding', 'benchmark must remain injection-specific')
columns = contract['columns']
need(len(columns) == 26, f'expected 26 source-contract variables, found {len(columns)}')
need(len({c['name'] for c in columns}) == 26, 'benchmark contract contains duplicate variables')
by_name = {c['name']: c for c in columns}
need(by_name['Injection_Pressure']['unit'] == 'bar', 'injection pressure source unit drifted')
need(by_name['Injection_Pressure']['command_actual'] == 'unknown_source_semantics', 'pressure must not be silently called actual or commanded')
need(by_name['Melt_Temp']['unit'] == '°C', 'melt-temperature source unit drifted')
need(by_name['Injection_Speed']['unit'] == 'mm/s', 'injection-speed source unit drifted')
need(by_name['%Flash']['class'] == 'derived_quality_metric', 'flash percentage must remain a derived quality metric')
need(by_name['Machine']['share_action'] == 'alias', 'machine identity must be treated as an operational identifier')
need(any('missing values as missing' in x for x in contract['preprocessing_guardrails']), 'contract must reject silent null-to-zero preprocessing')
need(any('recommended setpoints' in x for x in contract['preprocessing_guardrails']), 'contract production-recipe boundary missing')

# Run the profiler against a deliberately synthetic fixture that mirrors only the
# published schema. CI must prove the profiler records provenance/aggregate data
# quality without emitting third-party/raw record values or changing the input.
fixture_before = sha256(BENCHMARK_FIXTURE)
with tempfile.TemporaryDirectory() as td:
    report_path = Path(td) / 'benchmark-profile.json'
    proc = subprocess.run([
        sys.executable, str(BENCHMARK_TOOL),
        '--input', str(BENCHMARK_FIXTURE),
        '--contract', str(BENCHMARK_CONTRACT),
        '--output', str(report_path),
        '--title', contract['dataset']['title'],
        '--doi', contract['dataset']['doi'],
        '--dataset-version', contract['dataset']['version'],
        '--license', contract['dataset']['license'],
        '--retrieved-date', '2099-01-01',
        '--process-context', 'injection-moulding',
        '--confirm-process-separated',
    ], cwd=ROOT, text=True, capture_output=True, encoding='utf-8', errors='replace')
    need(proc.returncode == 0, f'benchmark profiler failed on synthetic fixture: {proc.stderr or proc.stdout}')
    need(report_path.exists(), 'benchmark profiler did not create a report')
    report = json.loads(report_path.read_text(encoding='utf-8'))

need(sha256(BENCHMARK_FIXTURE) == fixture_before, 'benchmark profiler modified its source file')
need(report['raw_values_emitted'] is False, 'benchmark report must never emit raw row values')
need(report['missing_value_policy']['zero_fill_performed'] is False, 'benchmark profiler must not zero-fill missing data')
need(report['file']['data_rows'] == 4, 'synthetic benchmark row count changed unexpectedly')
need(report['file']['columns'] == 26, 'synthetic benchmark schema width changed unexpectedly')
need(len(report['file']['sha256']) == 64, 'benchmark report must fingerprint its input')
need(report['source']['doi'] == contract['dataset']['doi'], 'benchmark report lost DOI provenance')
need(report['source']['license'] == 'CC BY 4.0', 'benchmark report lost licence provenance')
need(report['process_context']['declared'] == 'injection-moulding', 'benchmark report lost process separation')
need(report['process_context']['separation_confirmed_by_operator'] is True, 'benchmark process separation confirmation missing')
need(not report['schema']['missing_expected_columns'], f"synthetic fixture missing contract columns: {report['schema']['missing_expected_columns']}")
need(not report['schema']['unexpected_columns'], f"synthetic fixture has unexpected columns: {report['schema']['unexpected_columns']}")
profiles = {c['name']: c for c in report['schema']['columns']}
need(profiles['Injection_Pressure']['missing_count'] == 1, 'missing injection-pressure value must stay missing')
need(profiles['Injection_Pressure']['command_actual'] == 'unknown_source_semantics', 'report must preserve actual-vs-command uncertainty')
need(profiles['%Flash']['class'] == 'derived_quality_metric', 'derived quality field was promoted to causal evidence')
need('%Flash' in report['interpretation']['quality_or_derived_columns_not_root_causes'], 'derived quality root-cause guard missing')
need('Injection_Pressure' in report['interpretation']['command_actual_unresolved_columns'], 'actual-vs-command uncertainty list missing process evidence')
need(report['status'] == 'profile-generated-review-required', 'benchmark profile must require human review')
report_text = json.dumps(report, ensure_ascii=False)
for forbidden_key in ['"raw_rows"', '"row_values"', '"sample_values"', '"examples"', '"minimum"', '"maximum"']:
    need(forbidden_key not in report_text, f'benchmark profile exposes raw/range detail via {forbidden_key}')
need('no result authorises a production change' in report['interpretation']['boundary'].lower(), 'benchmark production-authority boundary missing')

print('MouldMaster real process-data/live-release QA passed (public learner release QA-gated; authorised-site validation remains external and claim-gated)')
