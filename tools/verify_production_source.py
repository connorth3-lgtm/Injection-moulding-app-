#!/usr/bin/env python3
"""Fail closed unless a production SHA came from a fully-green merged PR.

Native branch protection is reported separately because GitHub's repository setting is
an administrator-side control. The provenance/check gate is sufficient to stop a
transient direct main push from reaching the Pages deploy job while the post-push
rollback guard is still defense in depth.
"""
from __future__ import annotations

import argparse
import json
import os
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://api.github.com"
API_VERSION = "2026-03-10"
REQUIRED_WORKFLOWS = (
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Open Desktop Build",
    "Question Quality 50-Pass",
)


def request_json(token: str, url: str) -> object:
    req = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "MouldMaster-Production-Source-Guard/1",
        },
    )
    try:
        with urlopen(req, timeout=20) as response:
            if int(response.status) != 200:
                raise SystemExit(f"GitHub production-source query failed: HTTP {response.status}")
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise SystemExit(f"GitHub production-source query failed: HTTP {exc.code}") from exc


def merged_pr(payload: object, source_sha: str) -> dict:
    rows = payload if isinstance(payload, list) else []
    matches = [
        row
        for row in rows
        if isinstance(row, dict)
        and row.get("merged_at")
        and (row.get("base") or {}).get("ref") == "main"
        and row.get("merge_commit_sha") == source_sha
    ]
    if len(matches) != 1:
        raise SystemExit(
            f"Production source {source_sha} is not uniquely attributable to a merged PR targeting main"
        )
    return matches[0]


def successful_required_workflows(payload: object) -> tuple[bool, dict[str, tuple[str, str]]]:
    runs = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    states: dict[str, tuple[str, str]] = {}
    for name in REQUIRED_WORKFLOWS:
        candidates = [r for r in runs if r.get("name") == name]
        candidates.sort(key=lambda r: str(r.get("updated_at") or ""), reverse=True)
        latest = candidates[0] if candidates else {}
        states[name] = (str(latest.get("status") or "missing"), str(latest.get("conclusion") or "missing"))
    return all(state == ("completed", "success") for state in states.values()), states


def verify(token: str, repository: str, source_sha: str, require_native_protection: bool) -> None:
    pulls = request_json(token, f"{API}/repos/{repository}/commits/{source_sha}/pulls")
    pr = merged_pr(pulls, source_sha)
    pr_number = int(pr["number"])
    pr_head = str((pr.get("head") or {}).get("sha") or "")
    if len(pr_head) != 40:
        raise SystemExit(f"Merged PR #{pr_number} has no usable exact head SHA")

    query = urlencode({"head_sha": pr_head, "event": "pull_request", "per_page": 100})
    states: dict[str, tuple[str, str]] = {}
    for attempt in range(1, 11):
        runs = request_json(token, f"{API}/repos/{repository}/actions/runs?{query}")
        ok, states = successful_required_workflows(runs)
        if ok:
            break
        if any(status == "completed" and conclusion not in {"success", "missing"} for status, conclusion in states.values()):
            details = ", ".join(f"{name}={s}/{c}" for name, (s, c) in states.items())
            raise SystemExit(f"Production source PR #{pr_number} has a failed required workflow: {details}")
        if attempt < 10:
            time.sleep(3)
    else:
        details = ", ".join(f"{name}={s}/{c}" for name, (s, c) in states.items())
        raise SystemExit(f"Production source PR #{pr_number} required workflows are not all green: {details}")

    branch = request_json(token, f"{API}/repos/{repository}/branches/main")
    protected = bool((branch or {}).get("protected")) if isinstance(branch, dict) else False
    if require_native_protection and not protected:
        raise SystemExit("Native main protection is required for this production operation but GitHub reports protected=false")
    if not protected:
        print("::warning::GitHub still reports main protected=false; merged-PR provenance is enforced here before publication, but native prevention remains pending issue #43.")

    print(
        f"Production source verified: main SHA {source_sha} is merged PR #{pr_number}; "
        f"exact PR head {pr_head}; all {len(REQUIRED_WORKFLOWS)} required PR workflows succeeded; "
        f"native_protection={str(protected).lower()}."
    )


def self_test() -> None:
    sample = {
        "workflow_runs": [
            {"name": name, "status": "completed", "conclusion": "success", "updated_at": "2026-09-03T00:00:00Z"}
            for name in REQUIRED_WORKFLOWS
        ]
    }
    ok, states = successful_required_workflows(sample)
    assert ok and len(states) == 4
    assert merged_pr(
        [{"number": 1, "merged_at": "x", "base": {"ref": "main"}, "merge_commit_sha": "a" * 40}],
        "a" * 40,
    )["number"] == 1
    print("Production source verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository")
    parser.add_argument("--source-sha")
    parser.add_argument("--require-native-protection", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.repository or not args.source_sha:
        raise SystemExit("--repository and --source-sha are required")
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_TOKEN is required")
    verify(token, args.repository, args.source_sha, args.require_native_protection)


if __name__ == "__main__":
    main()
