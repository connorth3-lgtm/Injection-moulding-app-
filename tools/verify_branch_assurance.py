#!/usr/bin/env python3
"""Fail closed until the exact pushed branch SHA has complete release assurance."""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request

DEFAULT_REPO = os.environ.get("GITHUB_REPOSITORY", "connorth3-lgtm/Injection-moulding-app-")
DEFAULT_SHA = os.environ.get("BRANCH_ASSURANCE_SHA", "").strip() or os.environ.get("GITHUB_SHA", "")
DEFAULT_BRANCH = os.environ.get("BRANCH_ASSURANCE_BRANCH", "").strip() or os.environ.get("GITHUB_REF_NAME", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
ATTEMPTS = max(1, int(os.environ.get("BRANCH_ASSURANCE_ATTEMPTS", "90")))
SLEEP_SECONDS = max(1, int(os.environ.get("BRANCH_ASSURANCE_SLEEP_SECONDS", "20")))

REQUIRED = {
    "main": (
        "MouldMaster Release QA",
        "Mobile Browser QA",
        "Question Quality 50-Pass",
        "Deep Audit Governance",
        "Release External Validation Boundary",
        "MouldMaster Pages Release Readiness",
        "Main PR Provenance Guard",
    ),
    "preview": (
        "MouldMaster Release QA",
        "Mobile Browser QA",
        "Question Quality 50-Pass",
        "MouldMaster Preview Pages",
    ),
}


def latest_states(payload: object, required: tuple[str, ...]) -> dict[str, tuple[str, str]]:
    rows = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    states: dict[str, tuple[str, str]] = {}
    for name in required:
        matches = [row for row in rows if row.get("name") == name]
        matches.sort(
            key=lambda row: (str(row.get("updated_at") or row.get("created_at") or ""), int(row.get("id") or 0)),
            reverse=True,
        )
        latest = matches[0] if matches else {}
        states[name] = (str(latest.get("status") or "missing"), str(latest.get("conclusion") or "missing"))
    return states


def api_runs(repository: str, sha: str, token: str) -> object:
    query = urllib.parse.urlencode({"head_sha": sha, "event": "push", "per_page": 100})
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repository}/actions/runs?{query}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "mouldmaster-branch-assurance",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)


def verify(repository: str, branch: str, sha: str, token: str) -> None:
    if branch not in REQUIRED:
        raise SystemExit(f"Unsupported governed branch: {branch}")
    if len(sha) != 40:
        raise SystemExit("Branch assurance requires a full 40-character exact source SHA")
    if not token:
        raise SystemExit("GITHUB_TOKEN is required for branch assurance")

    required = REQUIRED[branch]
    print(f"Branch assurance: branch={branch} sha={sha}")
    print("Required exact-push workflows:", ", ".join(required))

    last: dict[str, tuple[str, str]] = {}
    for attempt in range(1, ATTEMPTS + 1):
        last = latest_states(api_runs(repository, sha, token), required)
        failed = [
            f"{name}={status}/{conclusion}"
            for name, (status, conclusion) in last.items()
            if status == "completed" and conclusion not in {"success", "missing"}
        ]
        if failed:
            raise SystemExit("Exact-push branch assurance failed: " + ", ".join(failed))

        unresolved = [
            f"{name}={status}/{conclusion}"
            for name, (status, conclusion) in last.items()
            if (status, conclusion) != ("completed", "success")
        ]
        if not unresolved:
            print(f"Branch assurance passed: {len(required)} exact-push workflows succeeded on {branch}@{sha}.")
            return
        if attempt == ATTEMPTS:
            raise SystemExit("Exact-push branch assurance incomplete: " + ", ".join(unresolved))
        print(f"Waiting for exact-push assurance ({attempt}/{ATTEMPTS}): " + ", ".join(unresolved))
        time.sleep(SLEEP_SECONDS)


def self_test() -> None:
    payload = {
        "workflow_runs": [
            {"id": i + 1, "name": name, "status": "completed", "conclusion": "success", "updated_at": f"2026-10-05T00:00:{i:02d}Z"}
            for i, name in enumerate(REQUIRED["preview"])
        ]
    }
    states = latest_states(payload, REQUIRED["preview"])
    assert all(value == ("completed", "success") for value in states.values())
    payload["workflow_runs"].append(
        {"id": 99, "name": "MouldMaster Release QA", "status": "completed", "conclusion": "failure", "updated_at": "2026-10-05T01:00:00Z"}
    )
    assert latest_states(payload, REQUIRED["preview"])["MouldMaster Release QA"] == ("completed", "failure")
    print("Branch-assurance verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", default=DEFAULT_REPO)
    parser.add_argument("--branch", default=DEFAULT_BRANCH)
    parser.add_argument("--sha", default=DEFAULT_SHA)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    verify(args.repository, args.branch, args.sha, TOKEN)


if __name__ == "__main__":
    main()
