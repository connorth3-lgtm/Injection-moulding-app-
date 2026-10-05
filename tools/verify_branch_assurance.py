#!/usr/bin/env python3
"""Fail closed until the exact pushed branch SHA has complete release assurance."""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError
from pathlib import Path

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


def latest_runs(payload: object, required: tuple[str, ...]) -> dict[str, dict]:
    rows = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    result: dict[str, dict] = {}
    for name in required:
        matches = [row for row in rows if row.get("name") == name]
        matches.sort(
            key=lambda row: (str(row.get("updated_at") or row.get("created_at") or ""), int(row.get("id") or 0)),
            reverse=True,
        )
        result[name] = matches[0] if matches else {}
    return result


def latest_states(payload: object, required: tuple[str, ...]) -> dict[str, tuple[str, str]]:
    return {
        name: (str(run.get("status") or "missing"), str(run.get("conclusion") or "missing"))
        for name, run in latest_runs(payload, required).items()
    }


def write_report(branch: str, sha: str, runs: dict[str, dict], verdict: str, reason: str) -> None:
    out = Path("qa-artifacts")
    out.mkdir(parents=True, exist_ok=True)
    workflows = []
    for name, run in runs.items():
        workflows.append({
            "name": name,
            "status": str(run.get("status") or "missing"),
            "conclusion": str(run.get("conclusion") or "missing"),
            "run_id": run.get("id"),
            "run_url": str(run.get("html_url") or ""),
            "updated_at": str(run.get("updated_at") or run.get("created_at") or ""),
        })
    payload = {
        "schema": 1,
        "branch": branch,
        "source_sha": sha,
        "verdict": verdict,
        "reason": reason,
        "workflows": workflows,
    }
    (out / "branch-assurance-report.json").write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    lines = [
        "# Branch Release Assurance",
        "",
        f"- Branch: `{branch}`",
        f"- Exact SHA: `{sha}`",
        f"- Verdict: **{verdict.upper()}**",
        f"- Reason: {reason}",
        "",
        "| Workflow | Status | Conclusion | Run |",
        "|---|---|---|---|",
    ]
    for row in workflows:
        url = row["run_url"]
        run_cell = f"[{row['run_id']}]({url})" if url and row["run_id"] else (str(row["run_id"]) if row["run_id"] else "—")
        lines.append(f"| {row['name']} | {row['status']} | {row['conclusion']} | {run_cell} |")
    markdown = "\n".join(lines) + "\n"
    (out / "branch-assurance-report.md").write_text(markdown, encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY", "").strip()
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)


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
    detail = "unknown API error"
    for attempt in range(1, 5):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            detail = str(exc)
            if attempt < 4:
                time.sleep(attempt * 2)
    raise RuntimeError(f"GitHub workflow-state query failed after 4 attempts: {detail}")


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

    last_runs: dict[str, dict] = {}
    for attempt in range(1, ATTEMPTS + 1):
        last_runs = latest_runs(api_runs(repository, sha, token), required)
        states = {
            name: (str(run.get("status") or "missing"), str(run.get("conclusion") or "missing"))
            for name, run in last_runs.items()
        }
        failed = [
            f"{name}={status}/{conclusion}"
            for name, (status, conclusion) in states.items()
            if status == "completed" and conclusion not in {"success", "missing"}
        ]
        if failed:
            reason = "first failing dependency: " + failed[0]
            write_report(branch, sha, last_runs, "fail", reason)
            raise SystemExit("Exact-push branch assurance failed: " + ", ".join(failed))

        unresolved = [
            f"{name}={status}/{conclusion}"
            for name, (status, conclusion) in states.items()
            if (status, conclusion) != ("completed", "success")
        ]
        if not unresolved:
            reason = f"all {len(required)} exact-push workflows succeeded"
            write_report(branch, sha, last_runs, "pass", reason)
            print(f"Branch assurance passed: {len(required)} exact-push workflows succeeded on {branch}@{sha}.")
            return
        if attempt == ATTEMPTS:
            reason = "first unresolved dependency: " + unresolved[0]
            write_report(branch, sha, last_runs, "incomplete", reason)
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
    runs = latest_runs(payload, REQUIRED["preview"])
    states = latest_states(payload, REQUIRED["preview"])
    assert all(value == ("completed", "success") for value in states.values())
    assert all(run.get("id") for run in runs.values())
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
