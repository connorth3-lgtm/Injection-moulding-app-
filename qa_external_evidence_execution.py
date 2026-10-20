#!/usr/bin/env python3
"""Regression QA for issue #50/#73/#74/#75 external-evidence execution contracts."""
from __future__ import annotations
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_module(name: str, relative: str):
    path = ROOT / relative
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, f"cannot load {relative}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def expect_failure(fn, message: str) -> None:
    try:
        fn()
    except (AssertionError, RuntimeError, ValueError, SystemExit):
        return
    raise AssertionError(message)


cross_validator = load_module("cross_upper_clarification", "tools/validate_cross_process_upper_clarification.py")
impure_validator = load_module("impure_clarification", "tools/validate_impure_pascoe_clarification.py")
pilot_validator = load_module("public_pilot_candidate", "tools/evaluate_public_pilot_candidate.py")
warwick_validator = load_module("warwick_export", "tools/validate_warwick_origin_export.py")

# #73: pending is structurally valid but cannot promote; complete source-defined fixture can.
cross_pending = json.loads((ROOT / "data/cross-process-upper-author-response-template-v1.json").read_text(encoding="utf-8"))
report = cross_validator.validate(cross_pending)
need(report["promotionReady"] is False, "pending #73 contract must remain non-promoting")
expect_failure(lambda: cross_validator.validate(cross_pending, True), "pending #73 contract passed require-resolved")
cross_resolved = copy.deepcopy(cross_pending)
cross_resolved["status"] = "resolved-source-defined"
cross_resolved["authority"] = {
    "sourceType": "source-author",
    "sourceReference": "https://example.invalid/source-definition",
    "sourceIdentity": "source-author-public-clarification",
}
cross_resolved["pressure"]["injection_pressure_target"].update({"engineeringUnit": "bar", "sourceEvidence": "source-definition:pressure-target"})
cross_resolved["pressure"]["injection_pressure_actual"].update({"engineeringUnit": "bar", "rawMachineTag": "source-defined-tag", "sourceEvidence": "source-definition:pressure-actual"})
cross_resolved["state"]["encoding"] = "categorical"
cross_resolved["state"]["sourceEvidence"] = "source-definition:state"
cross_resolved["state"]["mapping"] = {"0": "state-zero", "1": "state-one", "2": "state-two", "4": "state-four", "8": "state-eight"}
need(cross_validator.validate(cross_resolved, True)["promotionReady"] is True, "complete #73 source fixture did not become promotion-ready")
cross_bad = copy.deepcopy(cross_resolved)
cross_bad["pressure"]["injection_pressure_actual"]["engineeringUnit"] = None
expect_failure(lambda: cross_validator.validate(cross_bad, True), "#73 accepted a missing pressure-actual unit")

# #74: current template is fail-closed; source fixture must preserve stage-dependent Analog Input[2].
impure_pending = json.loads((ROOT / "data/impure-pascoe-author-response-template-v1.json").read_text(encoding="utf-8"))
need(impure_validator.validate(impure_pending)["promotionReady"] is False, "pending #74 contract must remain non-promoting")
expect_failure(lambda: impure_validator.validate(impure_pending, True), "pending #74 contract passed require-resolved")
impure_resolved = copy.deepcopy(impure_pending)
impure_resolved["status"] = "resolved-source-defined"
impure_resolved["authority"] = {
    "sourceType": "source-author",
    "sourceReference": "https://example.invalid/pascoe-definition",
    "sourceIdentity": "source-author-public-clarification",
}
impure_resolved["channels"]["HydPressure[IRT/Pascoe]"].update({
    "engineeringUnit": "bar", "scaling": "delivered engineering values; no additional scaling", "sourceEvidence": "source-definition:hydraulic-pressure"
})
impure_resolved["channels"]["ScrewPosition[IRT/Pascoe]"].update({
    "engineeringUnit": "mm", "referenceOrigin": "source-defined machine screw-position reference", "scaling": "delivered engineering values; no additional scaling", "sourceEvidence": "source-definition:screw-position"
})
impure_resolved["channels"]["Analog Input[1]"] = {
    "mappingType": "stable",
    "segments": [{"scope": "all delivered cycle files", "physicalSignal": "source-defined auxiliary signal", "engineeringUnit": "degC", "scaling": "source-defined", "sourceEvidence": "source-definition:analog-1", "cycleFileCount": 307}],
}
impure_resolved["channels"]["Analog Input[2]"] = {
    "mappingType": "stage-dependent",
    "segments": [
        {"scope": "source-defined stage A", "physicalSignal": "core-water temperature", "engineeringUnit": "degC", "scaling": "source-defined", "sourceEvidence": "source-definition:analog-2-A", "cycleFileCount": 150},
        {"scope": "source-defined stage B", "physicalSignal": "nozzle temperature", "engineeringUnit": "degC", "scaling": "source-defined", "sourceEvidence": "source-definition:analog-2-B", "cycleFileCount": 157}
    ],
}
impure_resolved["coverage"] = {"cycleFilesMapped": 307, "cycleFilesExplicitlyExcluded": 0}
need(impure_validator.validate(impure_resolved, True)["promotionReady"] is True, "complete #74 source fixture did not become promotion-ready")
impure_bad = copy.deepcopy(impure_resolved)
impure_bad["channels"]["Analog Input[2]"]["segments"] = [impure_bad["channels"]["Analog Input[2]"]["segments"][0]]
expect_failure(lambda: impure_validator.validate(impure_bad, True), "#74 accepted a single global/stage-incomplete Analog Input[2] definition")

# #50: public PASCOE benchmark remains valuable but cannot masquerade as an authorised site pilot.
pilot_record = json.loads((ROOT / "data/real-pilot-public-candidate-review-2026-09-05.json").read_text(encoding="utf-8"))
pilot_report = pilot_validator.evaluate(pilot_record)
need(pilot_report["eligibleToCloseIssue50"] is False, "public benchmark incorrectly closes issue #50")
need(pilot_report["missingGateCount"] >= 5, "#50 public-candidate review is no longer conservatively gated")
pilot_hypothetical = copy.deepcopy(pilot_record)
for key in pilot_validator.REQUIRED_FOR_ISSUE_50:
    pilot_hypothetical["evidence"][key] = True
pilot_hypothetical["status"] = "eligible-authorised-site-pilot-evidence"
pilot_hypothetical["decision"]["mayCloseIssue50"] = True
pilot_hypothetical["decision"]["mayClaimValidatedOnRealProductionData"] = True
need(pilot_validator.evaluate(pilot_hypothetical)["eligibleToCloseIssue50"] is True, "#50 evaluator cannot recognize complete evidence")

# #75: pending manifest remains valid/non-counting and the real exporter is Windows/Origin-only.
warwick_pending = json.loads((ROOT / "data/warwick-origin-export-manifest-template-v1.json").read_text(encoding="utf-8"))
warwick_report = warwick_validator.validate_manifest(warwick_pending)
need(warwick_report["status"] == "pending-origin-export" and warwick_report["acceptedMeasuredValues"] == 0, "pending Warwick contract must remain non-counting")
origin_exporter = (ROOT / "tools/export_warwick_origin.py").read_text(encoding="utf-8")
compile(origin_exporter, "tools/export_warwick_origin.py", "exec")
for marker in (
    'sys.platform == "win32"',
    "import originpro as op",
    "readonly=True",
    '"status": "exported-awaiting-semantic-review"',
    '"acceptedMeasuredValues": 0',
    "unexpected OPJU files present",
    "semantic review still required",
):
    need(marker in origin_exporter, f"Warwick real-Origin automation marker missing: {marker}")

print("External evidence execution QA passed: #50/#73/#74/#75 remain fail-closed while executable completion paths are available.")
