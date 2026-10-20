from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def load(name):
    return json.loads((ROOT / "data/public-benchmark-results" / name).read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


xrd = load("8c8fjwcw86-v1.json")
need(xrd["status"] == "accepted-profiled-injection-moulded-xrd-characterization", "XRD status drifted")
need(xrd["source"]["datasetDoi"] == "10.17632/8c8fjwcw86.1" and xrd["source"]["license"] == "CC BY 4.0", "XRD source identity/rights drifted")
need(all(x["publisherSha256Matched"] is True for x in xrd["source"]["publisherPackage"]), "XRD publisher fingerprints are not verified")
need(xrd["profile"]["acceptedSeriesSemanticLabel"] == "Injection Molded Nylon 12", "XRD route-specific semantic label drifted")
need(xrd["profile"]["acceptedMeasuredXrdIntensityValues"] == 6_588, "XRD direct intensity count drifted")
need(xrd["profile"]["xrdCategoryAxisValuesExcluded"] == 6_588, "XRD axis exclusion drifted")
need(xrd["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "XRD must add zero process waveform samples")
need(xrd["acceptance"]["rawPublisherFilesCommitted"] is False and xrd["acceptance"]["rawNumericValuesCommittedOrArtifacted"] is False, "XRD raw-data boundary drifted")

xps = load("crmb7xjymg-v1.json")
need(xps["status"] == "completed-profiled-xps-vamas-material-tool-interface", "XPS status drifted")
need(xps["source"]["datasetDoi"] == "10.17632/crmb7xjymg.1" and xps["source"]["license"] == "CC BY 4.0", "XPS source identity/rights drifted")
need(xps["source"]["publisherSha256Matched"] is True, "XPS publisher fingerprint not verified")
need(xps["profile"]["vamasBlockCount"] == xps["profile"]["xpsBlockCount"] == 88, "XPS block count drifted")
need(xps["profile"]["measuredDetectorCountsValues"] == 71_868, "XPS detector Counts count drifted")
need(xps["acceptance"]["energyAxisExcluded"] is True and xps["acceptance"]["transmissionAndCalibrationVariablesExcluded"] is True, "XPS exclusion boundary drifted")
need(xps["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "XPS must add zero process waveform samples")
need(xps["retrieval"]["rawPublisherFileCommitted"] is False and xps["retrieval"]["rawSpectralValuesUploadedAsArtifact"] is False, "XPS raw-data boundary drifted")

p597 = load("597jrsm9zm-v1.json")
need(p597["status"] == "profiled-process-documentation-only-noncounting", "597 process-documentation state drifted")
need(p597["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "597 must remain non-counting")
need(p597["rightsBoundary"]["commercialReuseAllowed"] is False, "597 noncommercial boundary drifted")

c3 = load("c3pt29jt7c-v1.json")
need(c3["status"] == "retrieved-profile-blocked-external-dic-workbook-not-delivered", "c3 blocker state drifted")
need(c3["deliveredWorkbookProfile"]["chartCount"] == 20 and c3["deliveredWorkbookProfile"]["chartSeriesCount"] == 74, "c3 delivered chart profile drifted")
need(c3["deliveredWorkbookProfile"]["externalWorkbookToken"] == "[1]PP6523_DIC!", "c3 external workbook token drifted")
need(c3["deliveredWorkbookProfile"]["rawDicMeasurementArraysEmbeddedInDeliveredWorkbook"] is False, "c3 missing-array boundary drifted")
need(c3["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "c3 must remain non-counting")

ztkc = load("ztkc87d6sr-v1.json")
need(ztkc["status"] == "publisher-record-no-files-exposed", "ztkc payload blocker state drifted")
need(ztkc["profile"]["publisherFilesExposed"] == 0, "ztkc must expose zero payload files")
need(ztkc["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "ztkc must remain non-counting")

strath = load("strathclyde-rtim-tablets-v1.json")
need(strath["status"] == "retrieval-blocked-http", "Strathclyde blocker state drifted")
need([x["httpStatus"] for x in strath["retrieval"]["attempts"]] == [403, 403, 403], "Strathclyde HTTP evidence drifted")
need(strath["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "Strathclyde must remain non-counting")
need(strath["acceptance"]["acceptedRecordLevelOrCharacterizationValues"] == 0, "Strathclyde must not count undelivered workbook values")

print("Wave-2 XRD/XPS source QA passed: XRD 6,588 + XPS 71,868 accepted characterization values; 597/c3/ztkc/Strathclyde remain non-counting or blocked; process waveform delta 0")
