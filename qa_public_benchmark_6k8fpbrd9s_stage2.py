from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNNER = ROOT / "tools/run_public_benchmark_6k8fpbrd9s_stage2.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "EXPECTED_FILE_ID = \"8598d42d-f794-47e2-ad84-dd952c900d27\"",
    "EXPECTED_FILE = \"Data.xlsx\"",
    "EXPECTED_SHA256 = \"14c056dd86e11cc47e1e97834174631f9dc0806442917a7149ddf5856dc9b11c\"",
    "semanticMarkers",
    "numericValuesEmitted\": False",
    "numericMeasurementValuesEmitted\": False",
    "countsAsFullyProfiledMeasuredDataset\": False",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "injectionMouldingCycleDataset\": False",
    "rawRowsOrCellValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"pvT stage-two runner guard missing: {marker}")
need("if digest != EXPECTED_SHA256" in text, "pvT exact-source hash gate missing")
need("load_workbook" in text, "pvT workbook parser missing")
print("MouldMaster polypropylene pvT stage-two aggregate QA passed")
