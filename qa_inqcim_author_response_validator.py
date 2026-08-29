#!/usr/bin/env python3
"""Regression QA for the local-only INQCIM author-response validator."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "tools" / "validate_inqcim_author_response.py"
TEMPLATE = ROOT / "data" / "inqcim-author-response-manifest-template-v1.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


spec = importlib.util.spec_from_file_location("inqcim_validator", SCRIPT)
need(spec is not None and spec.loader is not None, "cannot load INQCIM response validator")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

need(TEMPLATE.exists(), "INQCIM author-response template missing")
template = json.loads(TEMPLATE.read_text(encoding="utf-8"))
need(template.get("datasetId") == "inqcim-2500-request", "response-template dataset id drifted")
need(template["authorization"]["rawRedistributionAllowed"] is False, "response template must default raw redistribution to false")
need(template["authorization"]["automatedAggregateProfilingAllowed"] is False, "response template must fail closed before author permission")

with tempfile.TemporaryDirectory() as td:
    root = Path(td)
    data_root = root / "delivery"
    data_root.mkdir()
    csv_path = data_root / "inqcim.csv"
    csv_path.write_text(
        "cycle_id,experiment_id,screw_pressure,cavity_pressure,pressure_setpoint\n"
        "1,A,101.123,450.321,100\n"
        "2,A,102.234,451.432,100\n"
        "3,B,,452.543,110\n",
        encoding="utf-8",
    )

    manifest = copy.deepcopy(template)
    manifest["authority"] = {
        "name": "Authorised Data Steward",
        "role": "project_data_steward",
        "organization": "INQCIM project partner",
        "authorizationEvidence": "written response retained outside the public repository",
    }
    manifest["authorization"] = {
        "filesSuppliedOrAuthorizedLocation": True,
        "retrieveAndProfileAllowed": True,
        "automatedAggregateProfilingAllowed": True,
        "rawRedistributionAllowed": False,
        "attributionRequired": True,
        "conditions": ["aggregate-only publication"],
    }
    manifest["delivery"] = {
        "receivedDate": "2026-08-30",
        "files": [{
            "relativePath": "inqcim.csv",
            "declaredRole": "machine_and_mold_measurement",
            "publisherOrAuthorFilename": "inqcim.csv",
        }],
    }
    manifest["semantics"] = {
        "cycleIdentifierField": "cycle_id",
        "experimentIdentifierField": "experiment_id",
        "channels": [
            {
                "field": "screw_pressure",
                "role": "measured_signal",
                "quantity": "screw pressure",
                "unit": "bar",
                "samplingRateHz": 600,
                "sourceEvidence": "author-supplied channel dictionary",
            },
            {
                "field": "cavity_pressure",
                "role": "measured_signal",
                "quantity": "cavity pressure",
                "unit": "bar",
                "samplingRateHz": 600,
                "sourceEvidence": "author-supplied channel dictionary",
            },
            {
                "field": "pressure_setpoint",
                "role": "setpoint",
                "quantity": "pressure setpoint",
                "unit": "bar",
                "samplingRateHz": 60,
                "sourceEvidence": "author-supplied channel dictionary marks this as a command/reference",
            },
        ],
    }

    manifest_path = root / "response.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    result = validator.run(manifest_path, data_root)
    need(result["status"] == "author-response-validated", "valid author response should pass structural validation")
    need(result["authorization"]["rawRedistributionAllowed"] is False, "validator must preserve no-redistribution permission")
    need(result["delivery"]["filesReceived"] == 1, "delivered-file count drifted")
    file_profile = result["delivery"]["files"][0]
    need(len(file_profile["sha256"]) == 64 and file_profile["sizeBytes"] > 0, "source fingerprint missing")
    need(file_profile["tableProfile"]["rows"] == 3 and file_profile["tableProfile"]["columns"] == 5, "aggregate table dimensions drifted")
    need(result["acceptance"]["acceptedMeasuredNumericCellsByField"] == {"cavity_pressure": 3, "screw_pressure": 2}, "measured-cell accounting drifted")
    need(result["acceptance"]["acceptedMeasuredNumericCells"] == 5, "setpoint or missing value was incorrectly counted as measured evidence")
    need(result["acceptance"]["promotionEligible"] is True, "valid source-defined response should be promotion-eligible for manual repo review")
    need(result["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "validator must not auto-promote a family")
    need(result["acceptance"]["rawRowsOrCellValuesEmitted"] is False, "validator must never emit raw values")
    rendered = json.dumps(result, ensure_ascii=False)
    for raw_value in ["101.123", "450.321", "452.543"]:
        need(raw_value not in rendered, "raw cell value leaked into aggregate result")

    denied = copy.deepcopy(manifest)
    denied["authorization"]["automatedAggregateProfilingAllowed"] = False
    denied_path = root / "denied.json"
    denied_path.write_text(json.dumps(denied), encoding="utf-8")
    try:
        validator.run(denied_path, data_root)
        raise AssertionError("missing automated profiling permission must fail closed")
    except ValueError as exc:
        need("automatedAggregateProfilingAllowed" in str(exc), "permission failure reason drifted")

    no_unit = copy.deepcopy(manifest)
    no_unit["semantics"]["channels"][0]["unit"] = ""
    no_unit_path = root / "no-unit.json"
    no_unit_path.write_text(json.dumps(no_unit), encoding="utf-8")
    try:
        validator.run(no_unit_path, data_root)
        raise AssertionError("measured channel without unit must fail closed")
    except ValueError as exc:
        need("missing unit" in str(exc), "unit failure reason drifted")

    missing_identifier = copy.deepcopy(manifest)
    missing_identifier["semantics"]["experimentIdentifierField"] = "missing_experiment_id"
    missing_path = root / "missing-identifier.json"
    missing_path.write_text(json.dumps(missing_identifier), encoding="utf-8")
    blocked = validator.run(missing_path, data_root)
    need(blocked["status"] == "author-response-blocked", "missing identifier must block promotion")
    need(blocked["acceptance"]["acceptedMeasuredNumericCells"] == 0, "blocked package must not contribute accepted measured cells")

print("INQCIM author-response validator QA passed (permission, semantics, fingerprints and aggregate-only output fail closed)")
