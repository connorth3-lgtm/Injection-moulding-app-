#!/usr/bin/env python3
"""Verify live GitHub objects still match the governed external-validation bindings."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
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


def verify_current_tracker(issue: object, issue_number: int, candidate: dict) -> None:
    """Bind a tracker to either its active preview candidate or its exact main baseline.

    A non-publishing preview can be newer than protected main. In that case,
    main checks must match a separately labelled main-release record in the
    active tracker block; arbitrary historical mentions never satisfy the
    current main binding.
    """
    if not isinstance(issue, dict) or issue.get("pull_request"):
        fail(f"NZQA tracker #{issue_number} is not a normal issue")
    if issue.get("state") != "open":
        fail(f"NZQA tracker #{issue_number} must remain open while provider validation is pending")
    title = str(issue.get("title") or "")
    body = str(issue.get("body") or "")
    release = candidate.get("release")
    if not isinstance(release, str) or not release:
        fail("candidate release identity is missing")

    current = body.split("\n---\n", 1)[0]
    active_lines = re.findall(r"(?m)^\*\*Current governed technical candidate:\*\*\s*(.+)$", current)
    main_lines = re.findall(r"(?m)^\*\*Current protected-main release:\*\*\s*(.+)$", current)
    if len(active_lines) != 1:
        fail(f"NZQA tracker #{issue_number} needs one explicitly marked current technical candidate")
    if len(main_lines) > 1:
        fail(f"NZQA tracker #{issue_number} has multiple separately marked protected-main releases")
    active_line = active_lines[0]
    main_line = main_lines[0] if main_lines else None
    release_pattern = r"\bRelease\s+\x60?([0-9]{4}\.[0-9]{2}\.[0-9]{2}\.[0-9]+)\x60?"
    active_releases = re.findall(release_pattern, active_line, flags=re.IGNORECASE)
    main_releases = re.findall(release_pattern, main_line, flags=re.IGNORECASE) if main_line else []
    if len(active_releases) != 1 or (main_line is not None and len(main_releases) != 1):
        fail(f"NZQA tracker #{issue_number} release channel bindings are ambiguous")

    selected_main = False
    if active_releases[0] == release:
        if not re.search(r"(?<![0-9.])" + re.escape(release) + r"(?![0-9.])", title):
            fail(f"NZQA tracker #{issue_number} title does not name current release {release}")
        line = active_line
    elif main_releases == [release]:
        selected_main = True
        active_release = active_releases[0]
        if not re.search(r"(?<![0-9.])" + re.escape(active_release) + r"(?![0-9.])", title):
            fail(f"NZQA tracker #{issue_number} title does not name active preview release {active_release}")
        if not re.search(r"non-publishing\s+\x60?preview\x60?\s+candidate", current, flags=re.IGNORECASE):
            fail(f"NZQA tracker #{issue_number} does not identify the newer preview as non-publishing")
        line = main_line
    else:
        fail(f"NZQA tracker #{issue_number} has no active or protected-main binding for release {release}")

    expected = {
        "release": (release_pattern, release),
        "source SHA": (r"\bsource\s+\x60?([0-9a-f]{40})\x60?(?![0-9a-f])", candidate["sourceSha"]),
        "runtime fingerprint": (
            r"\bfingerprint\s+\x60?(sha256:[0-9a-f]{64})\x60?(?![0-9a-f])",
            candidate["runtimeFingerprint"],
        ),
        "producer run": (r"/actions/runs/([1-9][0-9]*)\)", str(candidate["candidateRunId"])),
        "artifact id": (r"\bartifact\s+\x60?([1-9][0-9]*)\x60?(?![0-9])", str(candidate["artifactId"])),
    }
    if "artifactDigest" in candidate:
        expected["artifact digest"] = (
            r"\bdigest\s+\x60?(sha256:[0-9a-f]{64})\x60?(?![0-9a-f])",
            candidate["artifactDigest"],
        )
    if "artifactExpiresAt" in candidate:
        expected["artifact expiry"] = (
            r"\bexpiry\s+\x60?([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)\x60?",
            candidate["artifactExpiresAt"],
        )
    for label, (pattern, wanted) in expected.items():
        seen = re.findall(pattern, line, flags=re.IGNORECASE)
        if seen != [str(wanted)]:
            channel = "protected-main" if selected_main else "current"
            fail(f"NZQA tracker #{issue_number} {channel} {label} mismatches retained candidate")
    if not re.search(r"\bG1\s*[–-]\s*G8\b", current) or "pending-external" not in current:
        fail(f"NZQA tracker #{issue_number} does not explicitly retain G1–G8 external HOLD")
    if selected_main and "all seven external review streams remain HOLD" not in current:
        fail(f"NZQA tracker #{issue_number} does not retain all seven external HOLDs")


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
    verify_current_tracker(issue, issue_number, candidate)

    print(
        f"External live bindings verified: governed {candidate_workflow} run {run_id} produced retained artifact {artifact_id} "
        f"with exact path/event/digest/source; "
        f"NZQA tracker #{issue_number} is open and bound to release {release} / {source_sha}."
    )


def self_test() -> None:
    value = parse_instant("2030-01-02T03:04:05Z", "fixture")
    assert value.tzinfo == dt.timezone.utc
    mark = chr(96)

    preview = {
        "release": "2026.10.19.1",
        "sourceSha": "4e8169602ca73fc78cfd2f2421a263632cfe84ea",
        "runtimeFingerprint": "sha256:1f498160634145407bd394bfe8c32ed70a1ce5f862834e8159d2f1e9fdd6cee9",
        "candidateRunId": 39148051891,
        "artifactId": 12143923886,
        "artifactDigest": "sha256:04a8e7f21d5256986d996911e20bb9051eb0ecd5373ab94537255644bbe7a224",
        "artifactExpiresAt": "2027-01-16T17:06:33Z",
    }
    main = {
        "release": "2026.10.16.1",
        "sourceSha": "e336f656351afa4eeaaae0940969bea881ae9b68",
        "runtimeFingerprint": "sha256:3677de439e76c94b69ebeef13dd92904cd6b30818b88a5434fcbe3755529ec27",
        "candidateRunId": 38864931906,
        "artifactId": 12030806569,
        "artifactDigest": "sha256:957f7a0b2e16aab3fd4b59fe86706b637a440593081152748fc18c8332cd32e7",
        "artifactExpiresAt": "2027-01-14T07:04:41Z",
    }

    def candidate_line(label: str, item: dict) -> str:
        return (
            f"**{label}:** Release {mark}{item['release']}{mark}, source {mark}{item['sourceSha']}{mark}, "
            f"fingerprint {mark}{item['runtimeFingerprint']}{mark}, "
            f"[producer run {item['candidateRunId']}](https://github.com/example/repo/actions/runs/{item['candidateRunId']}), "
            f"artifact {mark}{item['artifactId']}{mark}, digest {mark}{item['artifactDigest']}{mark}, "
            f"expiry {mark}{item['artifactExpiresAt']}{mark}."
        )

    active_line = candidate_line("Current governed technical candidate", preview)
    main_line = candidate_line("Current protected-main release", main)
    current = "\n".join(
        [
            "Disposition: HOLD — release 2026.10.19.1; G1–G8 pending-external. "
            "PR #648 is a non-publishing preview candidate.",
            active_line,
            main_line + " all seven external review streams remain HOLD.",
        ]
    )
    issue = {
        "state": "open",
        "title": "NZQA/provider HOLD — 2026.10.19.1 retained preview candidate",
        "body": current + "\n---\nHistorical release notes follow.",
    }

    verify_current_tracker(issue, 619, preview)
    verify_current_tracker(issue, 619, main)

    def expect_failure(value: dict, item: dict) -> None:
        try:
            verify_current_tracker(value, 619, item)
        except SystemExit:
            return
        raise AssertionError("invalid channel binding unexpectedly passed")

    without_main = dict(
        issue,
        body=current.replace(main_line + " all seven external review streams remain HOLD.", "") + "\n---\n",
    )
    expect_failure(without_main, main)
    bad_main = dict(issue, body=current.replace(main["sourceSha"], "0" * 40, 1) + "\n---\n")
    expect_failure(bad_main, main)
    historical_only = dict(
        issue,
        body=active_line + "\nDisposition: HOLD — G1–G8 pending-external.\n---\n" + main_line,
    )
    expect_failure(historical_only, main)
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

