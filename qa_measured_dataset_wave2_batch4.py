from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
EXT1 = json.loads((ROOT / "data/measured-dataset-wave2-extension-v1.json").read_text(encoding="utf-8"))
EXT2 = json.loads((ROOT / "data/measured-dataset-wave2-batch4-extension-v1.json").read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(EXT1["effective"] == {
    "inventoriedMeasuredSources": 31,
    "automatedIngestionAllowed": 19,
    "fullyProfiledMeasuredFamilies": 14,
    "acceptedInjectionProcessTimeSeriesValues": 66_521_519,
    "wave2MaterialCharacterizationTraceValues": 84_482,
}, "XRD/XPS effective base drifted before batch 4")
need(EXT2["baseEffective"]["inventoriedMeasuredSources"] == 31, "batch-4 base inventory drifted")
need(EXT2["baseEffective"]["automatedIngestionAllowed"] == 19, "batch-4 base executable count drifted")
need(EXT2["baseEffective"]["fullyProfiledMeasuredFamilies"] == 14, "batch-4 base family count drifted")
need(EXT2["baseEffective"]["acceptedInjectionProcessTimeSeriesValues"] == 66_521_519, "batch-4 base waveform count drifted")
need(EXT2["delta"] == {
    "inventoriedMeasuredSources": 1,
    "automatedIngestionAllowed": 0,
    "fullyProfiledMeasuredFamilies": 2,
    "acceptedInjectionProcessTimeSeriesValues": 0,
    "acceptedRecordLevelMeasuredValues": 706,
}, "batch-4 delta drifted")
need(EXT2["effective"] == {
    "inventoriedMeasuredSources": 32,
    "automatedIngestionAllowed": 19,
    "fullyProfiledMeasuredFamilies": 16,
    "acceptedInjectionProcessTimeSeriesValues": 66_521_519,
    "wave2RecordLevelMeasuredValues": 1816,
    "wave2MaterialCharacterizationTraceValues": 84_482,
}, "batch-4 effective reconciliation drifted")
need(len(EXT2["inventoryAdditions"]) == 1 and EXT2["inventoryAdditions"][0]["datasetId"] == "mendeley-ypf95p4bs4-v1", "batch-4 must add exactly one new inventory family")
need(len(EXT2["inventoryUpdates"]) == 1 and EXT2["inventoryUpdates"][0]["datasetId"] == "mendeley-ztkc87d6sr-v1", "batch-4 must recover exactly the existing ztkc family")
ztkc = EXT2["inventoryUpdates"][0]["replacement"]
need(ztkc["alternateSource"] == "https://doi.org/10.17632/47k6jswwg7.1", "SiC alternate release DOI drifted")
need(ztkc["automatedIngestionAllowed"] is False and ztkc["restrictedAggregateProfilingAllowed"] is True, "narrower alternate payload rights must control accepted profile")
need(ztkc["count"]["acceptedRecordLevelMeasuredValues"] == 40, "SiC recovered-family value count drifted")
need(EXT2["inventoryAdditions"][0]["count"]["acceptedRecordLevelMeasuredValues"] == 666, "ypf accepted value count drifted")
need(EXT2["effectiveInventorySummary"]["datasets"] == 32 and EXT2["effectiveInventorySummary"]["automatedIngestionAllowed"] == 19, "batch-4 effective inventory summary drifted")
need(EXT2["effectiveExecutionSummary"]["acceptedProfiled"] == 16 and EXT2["effectiveExecutionSummary"]["acceptedRestrictedResearchEducation"] == 3, "batch-4 effective execution summary drifted")
for key in ["oldBatch4BranchInherited", "rawThirdPartyRowsOrFilesCommitted"]:
    need(EXT2["boundaries"][key] is False, f"batch-4 boundary must remain false: {key}")
for key in ["alternateReleaseDoesNotCreateSecondFamily", "narrowerDeliveredPayloadLicenseControlsAcceptedProfile", "simulationAndDerivedOperationalArtifactsExcluded", "imageOnlyTgaFtirSemNotOcrCounted", "recordLevelOperationalAndTribologyValuesDoNotInflateInjectionProcessWaveformMetric"]:
    need(EXT2["boundaries"][key] is True, f"batch-4 boundary missing: {key}")

print("Wave-2 batch-4 reconciliation QA passed: 31/19/14 -> 32/19/16 with +706 record-level values and zero process-waveform delta")
