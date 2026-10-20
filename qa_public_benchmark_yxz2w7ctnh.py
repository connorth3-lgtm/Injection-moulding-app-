from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/yxz2w7ctnh-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_yxz2w7ctnh.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported yxz2 contract schema")
need(x.get("datasetId") == "mendeley-yxz2w7ctnh-v1", "yxz2 dataset id drifted")
need(x["source"]["datasetDoi"] == "10.17632/yxz2w7ctnh.1", "yxz2 DOI drifted")
need(x["source"]["license"] == "CC BY 4.0", "yxz2 licence drifted")
need(len(x["source"]["files"]) == 4, "yxz2 publisher file manifest drifted")
for f in x["source"]["files"]:
    need(len(f["sha256"]) == 64, f"missing exact publisher SHA for {f['name']}")
r = x["semanticRules"]
need(r["countOnlyExplicitInjectionMouldedBlocks"] is True, "explicit injection gate missing")
need(r["exclude3dPrintedBlocks"] is True, "FDM exclusion missing")
need(r["excludeEnergySheets"] is True, "energy exclusion missing")
need(r["excludeImpactSheetsBecauseNoInjectionVsFdmIdentityIsDelivered"] is True, "ambiguous impact exclusion missing")
need(r["deduplicateRepeatedWorksheetHashesAcrossFiles"] is True, "worksheet dedupe missing")
need(r["excludeFormulaCellsAsDerived"] is True, "formula exclusion missing")
need(r["acceptedMeasuredTimeSeriesSamples"] == 0, "record-level source cannot claim waveform samples")
text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "sheet_hash",
    "duplicateWorksheetGroupsExcluded",
    "selectedInjectionBlocks",
    "directRecordLevelInjectionMeasuredValues",
    "impactSheetsExcludedForRouteAmbiguity",
    "formulaCellsExcludedAsDerived",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "rawRowsOrNumericValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"yxz2 runner guard missing: {marker}")
need("publisher SHA mismatch" in text, "publisher fingerprint gate missing")
print("MouldMaster PLA/ABS injection mechanical benchmark QA passed")
