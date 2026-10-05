from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNNER = ROOT / "tools/run_public_benchmark_4h98rz9f92_stage2.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    'EXPECTED_FILE_ID = "368356fe-618c-4eab-82e6-53dc86762943"',
    'EXPECTED_FILE = "Raw Data.xlsx"',
    'EXPECTED_SHA256 = "452fc2077ae9227b8816ae73431c048ac294c87aa40b8abe919371ae3b87c6bc"',
    'retrieved-profile-needs-semantic-review',
    'textLabels',
    'numericCellsByColumn',
    'numericMeasurementValuesEmitted\":False',
    'countsAsFullyProfiledMeasuredDataset\":False',
    'acceptedMeasuredTimeSeriesSamples\":0',
    'stage3SemanticMappingRequired\":True',
    'rawRowsOrCellValuesUploadedAsArtifact\":False'
]:
    need(marker in text, f"HDPE/GNP stage-two guard missing: {marker}")
need("if digest != EXPECTED_SHA256" in text, "retrieved workbook SHA gate missing")
need("if psha != EXPECTED_SHA256" in text, "publisher manifest SHA gate missing")
need("RFR_" not in text, "stage two must not retrieve Random-Forest workbooks")
need("Code1.txt" not in text and "Rules DT.xlsx" not in text, "stage two must not retrieve derived/supporting files")
print("MouldMaster HDPE/GNP stage-two aggregate QA passed")
