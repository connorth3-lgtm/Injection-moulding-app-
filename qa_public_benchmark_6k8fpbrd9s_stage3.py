from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNNER = ROOT / "tools/run_public_benchmark_6k8fpbrd9s_stage3.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "EXPECTED_SHA256 = \"14c056dd86e11cc47e1e97834174631f9dc0806442917a7149ddf5856dc9b11c\"",
    "EXPECTED_TOTAL_NUMERIC = 31817",
    "EXPECTED_DIRECT_PHYSICAL = 28590",
    "EXPECTED_COORDINATES = 3227",
    "EXPECTED_MATERIAL_TRACE_MEASUREMENTS = 6026",
    "ROLE_COLUMNS",
    "countsAsFullyProfiledMeasuredDataset\": True",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "crossFigureReuseMayExist\": True",
    "uniqueExperimentalMeasurementCount\": None",
    "rawRowsOrCellValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"pvT stage-three guard missing: {marker}")
need("classified != sheet_numeric" in text, "pvT all-cell semantic-classification gate missing")
need("role_totals != EXPECTED_ROLE_TOTALS" in text, "pvT exact role-total regression gate missing")
need("total_formulas != 0" in text, "pvT formula exclusion gate missing")
print("MouldMaster polypropylene pvT semantic acceptance QA passed")
