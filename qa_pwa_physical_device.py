#!/usr/bin/env python3
from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOL = ROOT / "tools" / "verify_pwa_physical_evidence.py"
CONTRACT = ROOT / "data" / "pwa-physical-device-validation-v1.json"
VERSION = ROOT / "version.json"
WORKFLOW = ROOT / ".github" / "workflows" / "pwa-physical-device-contract.yml"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


spec = importlib.util.spec_from_file_location("mm_pwa_physical", TOOL)
need(spec and spec.loader, "physical PWA verifier could not be loaded")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

base = json.loads(CONTRACT.read_text(encoding="utf-8"))
version = json.loads(VERSION.read_text(encoding="utf-8"))
module.validate_contract(base)
need(base["status"] == "pending-physical-device-validation", "current repository contract must remain pending until genuine physical-device validation exists")
need(base["release"] == version["web_release"], "physical-device contract must be bound to the current web release")
need(base["runtimeFingerprint"] is None, "pending physical-device contract must not claim a validated runtime fingerprint")
need(base["testedAt"] is None and base["testerReference"] is None and base["evidenceReference"] is None, "pending physical-device contract must not carry pseudo-validation metadata")
need(base.get("candidate", {}).get("release") == version["web_release"], "pending contract must retain the exact current candidate release binding")
candidate_fp = str(base.get("candidate", {}).get("runtimeFingerprint") or "")
need(candidate_fp.startswith("sha256:") and len(candidate_fp) == 71, "candidate runtime fingerprint format is invalid")
need("physical iOS/iPadOS and Android devices" in base["boundary"], "physical-device boundary must remain explicit")
need("accessibility-real-at-validation-v1.json" in base["boundary"], "screen-reader evidence must remain separately governed")

contract_only = subprocess.run(
    [sys.executable, str(TOOL), "--contract", str(CONTRACT), "--contract-only"],
    capture_output=True,
    text=True,
)
need(contract_only.returncode == 0, f"current pending contract must pass structural verification: {contract_only.stderr or contract_only.stdout}")

unauthorized = subprocess.run(
    [sys.executable, str(TOOL), "--contract", str(CONTRACT), "--contract-only", "--require-release-authorized"],
    capture_output=True,
    text=True,
)
need(unauthorized.returncode != 0, "pending physical-device evidence must fail closed when release authorization is requested")
need("validated physical evidence" in (unauthorized.stderr + unauthorized.stdout), "pending authorization failure must explain that genuine validation or an explicit governed waiver is required")

workflow = WORKFLOW.read_text(encoding="utf-8")
for marker in (
    "python tools/verify_pwa_physical_evidence.py --contract-only",
    "Physical PWA evidence pending",
    "Physical PWA exact-runtime HOLD",
):
    need(marker in workflow, f"physical PWA workflow HOLD semantics missing marker: {marker}")

with tempfile.TemporaryDirectory() as td:
    artifact = Path(td) / "pages"
    artifact.mkdir()
    for index in range(24):
        (artifact / f"asset-{index:02d}.txt").write_text(f"public-runtime-{index}\n", encoding="utf-8")

    fingerprint = module.runtime_fingerprint(artifact)
    need(fingerprint.startswith("sha256:") and len(fingerprint) == 71, "runtime fingerprint format is invalid")
    before_metadata = fingerprint
    (artifact / "deployment.json").write_text('{"source_sha":"evidence-only-change"}\n', encoding="utf-8")
    (artifact / "pages-manifest.json").write_text('{"source_sha":"evidence-only-change"}\n', encoding="utf-8")
    need(module.runtime_fingerprint(artifact) == before_metadata, "deployment-only metadata must not invalidate physical runtime evidence")

    validated = copy.deepcopy(base)
    validated.update({
        "status": "validated",
        "runtimeFingerprint": fingerprint,
        "testedAt": datetime.now(timezone.utc).isoformat(),
        "testerReference": "release-validation-role",
        "evidenceReference": "governed-device-review-reference",
    })
    for record in validated["platforms"].values():
        record["status"] = "validated"
        record["deviceModel"] = "QA structural fixture"
        record["osVersion"] = "fixture-os"
        record["browserVersion"] = "fixture-browser"
        record["installedMode"] = "standalone"
        record["checks"] = {name: "pass" for name in record["checks"]}
    module.validate_contract(validated)

    contract_path = Path(td) / "validated.json"
    contract_path.write_text(json.dumps(validated), encoding="utf-8")
    passed = subprocess.run(
        [sys.executable, str(TOOL), "--artifact", str(artifact), "--contract", str(contract_path), "--require-validated"],
        capture_output=True,
        text=True,
    )
    need(passed.returncode == 0, f"matching validated physical evidence was rejected: {passed.stderr or passed.stdout}")

    mismatched = copy.deepcopy(validated)
    mismatched["runtimeFingerprint"] = "sha256:" + ("0" * 64)
    mismatch_path = Path(td) / "mismatch.json"
    mismatch_path.write_text(json.dumps(mismatched), encoding="utf-8")
    failed = subprocess.run(
        [sys.executable, str(TOOL), "--artifact", str(artifact), "--contract", str(mismatch_path), "--require-validated"],
        capture_output=True,
        text=True,
    )
    need(failed.returncode != 0, "validated evidence for different runtime bytes must fail closed")
    need("different public runtime bytes" in (failed.stderr + failed.stdout), "runtime mismatch failure must be explicit")

sensitive = copy.deepcopy(base)
sensitive["email"] = "forbidden@example.invalid"
try:
    module.validate_contract(sensitive)
except SystemExit as exc:
    need("forbidden sensitive-content fields" in str(exc), "sensitive-field rejection must be explicit")
else:
    raise AssertionError("public physical-device contract accepted a forbidden personal-data field")

print(
    "MouldMaster physical PWA device contract QA passed: the current release remains truthfully pending/HOLD, "
    "the generic verifier accepts the governed pending structure, production authorization fails closed without genuine evidence, "
    "and exact-runtime validated fixtures still enforce fingerprint integrity."
)
