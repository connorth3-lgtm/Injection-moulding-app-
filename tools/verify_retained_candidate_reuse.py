#!/usr/bin/env python3
"""Return success only when the canonical retained candidate can be safely reused.

Reuse is permitted only when the exact governed producer workflow completed
successfully and still owns the exact unexpired artifact recorded in the
external-validation ledger. Unchanged runtime bytes alone are not sufficient.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from pathlib import Path

from verify_external_validation_live_bindings import request_json

ROOT = Path(__file__).resolve().parents[1]
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def fail(message: str) -> None:
    raise SystemExit("Retained candidate is not reusable: " + message)


def parse_instant(value: object, label: str) -> dt.datetime:
    raw = str(value or "").strip()
    if not raw:
        fail(f"{label} is missing")
    try:
        parsed = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        fail(f"{label} is not ISO-8601: {raw}")
    if parsed.tzinfo is None:
        fail(f"{label} must include a timezone")
    return parsed.astimezone(dt.timezone.utc)


def verify(repository: str, token: str) -> None:
    ledger = json.loads((ROOT / "data" / "release-external-validation-v1.json").read_text(encoding="utf-8"))
    candidate = ledger.get("webCandidate") or {}
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    current_release = str(version.get("web_release") or "").strip()
    candidate_release = str(candidate.get("release") or "").strip()
    if not current_release:
        fail("current web release is missing")
    if candidate_release != current_release:
        fail(f"candidate release {candidate_release!r} does not match current web release {current_release!r}")
    source_sha = str(candidate.get("sourceSha") or "")
    run_id = candidate.get("candidateRunId")
    artifact_id = candidate.get("artifactId")
    workflow = str(candidate.get("candidateWorkflow") or "")
    artifact_name = str(candidate.get("artifactName") or "")
    artifact_digest = str(candidate.get("artifactDigest") or "")
    expiry = parse_instant(candidate.get("artifactExpiresAt"), "webCandidate.artifactExpiresAt")

    if SHA_RE.fullmatch(source_sha) is None:
        fail("source SHA is invalid")
    if workflow != "Pre-merge Public Candidate":
        fail(f"unsupported producer workflow: {workflow!r}")
    if not isinstance(run_id, int) or run_id <= 0:
        fail("candidate run id is invalid")
    if not isinstance(artifact_id, int) or artifact_id <= 0:
        fail("artifact id is invalid")
    if DIGEST_RE.fullmatch(artifact_digest) is None:
        fail("artifact digest is invalid")
    if artifact_name != f"physical-pwa-candidate-{source_sha}":
        fail("artifact name is not bound to source SHA")
    if expiry <= dt.datetime.now(dt.timezone.utc):
        fail(f"artifact expired at {expiry.isoformat()}")

    run = request_json(token, f"repos/{repository}/actions/runs/{run_id}")
    if not isinstance(run, dict):
        fail("producer run payload is invalid")
    checks = {
        "name": run.get("name") == workflow,
        "path": run.get("path") == ".github/workflows/premerge-public-candidate.yml",
        "event": run.get("event") == "pull_request",
        "head SHA": run.get("head_sha") == source_sha,
        "status": run.get("status") == "completed",
        "conclusion": run.get("conclusion") == "success",
    }
    bad = [name for name, ok in checks.items() if not ok]
    if bad:
        fail("producer run mismatch: " + ", ".join(bad))

    payload = request_json(token, f"repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100")
    rows = payload.get("artifacts", []) if isinstance(payload, dict) else []
    matches = [row for row in rows if isinstance(row, dict) and row.get("id") == artifact_id]
    if len(matches) != 1:
        fail(f"artifact {artifact_id} is not uniquely owned by producer run {run_id}")
    artifact = matches[0]
    if artifact.get("expired") is not False:
        fail("artifact is expired")
    if artifact.get("name") != artifact_name:
        fail("artifact name drifted")
    if artifact.get("digest") != artifact_digest:
        fail("artifact digest drifted")
    live_expiry = parse_instant(artifact.get("expires_at"), "live artifact expires_at")
    if live_expiry != expiry:
        fail("artifact expiry drifted")
    owner = artifact.get("workflow_run") or {}
    if owner.get("id") != run_id or owner.get("head_sha") != source_sha:
        fail("artifact workflow/source provenance drifted")

    print(f"Retained candidate reusable: successful run {run_id} owns live artifact {artifact_id} for {source_sha}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    args = parser.parse_args()
    token = os.environ.get("GITHUB_TOKEN", "").strip() or os.environ.get("GH_TOKEN", "").strip()
    if not token:
        fail("GITHUB_TOKEN or GH_TOKEN is required")
    verify(args.repository, token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
