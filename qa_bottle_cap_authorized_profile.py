#!/usr/bin/env python3
"""Regression QA for confidential bottle-cap controlled-transfer and owner-side profiling."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "tools" / "validate_bottle_cap_authorized_profile.py"
TEMPLATE = ROOT / "data" / "bottle-cap-owner-authorization-manifest-template-v1.json"
PROMOTION = ROOT / "data" / "bottle-cap-confidential-promotion-contract-v1.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


spec = importlib.util.spec_from_file_location("bottle_cap_validator", SCRIPT)
need(spec is not None and spec.loader is not None, "cannot load bottle-cap validator")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

template = json.loads(TEMPLATE.read_text(encoding="utf-8"))
promotion = json.loads(PROMOTION.read_text(encoding="utf-8"))
need(template.get("datasetId") == "bottle-cap-7162-confidential", "authorization template dataset id drifted")
need(template["authorization"]["rawRedistributionAllowed"] is False, "template must default raw redistribution to false")
need(template["authorization"]["automatedAggregateProfilingAllowed"] is False, "template must fail closed before owner permission")
need(promotion["promotionBoundary"]["validatorMayAutoPromoteFullyProfiledFamily"] is False, "validator must never auto-promote confidential family")
need(promotion["privacyBoundary"]["rawRowsInPublicArtifacts"] is False, "raw rows must remain outside public artifacts")


def authorized_base():
    manifest = copy.deepcopy(template)
    manifest["authority"] = {
        "ownerIdentified": True,
        "ownerOrControllerName": "Industrial Data Owner",
        "authorizingRepresentativeName": "Authorized Representative",
        "authorizingRepresentativeRole": "data controller delegate",
        "organization": "Industrial Data Owner",
        "authorizationEvidence": "written owner authorization retained outside the public repository",
    }
    manifest["authorization"] = {
        "researchProfilingAllowed": True,
        "automatedAggregateProfilingAllowed": True,
        "aggregatePublicationAllowed": True,
        "rawRedistributionAllowed": False,
        "conditions": ["aggregate-only publication"],
    }
    manifest["semantics"] = {
        "cycleIdentifierField": "internal_cycle_id",
        "channels": [
            {
                "field": "secret_pressure_tag",
                "publicLabel": "process_pressure",
                "role": "measured_signal",
                "quantity": "process pressure",
                "unit": "bar",
                "sourceEvidence": "owner-supplied channel dictionary",
            },
            {
                "field": "secret_quality_tag",
                "publicLabel": "quality_criterion_1",
                "role": "measured_quality",
                "quantity": "optical quality criterion 1",
                "unit": "mm",
                "sourceEvidence": "owner-supplied optical-inspection dictionary",
            },
            {
                "field": "secret_setpoint_tag",
                "publicLabel": "pressure_command",
                "role": "setpoint",
                "quantity": "pressure setpoint",
                "unit": "bar",
                "sourceEvidence": "owner dictionary marks this channel as a command/reference",
            },
        ],
    }
    return manifest


with tempfile.TemporaryDirectory() as td:
    root = Path(td)

    # Controlled-transfer path: raw data exist only inside this temporary local fixture.
    csv_path = root / "confidential-production.csv"
    csv_path.write_text(
        "internal_cycle_id,secret_pressure_tag,secret_quality_tag,secret_setpoint_tag\n"
        "1,101.123,0.510,100\n"
        "2,102.234,0.520,100\n"
        "3,,0.530,110\n",
        encoding="utf-8",
    )
    transfer = authorized_base()
    transfer["mode"] = "controlled-transfer"
    transfer["confidentiality"] = {
        "rawDataMayLeaveOwnerEnvironment": True,
        "publicArtifactsMayContainRawRowsOrValues": False,
        "storageLocationRestrictions": ["owner-approved encrypted workspace"],
        "retentionOrDeletionRequirements": ["delete after aggregate validation"],
        "additionalConditions": [],
    }
    transfer["delivery"] = {
        "receivedDate": "2026-08-30",
        "files": [{"relativePath": csv_path.name, "declaredRole": "cycle-linked process and quality table"}],
    }
    transfer_path = root / "transfer-manifest.json"
    transfer_path.write_text(json.dumps(transfer), encoding="utf-8")
    result = validator.run(transfer_path, root)
    need(result["status"] == "authorized-profile-validated", "valid controlled transfer should pass")
    need(result["acceptance"]["acceptedMeasuredNumericCellsByPublicLabel"] == {"process_pressure": 2, "quality_criterion_1": 3}, "controlled-transfer measured counts drifted")
    need(result["acceptance"]["acceptedMeasuredNumericCells"] == 5, "setpoint or missing value was incorrectly counted")
    need(result["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "validator must not auto-promote family")
    need(result["acceptance"]["sourceFilenamesOrInternalFieldNamesEmitted"] is False, "validator privacy declaration drifted")
    rendered = json.dumps(result, ensure_ascii=False)
    for forbidden in ["101.123", "0.510", "secret_pressure_tag", "secret_quality_tag", "confidential-production.csv", "internal_cycle_id"]:
        need(forbidden not in rendered, f"confidential identifier/value leaked: {forbidden}")

    # Owner-side path: only an aggregate result leaves the owner's environment.
    owner_side = authorized_base()
    owner_side["mode"] = "owner-side-execution"
    owner_side["confidentiality"] = {
        "rawDataMayLeaveOwnerEnvironment": False,
        "publicArtifactsMayContainRawRowsOrValues": False,
        "storageLocationRestrictions": ["owner environment only"],
        "retentionOrDeletionRequirements": [],
        "additionalConditions": [],
    }
    commit = "a" * 40
    aggregate = {
        "schema": 1,
        "datasetId": "bottle-cap-7162-confidential",
        "profilerCommit": commit,
        "rawRowsOrCellValuesEmitted": False,
        "productionCycles": 7162,
        "sourceFingerprintsOrStableIdentifiers": ["owner-stable-source-id:campaign-7162"],
        "acceptedMeasuredNumericCellsByPublicLabel": {"process_pressure": 7162, "quality_criterion_1": 7162},
        "acceptedMeasuredNumericCells": 14324,
    }
    aggregate_path = root / "aggregate.json"
    aggregate_path.write_text(json.dumps(aggregate), encoding="utf-8")
    owner_side["ownerSideExecution"] = {
        "profilerCommit": commit,
        "aggregateArtifactRelativePath": aggregate_path.name,
    }
    owner_path = root / "owner-manifest.json"
    owner_path.write_text(json.dumps(owner_side), encoding="utf-8")
    owner_result = validator.run(owner_path, root)
    need(owner_result["status"] == "authorized-profile-validated", "valid owner-side aggregate should pass")
    need(owner_result["delivery"]["productionCycles"] == 7162, "owner-side cycle reconciliation drifted")
    need(owner_result["acceptance"]["acceptedMeasuredNumericCells"] == 14324, "owner-side total drifted")
    need("owner-stable-source-id:campaign-7162" not in json.dumps(owner_result), "owner stable source identifier must not be emitted")

    # Permission remains fail-closed.
    denied = copy.deepcopy(transfer)
    denied["authorization"]["aggregatePublicationAllowed"] = False
    denied_path = root / "denied.json"
    denied_path.write_text(json.dumps(denied), encoding="utf-8")
    try:
        validator.run(denied_path, root)
        raise AssertionError("missing aggregate publication permission must fail closed")
    except ValueError as exc:
        need("aggregatePublicationAllowed" in str(exc), "permission failure reason drifted")

    # A measured channel without a source-defined unit cannot be counted.
    no_unit = copy.deepcopy(transfer)
    no_unit["semantics"]["channels"][0]["unit"] = ""
    no_unit_path = root / "no-unit.json"
    no_unit_path.write_text(json.dumps(no_unit), encoding="utf-8")
    try:
        validator.run(no_unit_path, root)
        raise AssertionError("measured channel without unit must fail closed")
    except ValueError as exc:
        need("missing unit" in str(exc), "unit failure reason drifted")

    # Controlled transfer must not run unless the owner allows raw data to leave its environment.
    no_transfer = copy.deepcopy(transfer)
    no_transfer["confidentiality"]["rawDataMayLeaveOwnerEnvironment"] = False
    no_transfer_path = root / "no-transfer.json"
    no_transfer_path.write_text(json.dumps(no_transfer), encoding="utf-8")
    try:
        validator.run(no_transfer_path, root)
        raise AssertionError("controlled transfer without raw-transfer permission must fail closed")
    except ValueError as exc:
        need("raw data to leave owner environment" in str(exc), "controlled-transfer permission failure drifted")

print("Bottle-cap authorized-profile QA passed (controlled transfer and owner-side execution remain aggregate-only and fail closed)")
