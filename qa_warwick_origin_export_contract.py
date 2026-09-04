#!/usr/bin/env python3
"""Fail-closed QA for Warwick promotion-grade Origin and non-counting Viewer contracts."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXPECTED_FILES = [
    "data1_09.06.2023_Material_Jetting.opju",
    "data1_16.06.2023_b2b.opju",
    "data_visualisation.opju",
    "representative_curves_14.06.2023.opju",
    "surface_parameters_27.10.2023.opju",
]
EXPECTED_SIZES = ["3.95 MB", "258 KB", "10.9 MB", "4.64 MB", "698 KB"]


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def need(condition, message):
    if not condition:
        raise AssertionError(message)


source = load("data/warwick-demoulding-source-contract-v1.json")
manifest = load("data/warwick-origin-export-manifest-template-v1.json")
viewer = load("data/warwick-origin-viewer-extraction-contract-v1.json")

need(source["schema"] == 1, "Warwick source schema drifted")
need(source["version"] == "2026.09.05.1", "Warwick source-contract version drifted")
need(source["datasetId"] == "warwick-demoulding", "Warwick dataset id drifted")
need(source["source"]["dataset"] == "https://doi.org/10.17632/x9hc7hf6xd.2", "Warwick DOI drifted")
need(source["source"]["datasetVersion"] == 2, "Warwick dataset version drifted")
need(source["source"]["license"] == "CC BY 4.0", "Warwick licence drifted")
need(source["source"]["institution"] == "University of Warwick", "Warwick institution drifted")
need([x["fileName"] for x in source["publisherFiles"]] == EXPECTED_FILES, "Warwick publisher file list/order drifted")
need([x["publisherDisplaySize"] for x in source["publisherFiles"]] == EXPECTED_SIZES, "Warwick publisher display sizes drifted")
need(all(x["format"] == "opju" for x in source["publisherFiles"]), "Warwick publisher files must remain OPJU")
need(source["retrievedState"]["publisherProjectFiles"] == 5, "Warwick source project-file count drifted")
need(source["retrievedState"]["sha256Verified"] is True, "Warwick retrieved source hashes must remain verified")
need(source["retrievedState"]["acceptedMeasuredTimeSeriesSamples"] == 0, "Warwick must remain non-counting before validated promotion-grade export")
need(source["measurementChain"]["samplingRateHz"] == 10_000, "Warwick source sampling rate drifted")
need("Kistler Type 9211B" in source["measurementChain"]["sensor"], "Warwick source sensor drifted")
need("NI cDAQ-9174" in source["measurementChain"]["dataAcquisition"], "Warwick source DAQ drifted")
need(source["executionContract"]["manifestTemplate"] == "data/warwick-origin-export-manifest-template-v1.json", "Warwick manifest path drifted")
need(source["executionContract"]["validator"] == "tools/validate_warwick_origin_export.py", "Warwick validator path drifted")
need(source["executionContract"]["viewerExtractionContract"] == "data/warwick-origin-viewer-extraction-contract-v1.json", "Warwick Viewer contract path drifted")
need(source["executionContract"]["pendingManifestMustRemainNonCounting"] is True, "Pending Warwick manifest must remain fail-closed")
need(source["executionContract"]["viewerExtractionMustRemainNonCounting"] is True, "Viewer extraction must remain non-counting")
need(source["executionContract"]["readyForCountingRequiresFullOriginOrOriginPro"] is True, "Warwick promotion must require full Origin/OriginPro")
need(source["originViewerLane"]["promotionEligible"] is False, "Viewer lane cannot promote measured evidence")
need(source["originViewerLane"]["emailOrRegistrationUsedForThisPass"] is False, "No email/registration may be fabricated for Viewer lane")

need(manifest["schema"] == 1, "Warwick manifest schema drifted")
need(manifest["version"] == "2026.08.30.1", "Warwick promotion manifest version drifted unexpectedly")
need(manifest["datasetId"] == "warwick-demoulding", "Warwick manifest dataset id drifted")
need(manifest["datasetDoi"] == "10.17632/x9hc7hf6xd.2", "Warwick manifest DOI drifted")
need(manifest["license"] == "CC BY 4.0", "Warwick manifest licence drifted")
need(manifest["status"] == "pending-origin-export", "Committed Warwick promotion manifest template must remain pending")
need(manifest["originEnvironment"]["platform"] == "Windows", "Warwick Origin export platform must remain Windows")
need(manifest["originEnvironment"]["product"] is None, "Pending Warwick manifest must not invent Origin product/version")
need(manifest["originEnvironment"]["validatedOpenOfAllProjects"] is False, "Pending Warwick manifest must not claim project opens")
need([x["sourceFile"] for x in manifest["sourceProjects"]] == EXPECTED_FILES, "Warwick manifest source file list/order drifted")
need([x["publisherDisplaySize"] for x in manifest["sourceProjects"]] == EXPECTED_SIZES, "Warwick manifest publisher sizes drifted")
need(all(x["sourceSha256"] == "REQUIRED_VERIFIED_SHA256" for x in manifest["sourceProjects"]), "Pending Warwick template must use explicit source-hash placeholders")
need(all(x["originOpened"] is False for x in manifest["sourceProjects"]), "Pending Warwick template cannot claim Origin opens")
need(all(x["projectReconciliation"] is None for x in manifest["sourceProjects"]), "Pending Warwick template cannot invent reconciliation")
need(all(x["objects"] == [] for x in manifest["sourceProjects"]), "Pending Warwick template cannot contain fake exported objects")
need(manifest["completedManifestRequirements"]["forceWaveformSamplingRateHz"] == 10_000, "Warwick completed manifest must verify 10 kHz")
need(manifest["completedManifestRequirements"]["derivedColumnsMustRemainNonCounting"] is True, "Warwick derived columns must remain non-counting")
need(manifest["acceptance"]["allFiveProjectsReconciled"] is False, "Pending Warwick template cannot claim reconciliation")
need(manifest["acceptance"]["acceptedMeasuredValues"] == 0, "Pending Warwick template must remain at zero accepted values")
need(manifest["acceptance"]["rawRowsCommittedToRepository"] is False, "Warwick raw tables must remain outside public repository")

need(viewer["status"] == "available-noncounting-extraction-lane", "Viewer lane status drifted")
need(viewer["sourceProjects"] == EXPECTED_FILES, "Viewer project list drifted")
need(viewer["promotionPath"]["viewerAcceptedMeasuredValues"] == 0, "Viewer must remain zero-count")
need(viewer["promotionPath"]["rawRowsCommittedToPublicRepository"] is False, "Viewer exports must remain private/local")
need(viewer["noContactBoundary"]["emailSentForThisPass"] is False, "Viewer lane cannot claim email")
need(viewer["noContactBoundary"]["registrationFormSubmittedForThisPass"] is False, "Viewer lane cannot claim registration")
need(any("cell formulas" in x for x in viewer["forbiddenPromotion"]), "Viewer formula limitation must be explicit")

print("Warwick export contract QA passed (full Origin/OriginPro promotion gate preserved; Viewer extraction is strictly non-counting).")
