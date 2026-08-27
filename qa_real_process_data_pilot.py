from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parent
PROTOCOL = ROOT / 'sources' / 'REAL_PROCESS_DATA_PILOT_PROTOCOL.md'
TEMPLATE = ROOT / 'data' / 'real-process-data-pilot-template.csv'
INTAKE = ROOT / 'sources' / 'REAL_PROCESS_DATA_INTAKE.md'
PUBLIC_BENCHMARKS = ROOT / 'sources' / 'PUBLIC_REAL_PROCESS_DATA_BENCHMARKS.md'
README = ROOT / 'README.md'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

for path in [PROTOCOL, TEMPLATE, INTAKE, PUBLIC_BENCHMARKS, README]:
    need(path.exists(), f'real-data pilot file missing: {path.relative_to(ROOT)}')

protocol = PROTOCOL.read_text(encoding='utf-8')
intake = INTAKE.read_text(encoding='utf-8')
benchmarks = PUBLIC_BENCHMARKS.read_text(encoding='utf-8')
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
]:
    need(marker in benchmarks, f'public real-data benchmark safeguard missing: {marker}')

need(benchmarks.count('CC BY 4.0') >= 2, 'at least two benchmark candidates must have explicit reuse licences')
need('REAL_PROCESS_DATA_PILOT_PROTOCOL.md' in readme, 'README must link the real-data pilot protocol')
need('real-process-data-pilot-template.csv' in readme, 'README must link the pilot CSV template')
need('pilot-ready' in protocol and 'validated on real production data' in protocol, 'pilot maturity claim gate missing')

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

print('MouldMaster real process-data pilot readiness QA passed (authorised-site protocol + public measured benchmark register)')
