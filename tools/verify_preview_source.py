#!/usr/bin/env python3
"""Fail closed unless a preview deployment source is the current merged-PR preview head."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import time
from urllib.parse import urlencode

API = "https://api.github.com"
REQUEST_ATTEMPTS = 5
PROVENANCE_ATTEMPTS = 12
REQUIRED_WORKFLOWS = (
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Question Quality 50-Pass",
    "Pre-merge Public Candidate",
)


def api_endpoint(url: str) -> str:
    if not url.startswith(API + "/repos/"):
        raise SystemExit(f"Refusing unsupported GitHub API URL: {url}")
    return url[len(API) + 1 :]


def request_json(token: str, url: str) -> object:
    if not shutil.which("gh"):
        raise SystemExit("GitHub CLI (gh) is required for preview-source verification")
    env = os.environ.copy()
    env["GH_TOKEN"] = token
    env["GITHUB_TOKEN"] = token
    command = ["gh", "api", "--method", "GET", "-H", "Accept: application/vnd.github+json", api_endpoint(url)]
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
    raise SystemExit(f"GitHub preview-source query failed after {REQUEST_ATTEMPTS} attempts: {detail}")


def matching_preview_prs(payload: object, source_sha: str) -> list[dict]:
    rows = payload if isinstance(payload, list) else []
    return [
        row
        for row in rows
        if isinstance(row, dict)
        and row.get("merged_at")
        and (row.get("base") or {}).get("ref") == "preview"
        and row.get("merge_commit_sha") == source_sha
    ]


def unique_matches(payloads: tuple[object, ...], source_sha: str) -> list[dict]:
    by_number: dict[int, dict] = {}
    for payload in payloads:
        for row in matching_preview_prs(payload, source_sha):
            try:
                number = int(row.get("number"))
            except (TypeError, ValueError):
                raise SystemExit("GitHub returned a preview PR without a usable number")
            by_number[number] = row
    return list(by_number.values())


def run_matches_pr(row: dict, pr_number: int) -> bool:
    prs = row.get("pull_requests") or []
    return any(
        isinstance(pr, dict)
        and int(pr.get("number") or 0) == pr_number
        and ((pr.get("base") or {}).get("ref") == "preview")
        for pr in prs
    )


def latest_required_states(payload: object, pr_number: int | None = None) -> dict[str, tuple[str, str]]:
    runs = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    result: dict[str, tuple[str, str]] = {}
    for name in REQUIRED_WORKFLOWS:
        matches = [
            row for row in runs
            if row.get("name") == name and (pr_number is None or run_matches_pr(row, pr_number))
        ]
        matches.sort(key=lambda row: (str(row.get("created_at") or ""), int(row.get("id") or 0)), reverse=True)
        latest = matches[0] if matches else {}
        result[name] = (str(latest.get("status") or "missing"), str(latest.get("conclusion") or "missing"))
    return result


def verify(token: str, repository: str, source_sha: str) -> None:
    if re.fullmatch(r"[0-9a-f]{40}", source_sha) is None:
        raise SystemExit("Preview source SHA must be a full lowercase 40-character commit SHA")

    branch = request_json(token, f"{API}/repos/{repository}/branches/preview")
    current = str(((branch or {}).get("commit") or {}).get("sha") or "") if isinstance(branch, dict) else ""
    if current != source_sha:
        raise SystemExit(f"Preview deployment source is stale or off-branch: current preview={current}, requested={source_sha}")

    recent_query = urlencode({"state": "closed", "base": "preview", "sort": "updated", "direction": "desc", "per_page": 100})
    matches: list[dict] = []
    for attempt in range(1, PROVENANCE_ATTEMPTS + 1):
        associated = request_json(token, f"{API}/repos/{repository}/commits/{source_sha}/pulls")
        recent = request_json(token, f"{API}/repos/{repository}/pulls?{recent_query}")
        matches = unique_matches((associated, recent), source_sha)
        if len(matches) == 1:
            break
        if len(matches) > 1:
            raise SystemExit(f"Preview source {source_sha} is ambiguously attributable to {len(matches)} merged preview PRs")
        if attempt < PROVENANCE_ATTEMPTS:
            time.sleep(2)
    if len(matches) != 1:
        raise SystemExit(
            f"Preview source {source_sha} is not uniquely attributable to a merged PR targeting preview; "
            "direct pushes and arbitrary workflow-dispatch refs are not deployable"
        )

    pr = matches[0]
    pr_number = int(pr["number"])
    pr_head = str((pr.get("head") or {}).get("sha") or "")
    if len(pr_head) != 40:
        raise SystemExit(f"Merged preview PR #{pr_number} has no usable exact head SHA")

    runs_query = urlencode({"head_sha": pr_head, "event": "pull_request", "per_page": 100})
    states: dict[str, tuple[str, str]] = {}
    for attempt in range(1, 11):
        runs = request_json(token, f"{API}/repos/{repository}/actions/runs?{runs_query}")
        states = latest_required_states(runs, pr_number)
        if all(state == ("completed", "success") for state in states.values()):
            break
        failed = [f"{name}={s}/{c}" for name, (s, c) in states.items() if s == "completed" and c not in {"success", "missing"}]
        if failed:
            raise SystemExit("Merged preview PR exact-head workflow failure: " + ", ".join(failed))
        if attempt < 10:
            time.sleep(2)
    else:
        details = ", ".join(f"{name}={s}/{c}" for name, (s, c) in states.items())
        raise SystemExit(f"Merged preview PR #{pr_number} exact-head workflows are not all green: {details}")

    print(
        f"Preview source verified: {source_sha} is the current preview head from merged PR #{pr_number}; "
        f"exact PR head {pr_head}; all {len(REQUIRED_WORKFLOWS)} required PR workflows succeeded."
    )


def self_test() -> None:
    source = "a" * 40
    exact = {"number": 1, "merged_at": "x", "base": {"ref": "preview"}, "merge_commit_sha": source}
    duplicate = dict(exact)
    wrong_base = {"number": 2, "merged_at": "x", "base": {"ref": "main"}, "merge_commit_sha": source}
    assert matching_preview_prs([wrong_base, exact], source) == [exact]
    assert len(unique_matches(([exact], [duplicate]), source)) == 1
    sample = {
        "workflow_runs": [
            {
                "id": i + 1,
                "name": name,
                "status": "completed",
                "conclusion": "success",
                "created_at": f"2026-10-03T00:00:0{i}Z",
                "pull_requests": [{"number": 1, "base": {"ref": "preview"}}],
            }
            for i, name in enumerate(REQUIRED_WORKFLOWS)
        ]
    }
    assert all(v == ("completed", "success") for v in latest_required_states(sample, 1).values())
    wrong_pr = {
        "workflow_runs": [{
            "id": 99,
            "name": REQUIRED_WORKFLOWS[0],
            "status": "completed",
            "conclusion": "success",
            "created_at": "2026-10-03T01:00:00Z",
            "pull_requests": [{"number": 2, "base": {"ref": "main"}}],
        }]
    }
    assert latest_required_states(wrong_pr, 1)[REQUIRED_WORKFLOWS[0]] == ("missing", "missing")
    print("Preview-source verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository")
    parser.add_argument("--source-sha")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.repository or not args.source_sha:
        raise SystemExit("--repository and --source-sha are required")
    token = os.environ.get("GITHUB_TOKEN", "").strip() or os.environ.get("GH_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_TOKEN or GH_TOKEN is required")
    verify(token, args.repository, args.source_sha)


if __name__ == "__main__":
    main()
