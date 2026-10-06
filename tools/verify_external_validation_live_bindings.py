#!/usr/bin/env python3
"""Verify live GitHub objects still match the governed external-validation bindings."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.github.com"
REQUEST_ATTEMPTS = 5


def fail(message: str) -> None:
    raise SystemExit("External live-binding verification failed: " + message)


def request_json(token: str, endpoint: str) -> object:
    if not endpoint.startswith("repos/"):
        fail(f"refusing unsupported GitHub endpoint: {endpoint}")
    if not shutil.which("gh"):
        fail("GitHub CLI (gh) is required")
    env = os.environ.copy()
    env["GH_TOKEN"] = token
    env["GITHUB_TOKEN"] = token
    command = ["gh", "api", "--method", "GET", "-H", "Accept: application/vnd.github+json", endpoint]
    detail = ""
    for attempt in range(1, REQUEST_ATTEMPTS + 1):
        result = subprocess.run(command, capture_output=True, text=True, env=env)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as exc:
                detail = f"invalid/truncated JSON: {exc}"
        else:
            detail = (result.stderr or result.stdout).strip() or f"gh api exited {result.returncode}"
        if attempt < REQUEST_ATTEMPTS:
            time.sleep(min(attempt * 2, 6))
    fail(f"GitHub query failed after {REQUEST_ATTEMPTS} attempts: {detail}")


def parse_instant(value: object, label: str) -> dt.datetime:
    raw = str(value or "").strip()
    if not raw:
        fail(f"{label} is missing")
    try:
        parsed = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        fail(f"{label} is not an ISO-8601 instant: {raw}")
    if parsed.tzinfo is None:
        fail(f"{label} must include a timezone")
    return parsed.astimezone(dt.timezone.utc)


def verify(repository: str, token: str) -> None:
    ledger = json.loads((ROOT / "data" / "release-external-validation-v1.json").read_text(encoding="utf-8"))
    candidate = ledger.get("webCandidate") or {}
    release = str(candidate.get("release") or "")
    source_sha = str(candidate.get("sourceSha") or "")
    run_id = candidate.get("candidateRunId")
    artifact_id = candidate.get("artifactId")
    artifact_name = str(candidate.get("artifactName") or "")
    artifact_digest = str(candidate.get("artifactDigest") or "")
    candidate_workflow = str(candidate.get("candidateWorkflow") or "")
    contract_expiry = parse_instant(candidate.get("artifactExpiresAt"), "webCandidate.artifactExpiresAt")
    if contract_expiry <= dt.datetime.now(dt.timezone.utc):
        fail(f"canonical retained artifact expired at {contract_expiry.isoformat()}")

    if not isinstance(run_id, int) or run_id <= 0 or not isinstance(artifact_id, int) or artifact_id <= 0:
        fail("candidate run/artifact identifiers are invalid")

    run = request_json(token, f"repos/{repository}/actions/runs/{run_id}")
    if not isinstance(run, dict):
        fail(f"candidate workflow run {run_id} is not an object")
    if candidate_workflow != "Pre-merge Public Candidate":
        fail(f"canonical webCandidate names unsupported producer workflow: {candidate_workflow!r}")
    if run.get("name") != candidate_workflow:
        fail("live candidate workflow name does not match canonical webCandidate")
    if run.get("path") != ".github/workflows/premerge-public-candidate.yml":
        fail("live candidate workflow path is not the governed public-candidate workflow")
    if run.get("event") != "pull_request":
        fail("live candidate workflow event is not pull_request")
    if run.get("head_sha") != source_sha:
        fail("live candidate workflow head SHA does not match canonical webCandidate")
    if run.get("status") != "completed" or run.get("conclusion") != "success":
        fail("live candidate workflow did not complete successfully")

    payload = request_json(token, f"repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100")
    rows = payload.get("artifacts", []) if isinstance(payload, dict) else []
    matches = [row for row in rows if isinstance(row, dict) and row.get("id") == artifact_id]
    if len(matches) != 1:
        fail(f"artifact id {artifact_id} is not uniquely present in run {run_id}")
    artifact = matches[0]
    if artifact.get("expired") is not False:
        fail(f"artifact {artifact_id} is expired")
    if artifact.get("name") != artifact_name:
        fail("live artifact name does not match canonical webCandidate")
    if artifact.get("digest") != artifact_digest:
        fail("live artifact digest does not match canonical webCandidate")
    live_expiry = parse_instant(artifact.get("expires_at"), "live artifact expires_at")
    if live_expiry != contract_expiry:
        fail(f"live artifact expiry drifted: contract={contract_expiry.isoformat()} live={live_expiry.isoformat()}")
    workflow_run = artifact.get("workflow_run") or {}
    if workflow_run.get("id") != run_id or workflow_run.get("head_sha") != source_sha:
        fail("live artifact workflow/source provenance does not match canonical webCandidate")

    nzqa = json.loads((ROOT / "data" / "nzqa-external-validation-v1.json").read_text(encoding="utf-8"))
    issue_number = nzqa.get("issueNumber")
    if not isinstance(issue_number, int) or issue_number <= 0:
        fail("NZQA issueNumber is invalid")
    issue = request_json(token, f"repos/{repository}/issues/{issue_number}")
    if not isinstance(issue, dict) or issue.get("pull_request"):
        fail(f"NZQA tracker #{issue_number} is not a normal issue")
    if issue.get("state") != "open":
        fail(f"NZQA tracker #{issue_number} must remain open while provider validation is pending")
    title = str(issue.get("title") or "")
    body = str(issue.get("body") or "")
    for label, value in (
        ("release", release),
        ("source SHA", source_sha),
        ("runtime fingerprint", str(candidate.get("runtimeFingerprint") or "")),
    ):
        if value not in title and value not in body:
            fail(f"NZQA tracker #{issue_number} does not contain current {label}: {value}")

    print(
        f"External live bindings verified: governed {candidate_workflow} run {run_id} produced retained artifact {artifact_id} "
        f"with exact path/event/digest/source; "
        f"NZQA tracker #{issue_number} is open and bound to release {release} / {source_sha}."
    )


def self_test() -> None:
    value = parse_instant("2030-01-02T03:04:05Z", "fixture")
    assert value.tzinfo == dt.timezone.utc
    print("External live-binding verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.repository:
        raise SystemExit("--repository is required")
    token = os.environ.get("GITHUB_TOKEN", "").strip() or os.environ.get("GH_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_TOKEN or GH_TOKEN is required")
    verify(args.repository, token)


if __name__ == "__main__":
    main()
