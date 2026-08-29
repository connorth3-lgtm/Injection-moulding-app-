from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parent

SHOT = ROOT / 'data' / 'real-process-data-pilot-template.csv'
DICTIONARY = ROOT / 'data' / 'real-process-data-dictionary-template.csv'
TRACE = ROOT / 'data' / 'real-process-trace-template.csv'
CALIBRATION = ROOT / 'data' / 'real-process-sensor-calibration-template.csv'
EVENT = ROOT / 'data' / 'real-process-event-template.csv'
CONTRACT = ROOT / 'sources' / 'REAL_PROCESS_DATA_CAPTURE_CONTRACT.md'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def header_only(path):
    need(path.exists(), f'missing real-process contract file: {path.relative_to(ROOT)}')
    rows = list(csv.reader(path.read_text(encoding='utf-8').splitlines()))
    need(len(rows) == 1, f'{path.name} must remain header-only in the public repository')
    header = rows[0]
    need(header and len(header) == len(set(header)), f'{path.name} has blank or duplicate header definitions')
    return header


shot = header_only(SHOT)
dictionary = header_only(DICTIONARY)
trace = header_only(TRACE)
calibration = header_only(CALIBRATION)
event = header_only(EVENT)
need(CONTRACT.exists(), 'real process-data capture contract is missing')
contract = CONTRACT.read_text(encoding='utf-8')

shot_required = {
    'shot_index', 'cavity_alias', 'machine_alias', 'mould_alias', 'material_alias',
    'lot_alias', 'material_batch_alias', 'production_period_alias', 'phase',
    'fill_time_s', 'transfer_position_mm', 'transfer_pressure_mpa', 'cushion_mm',
    'recovery_time_s', 'cycle_time_s', 'resin_moisture_ppm', 'dryer_dew_point_c',
    'drying_time_h', 'regrind_fraction_pct', 'part_mass_g',
    'dimension_characteristic_alias', 'dimension_value', 'dimension_unit',
    'inspection_method_alias', 'quality_result', 'defect_alias',
    'maintenance_event_code', 'process_change_code', 'intervention_code'
}
need(shot_required.issubset(set(shot)), f'shot template missing fields: {sorted(shot_required - set(shot))}')

dictionary_required = {
    'field_name', 'source_system', 'source_field_name', 'field_meaning', 'field_role',
    'measurement_location', 'command_actual_semantics', 'engineering_unit', 'data_type',
    'sampling_basis', 'sampling_rate_hz', 'time_basis', 'missing_value_codes',
    'zero_is_valid', 'scale_factor', 'offset', 'cycle_link_field', 'cavity_link_field',
    'quality_link_field', 'sensor_id', 'calibration_record_id', 'confidentiality_class'
}
need(dictionary_required.issubset(set(dictionary)), f'data dictionary template missing fields: {sorted(dictionary_required - set(dictionary))}')

trace_required = {
    'shot_index', 'cavity_alias', 'signal_id', 'sample_index', 'relative_time_s',
    'value', 'engineering_unit', 'sensor_id', 'calibration_record_id'
}
need(trace_required.issubset(set(trace)), f'trace template missing fields: {sorted(trace_required - set(trace))}')

calibration_required = {
    'calibration_record_id', 'sensor_id', 'signal_id', 'machine_alias', 'mould_alias',
    'cavity_alias', 'measurement_location', 'engineering_unit', 'calibration_state',
    'valid_from_shot', 'valid_to_shot', 'sampling_rate_hz', 'scale_factor', 'offset',
    'zero_reference'
}
need(calibration_required.issubset(set(calibration)), f'calibration template missing fields: {sorted(calibration_required - set(calibration))}')

event_required = {
    'event_id', 'event_type', 'relative_shot_index', 'relative_time_s', 'machine_alias',
    'mould_alias', 'cavity_alias', 'material_alias', 'lot_alias', 'maintenance_event_code',
    'process_change_code', 'intervention_code', 'hypothesis_code',
    'verification_window_shots', 'outcome_code'
}
need(event_required.issubset(set(event)), f'event template missing fields: {sorted(event_required - set(event))}')

forbidden_prepared_tokens = {
    'customer', 'operator', 'person', 'employee', 'email', 'phone', 'address',
    'timestamp', 'datetime', 'customer_part', 'part_number'
}
for path, header in [(SHOT, shot), (TRACE, trace), (CALIBRATION, calibration), (EVENT, event)]:
    for col in header:
        lower = col.lower()
        need(not any(token in lower for token in forbidden_prepared_tokens),
             f'{path.name} exposes a direct/proprietary prepared-field class: {col}')

for marker in [
    'No measured value becomes accepted evidence unless its field meaning, engineering unit, sampling basis and cycle/source linkage are known.',
    'measurement location and calibration/zero state',
    'material and lot/batch alias',
    'regrind or recycled-content fraction',
    'maintenance, cleaning, component replacement and inspection events',
    'cycle/cavity-resolved outcomes',
    'another machine or cell',
    'issue #73', 'issue #74', 'issue #75',
    'does not define validated process windows',
]:
    need(marker in contract, f'capture contract boundary missing: {marker}')

print('MouldMaster real process-data capture contract QA passed')
