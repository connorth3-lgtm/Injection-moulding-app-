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
ATTESTATION = ROOT / "data" / "pwa-physical-device-attestation-v1.json"
WORKFLOW = ROOT / ".github" / "workflows" / "pwa-physical-device-contract.yml"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


spec = importlib.util.spec_from_file_location("mm_pwa_physical", TOOL)
need(spec and spec.loader, "physical PWA verifier could not be loaded")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

base = json.loads(CONTRACT.read_text(encoding="utf-8"))
version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
module.validate_contract(base)
need(base["status"] == "pending-physical-device-validation", "current repository contract must remain pending until genuine physical-device validation exists")
need(base["release"] == version["web_release"], "physical-device contract must be bound to the current web release")
need(base["runtimeFingerprint"] is None, "pending physical-device contract must not claim a validated runtime fingerprint")
need(base["testedAt"] is None and base["testerReference"] is None and base["evidenceReference"] is None, "pending physical-device contract must not carry pseudo-validation metadata")
# A new release must run browser/contract preflight before its exact-head
# candidate producer. Permit that evidence-free staging state ONLY while
# technicalAutomation explicitly fails; release-integrity gates still reject it.
candidate=base.get("candidate") or {}
if candidate:
    need(candidate.get("release") == version["web_release"],
         "pending contract must retain the exact current candidate release binding")
else:
    ledger=json.loads((ROOT/"data"/"release-external-validation-v1.json").read_text(encoding="utf-8"))
    need(ledger.get("release")==version["web_release"], "candidate-staging release must match version")
    need((ledger.get("technicalAutomation") or {}).get("status")=="fail",
         "missing candidate is permissible only while technical automation fails")
    need((ledger.get("pwaPhysicalDevices") or {}).get("status")=="hold" and
         (ledger.get("pwaPhysicalDevices") or {}).get("currentCandidate") is None,
         "missing candidate cannot assert a current PWA artifact or approval")
    need((base.get("previousCandidate") or {}).get("release") != version["web_release"],
         "missing candidate must retain its actual previous release")
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

# The standalone workflow is a contract-health gate, not a second production
# publisher. It must fail malformed/stale evidence, but a valid authorization for
# older runtime bytes is a governed HOLD/candidate state because Pages already
# keeps those new bytes off the production root. Never relabel old evidence.
workflow = WORKFLOW.read_text(encoding="utf-8")
for marker in (
    "python tools/verify_pwa_physical_evidence.py --contract-only",
    'if [[ "$status" == "validated" || "$status" == "released-with-accepted-ios-risk" ]]; then',
    "if python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-release-authorized; then",
    "Physical PWA exact-runtime HOLD",
    "Existing governed evidence applies to different public runtime bytes",
    "This check intentionally does not rewrite old evidence or authorize current production bytes.",
):
    need(marker in workflow, f"physical PWA workflow HOLD semantics missing marker: {marker}")
need(
    "run: python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-release-authorized" not in workflow,
    "standalone physical PWA workflow must not unconditionally fail main when valid evidence belongs to older bytes",
)

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
    for platform, record in validated["platforms"].items():
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
    need(failed.returncode != 0, "validated evidence for different runtime bytes must fail closed when production authorization is requested")
    need("different public runtime bytes" in (failed.stderr + failed.stdout), "runtime mismatch failure must be explicit")

sensitive = copy.deepcopy(base)
sensitive["email"] = "forbidden@example.invalid"
try:
    module.validate_contract(sensitive)
except SystemExit as exc:
    need("forbidden sensitive-content fields" in str(exc), "sensitive-field rejection must be explicit")
else:
    raise AssertionError("public physical-device contract accepted a forbidden personal-data field")

print("MouldMaster physical PWA device contract QA passed: the current release remains truthfully pending/HOLD, generic contract verification passes, and production authorization fails closed until genuine device evidence exists.")
