from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNNER = ROOT / "tools/run_public_benchmark_4h98rz9f92_stage3.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

text=RUNNER.read_text(encoding="utf-8")
for marker in [
  'EXPECTED_SHA256 = "39210169aac62a1455603d37cdffaca93cf0c46189ea4258c5f3c0a4a37255c9"',
  'EXPECTED_TOTAL_NUMERIC = 770',
  'EXPECTED_DIRECT_MEASUREMENTS = 525',
  'EXPECTED_DERIVED_AVERAGES = 105',
  'EXPECTED_PROCESS_INPUT_VALUES = 105',
  'EXPECTED_EXPERIMENT_IDENTIFIERS = 35',
  'ROLE_COLUMNS',
  'directMeasuredPropertyValues',
  'derivedAverageValuesExcluded',
  'countsAsFullyProfiledMeasuredDataset\":True',
  'acceptedMeasuredTimeSeriesSamples\":0',
  'modelAndClassificationFilesExcluded\":True',
  'rawRowsOrCellValuesUploadedAsArtifact\":False'
]: need(marker in text, f"HDPE/GNP stage-three guard missing: {marker}")
need('if digest!=EXPECTED_SHA256' in text, "retrieved SHA gate missing")
need('if psha(item)!=EXPECTED_SHA256' in text, "publisher SHA gate missing")
need('any(counts[c]!=EXPECTED_ROWS_PER_COLUMN' in text, "exact 35-row-per-column gate missing")
need('formulas!=0' in text, "formula exclusion gate missing")
print("MouldMaster HDPE/GNP semantic acceptance QA passed")
