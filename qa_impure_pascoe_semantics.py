from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DICTIONARY = ROOT / 'data' / 'impure-pascoe-channel-dictionary-v1.json'
REVIEW = ROOT / 'data' / 'impure-pascoe-semantic-review-2026-08-30.json'
CONTRACT = ROOT / 'data' / 'public-benchmark-contracts' / 'impure-pascoe-2022-v1.json'
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing ImPure semantic dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


d = load(DICTIONARY)
r = load(REVIEW)
c = load(CONTRACT)
i = load(INVENTORY)

need(d.get('schema') == 1 and d.get('datasetId') == 'impure-pascoe-2022', 'ImPure channel dictionary identity drifted')
need(d.get('version') == '2026.08.30.1', 'ImPure channel dictionary version drifted')
need(r.get('decision') == 'partial-measured-channel-acceptance', 'ImPure review decision drifted')
need(c.get('status') == 'accepted-profiled-partially-semantic-resolved', 'ImPure contract partial-acceptance state drifted')

accepted = {
    'TempMold1[IRT/Pascoe]': ('degC', 'mould cavity 1 contact temperature'),
    'TempMold2[IRT/Pascoe]': ('degC', 'mould cavity 2 contact temperature'),
    'Pressure1[IRT/Pascoe]': ('bar', 'mould cavity 1 pressure'),
    'Pressure2[IRT/Pascoe]': ('bar', 'mould cavity 2 pressure'),
}
by_column = {x['column']: x for x in d['cycleSchema']}
need(set(by_column) == {
    'Time', 'HydPressure[IRT/Pascoe]', 'ScrewPosition[IRT/Pascoe]',
    'Analog Input[1]', 'Analog Input[2]', 'TempMold1[IRT/Pascoe]',
    'TempMold2[IRT/Pascoe]', 'Pressure1[IRT/Pascoe]', 'Pressure2[IRT/Pascoe]'
}, 'ImPure delivered schema drifted')
for column, (unit, meaning) in accepted.items():
    x = by_column[column]
    need(x.get('status') == 'accepted-measured', f'{column}: accepted-measured status drifted')
    need(x.get('engineeringUnit') == unit, f'{column}: unit drifted')
    need(x.get('meaning') == meaning, f'{column}: physical meaning drifted')
    need(x.get('commandActualSemantics') == 'measured', f'{column}: measurement role drifted')
    need('6188A' in str(x.get('measurementLocation')), f'{column}: cavity-sensor model evidence missing')

need(by_column['Time'].get('status') == 'accepted-ordering-not-counted', 'ImPure time-basis status drifted')
need('seconds' in str(by_column['Time'].get('engineeringUnit')), 'ImPure time-delta interpretation missing')
need(by_column['HydPressure[IRT/Pascoe]'].get('engineeringUnit') is None, 'do not invent ImPure hydraulic-pressure export unit')
need('export-unit-required' in by_column['HydPressure[IRT/Pascoe]'].get('status', ''), 'ImPure hydraulic-pressure unit gate missing')
need(by_column['ScrewPosition[IRT/Pascoe]'].get('engineeringUnit') is None, 'do not invent ImPure screw-position export unit')
need('unit-reference-required' in by_column['ScrewPosition[IRT/Pascoe]'].get('status', ''), 'ImPure screw-position unit/reference gate missing')
need(by_column['Analog Input[1]'].get('engineeringUnit') is None, 'do not infer a unit for ImPure Analog Input[1]')
need(by_column['Analog Input[1]'].get('status') == 'exact-signal-definition-required', 'ImPure Analog Input[1] gate drifted')
need(by_column['Analog Input[2]'].get('engineeringUnit') is None, 'do not assign one global unit to ImPure Analog Input[2]')
need(by_column['Analog Input[2]'].get('status') == 'configuration-dependent-not-globally-counted', 'ImPure Analog Input[2] stage gate drifted')

profile = d.get('profiledStructure') or {}
need(profile.get('publisherFiles') == 309, 'ImPure publisher-file count drifted')
need(profile.get('cycleFiles') == 307, 'ImPure cycle-file count drifted')
need(profile.get('cycleRows') == 297087, 'ImPure cycle-row count drifted')
need(profile.get('profiledNumericValues') == 2376696, 'ImPure profiled numeric-value count drifted')
need(profile.get('acceptedMeasuredChannels') == 4, 'ImPure accepted-channel count drifted')
need(profile.get('acceptedMeasuredTimeSeriesSamples') == 1188348, 'ImPure accepted measured-value count drifted')
need(profile.get('acceptedCountFormula') == '4 * 297087', 'ImPure accepted-count formula drifted')

review_accepted = {x['column'] for x in r.get('acceptedColumns') or []}
need(review_accepted == set(accepted), 'ImPure review accepted-column set drifted')
review_excluded = {x['column'] for x in r.get('excludedColumns') or []}
need(review_excluded == {
    'HydPressure[IRT/Pascoe]', 'ScrewPosition[IRT/Pascoe]',
    'Analog Input[1]', 'Analog Input[2]', 'Time'
}, 'ImPure review exclusion boundary drifted')
need((r.get('counting') or {}).get('acceptedMeasuredTimeSeriesSamples') == 1188348, 'ImPure review count drifted')
need((r.get('executedEvidence') or {}).get('publisherFilesVerifiedInProbe') == 309, 'ImPure semantic probe did not cover full publisher file set')
need((r.get('executedEvidence') or {}).get('rawRowsOrCellValuesEmitted') is False, 'ImPure semantic evidence must remain aggregate-only')
notes = ' '.join((r.get('stageMetadataEvidence') or {}).get('aggregateOnlyNotesObserved') or []).lower()
need('flow of core water' in notes and 'nozzle temperature' in notes, 'ImPure stage-dependent Analog Input[2] evidence missing')
need((r.get('timeBasis') or {}).get('fixedSamplingIntervalAssumed') is False, 'ImPure variable-rate time trace must not be rewritten as fixed-rate')

semantic = c.get('semanticAcceptance') or {}
need(set(semantic.get('acceptedMeasuredColumns') or []) == set(accepted), 'ImPure contract accepted-column set drifted')
need(semantic.get('acceptedMeasuredChannels') == 4, 'ImPure contract accepted-channel count drifted')
need(semantic.get('acceptedMeasuredTimeSeriesSamples') == 1188348, 'ImPure contract accepted measured-value count drifted')
need(set((semantic.get('excludedColumns') or {}).keys()) == {
    'HydPressure[IRT/Pascoe]', 'ScrewPosition[IRT/Pascoe]', 'Analog Input[1]', 'Analog Input[2]'
}, 'ImPure contract unresolved-column set drifted')

inventory_rows = {x['datasetId']: x for x in i.get('datasets') or []}
impure = inventory_rows['impure-pascoe-2022']
count = impure.get('count') or {}
need(count.get('cycleRows') == 297087 and count.get('profiledNumericValues') == 2376696, 'ImPure inventory structure drifted')
need(count.get('acceptedMeasuredChannels') == 4, 'ImPure inventory accepted-channel count drifted')
need(count.get('acceptedMeasuredTimeSeriesSamples') == 1188348, 'ImPure inventory accepted measured-value count drifted')
need('stage-dependent' in impure.get('statusNote', '').lower(), 'ImPure inventory must preserve stage-dependent analogue exclusion')
need(impure.get('peerReviewedCompanion') == '10.1051/matecconf/202440108011', 'ImPure peer-reviewed companion drifted')

print('MouldMaster ImPure semantic QA passed (307 cycle files / 297,087 rows; four source-backed cavity channels accepted = 1,188,348 measured values; hydraulic, screw-position and analogue channels remain fail-closed where definitions are incomplete or stage-dependent)')
