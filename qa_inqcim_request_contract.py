#!/usr/bin/env python3
"""Fail-closed QA for the request-only INQCIM measured-data source."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data" / "inqcim-request-contract-2026-08-30.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(contract.get("schema") == 1, "INQCIM contract schema drifted")
need(contract.get("datasetId") == "inqcim-2500-request", "INQCIM dataset id drifted")
need(contract.get("status") == "blocked-request-only", "INQCIM must remain request-only until authorised delivery")

source = contract.get("source") or {}
need(source.get("paperDoi") == "10.3390/polym14173551", "INQCIM DOI drifted")
need(source.get("projectId") == "FFG 864885", "INQCIM FFG project id drifted")
need(source.get("publicDatasetLocated") is False, "Do not claim a public INQCIM dataset without evidence")
need(source.get("datasetLicenseLocated") is False, "Do not invent an INQCIM dataset licence")
need(source.get("automatedIngestionAllowed") is False, "INQCIM automated ingestion must remain fail-closed")
need(source.get("rawRedistributionAllowed") is False, "INQCIM raw redistribution must remain fail-closed")
need("available upon request" in source.get("dataAvailabilityStatement", "").lower(), "Request-only source statement missing")

structure = contract.get("paperBackedStructure") or {}
need(structure.get("doeExperiments") == 56, "INQCIM DOE experiment count drifted")
need(structure.get("minimumSamplesPerExperiment") == 40, "INQCIM minimum samples per experiment drifted")
need(structure.get("approxTotalMoldedSamples") == 2500, "INQCIM approximate sample count drifted")
need(structure.get("statisticalDoeShotsPerExperiment") == 10, "INQCIM statistical DOE shot count drifted")
need(structure.get("machineAndPeripheralOpcUaRateHz") == 60, "INQCIM OPC UA sampling rate drifted")
need(structure.get("analogMachineRateHz") == 600, "INQCIM machine analog sampling rate drifted")
need(structure.get("analogMoldRateHz") == 600, "INQCIM mold analog sampling rate drifted")
need(set(structure.get("qualityFeatures") or []) == {"part weight", "dimensional properties", "surface quality"}, "INQCIM quality feature set drifted")

contacts = contract.get("contactEvidence") or {}
corresponding = contacts.get("paperCorrespondingAuthors") or []
need(len(corresponding) >= 2, "INQCIM corresponding-author trail is incomplete")
saeid = next((x for x in corresponding if x.get("name") == "Saeid Saeidi Aminabadi"), None)
need(saeid is not None, "INQCIM Saeid Aminabadi contact missing")
need(saeid.get("paperEmail") == "s.saeidi-aminabadi@stud.unileoben.ac.at", "Paper correspondence address drifted")
need(saeid.get("currentPublicEmail") == "saeid.aminabadi@fhwn.ac.at", "Current public contact route drifted")

request = contract.get("requestRequirements") or {}
need(len(request.get("filesRequested") or []) >= 6, "INQCIM requested file scope is too weak")
need(len(request.get("permissionRequested") or []) >= 4, "INQCIM permission request is too weak")
need("de-identified" in request.get("privacyAndCommercialBoundary", ""), "INQCIM confidentiality fallback missing")

gate = contract.get("acceptanceGate") or {}
need(len(gate.get("requiredBeforeRetrieval") or []) >= 3, "INQCIM retrieval gate is incomplete")
need(len(gate.get("requiredBeforeMeasuredPromotion") or []) >= 5, "INQCIM promotion gate is incomplete")
need("zero accepted measured samples" in contract.get("evidenceBoundary", ""), "INQCIM non-counting boundary missing")

print("INQCIM request-only source contract QA passed")
