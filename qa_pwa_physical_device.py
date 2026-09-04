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


def need(ok, message):
    if not ok:
        raise AssertionError(message)


spec = importlib.util.spec_from_file_location("mm_pwa_physical", TOOL)
need(spec and spec.loader, "physical PWA verifier could not be loaded")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

base = json.loads(CONTRACT.read_text(encoding="utf-8"))
module.validate_contract(base)
need(base["status"] == "pending-physical-device-validation", "repository contract must remain pending until real physical-device evidence is reviewed")
need(base["runtimeFingerprint"] is None, "pending physical-device evidence must not claim a runtime fingerprint")
need("physical iOS/iPadOS and Android devices" in base["boundary"], "physical-device boundary must remain explicit")
need("accessibility-real-at-validation-v1.json" in base["boundary"], "screen-reader evidence must remain separately governed")

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
        [sys.executable, str(TOOL), "--artifact", str(artifact), "--contract", str(contract_path)],
        capture_output=True,
        text=True,
    )
    need(passed.returncode == 0, f"matching validated physical evidence was rejected: {passed.stderr or passed.stdout}")

    mismatched = copy.deepcopy(validated)
    mismatched["runtimeFingerprint"] = "sha256:" + ("0" * 64)
    mismatch_path = Path(td) / "mismatch.json"
    mismatch_path.write_text(json.dumps(mismatched), encoding="utf-8")
    failed = subprocess.run(
        [sys.executable, str(TOOL), "--artifact", str(artifact), "--contract", str(mismatch_path)],
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

print("MouldMaster physical PWA device contract QA passed: pending evidence stays non-claiming; validated evidence is fresh, privacy-safe and exact-runtime fingerprint gated across iOS/iPadOS + Android.")
