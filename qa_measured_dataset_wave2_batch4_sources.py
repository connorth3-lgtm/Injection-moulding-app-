from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def load_result(name):
    return json.loads((ROOT / "data/public-benchmark-results" / name).read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


ypf = load_result("ypf95p4bs4-v1.json")
need(ypf["status"] == "accepted-profiled-record-level-injection-operations", "ypf acceptance state drifted")
need(ypf["source"]["datasetDoi"] == "10.17632/ypf95p4bs4.1" and ypf["source"]["license"] == "CC BY 4.0", "ypf source identity/rights drifted")
need(ypf["source"]["publisherSha256Matched"] is True, "ypf publisher fingerprint not verified")
need(ypf["profile"]["directRecordLevelInjectionOperationalMeasurements"] == 666, "ypf direct operational measurement count drifted")
need([x["directObservedValues"] for x in ypf["profile"]["acceptedDirectObservedBlocks"]] == [26, 194, 116, 330], "ypf accepted source-block counts drifted")
need(ypf["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is True and ypf["acceptance"]["acceptedRecordLevelMeasuredValues"] == 666, "ypf family acceptance drifted")
need(ypf["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "ypf must add zero process waveform samples")
need(ypf["retrieval"]["validationWorkbookDownloaded"] is False and ypf["retrieval"]["doeFilesDownloaded"] is False, "ypf simulation/validation exclusion drifted")
need(ypf["retrieval"]["rawPublisherFileCommitted"] is False and ypf["retrieval"]["rawNumericValuesUploadedAsArtifact"] is False, "ypf raw-data boundary drifted")

sic_stage1 = load_result("sic-nylon6-alt-stage1.json")
need(sic_stage1["status"] == "publisher-file-manifest-exposed", "SiC alternate stage-1 state drifted")
need(sic_stage1["manifest"]["uniquePayloadHashes"] == 1 and sic_stage1["manifest"]["duplicatePublisherEntriesByHash"] == 1, "SiC alternate duplicate-payload boundary drifted")
need(sic_stage1["manifest"]["structuredStandaloneNumericFiles"] == 0 and sic_stage1["manifest"]["rawPayloadsDownloaded"] is False, "SiC stage-1 manifest boundary drifted")

sic = load_result("sic-nylon6-alt-v1.json")
need(sic["status"] == "accepted-profiled-injection-moulded-tribology", "SiC tribology acceptance state drifted")
need(sic["source"]["primaryDatasetDoi"] == "10.17632/ztkc87d6sr.1" and sic["source"]["alternateDatasetDoi"] == "10.17632/47k6jswwg7.1", "SiC primary/alternate identity drifted")
need(sic["source"]["useLicenseBoundary"] == "CC BY-NC 3.0" and sic["source"]["publisherSha256Matched"] is True, "SiC accepted payload rights/fingerprint drifted")
need(sic["profile"]["directRecordLevelTribologyMeasurements"] == 40, "SiC tribology measurement count drifted")
need([x["directMeasuredValues"] for x in sic["profile"]["acceptedDirectMeasuredBlocks"]] == [20, 20], "SiC accepted table counts drifted")
need(sic["acceptance"]["recoversPreviouslyBlockedDatasetFamily"] is True, "SiC alternate must recover the existing family")
need(sic["acceptance"]["createsNewSecondFamilyForAlternateDoi"] is False, "SiC alternate DOI must not create a second family")
need(sic["acceptance"]["acceptedRecordLevelMeasuredValues"] == 40 and sic["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "SiC accepted value/waveform boundary drifted")
need(sic["acceptance"]["commercialReuseAllowed"] is False and sic["acceptance"]["rawRedistributionAllowedUnderProjectPolicy"] is False, "SiC noncommercial boundary drifted")
need(sic["profile"]["imageOcrPerformed"] is False and sic["retrieval"]["imagesOcred"] is False, "SiC image-only evidence must not be OCR-counted")
need(sic["retrieval"]["duplicateSecondPublisherEntryDownloaded"] is False and sic["retrieval"]["rawPublisherFileCommitted"] is False, "SiC duplicate/raw-file boundary drifted")

runner_ypf = (ROOT / "tools/run_public_benchmark_ypf95p4bs4_stage3.py").read_text(encoding="utf-8")
runner_sic = (ROOT / "tools/run_public_benchmark_sic_nylon6_alt_stage3.py").read_text(encoding="utf-8")
for marker in ["Limpieza 2023 (Mtto)", "Setup 2023", "Paradas de Maquinaria 2023", "Tiempos de Setup (Westinghouse)", "'acceptedMeasuredTimeSeriesSamples':0"]:
    need(marker in runner_ypf, f"ypf source-specific semantic guard missing: {marker}")
for marker in ["coefficient-of-friction", "wear", "5N", "10N", "20N", "30N", "total!=40", "'createsNewSecondFamilyForAlternateDoi':False", "'commercialReuseAllowed':False", "'imageOcrPerformed':False"]:
    need(marker in runner_sic, f"SiC source-specific semantic guard missing: {marker}")

print("Wave-2 batch-4 source QA passed: ypf 666 direct operational values; SiC/Nylon-6 alternate recovers existing family with 40 tribology values; both add zero process waveform samples")
