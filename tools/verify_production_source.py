#!/usr/bin/env python3
"""Fail closed unless a production SHA came from a fully-green merged PR.

Production provenance intentionally uses the same `gh api` request contract as the
post-merge provenance guard. The guard has repeatedly resolved exact squash-merge
provenance in Actions, so the Pages verifier must not add a different REST-version
negotiation layer.

Provenance is cross-checked through the commit association and recent closed-main PR
indexes. A candidate is accepted only when it is merged, targets `main`, and its
`merge_commit_sha` exactly matches the production SHA. Duplicate observations of the
same PR are deduplicated; multiple distinct exact matches, failed checks, and policy
failures still fail closed.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import time
from urllib.parse import urlsplit, urlencode

from verify_main_ruleset import verify as verify_main_ruleset

API = "https://api.github.com"
PROVENANCE_ATTEMPTS = 20
REQUEST_ATTEMPTS = 5
RECENT_MAIN_PULL_LIMIT = 100
REQUIRED_WORKFLOWS = (
    "MouldMaster Release QA",
    "Mobile Browser QA",
    "Open Desktop Build",
    "Question Quality 50-Pass",
    "Release External Validation Boundary",
    "Exact-head CI Risk Coverage",
)
REQUIRED_WORKFLOW_PATHS = {
    "MouldMaster Release QA": ".github/workflows/qa.yml",
    "Mobile Browser QA": ".github/workflows/mobile-browser-qa.yml",
    "Open Desktop Build": ".github/workflows/open-desktop-build.yml",
    "Question Quality 50-Pass": ".github/workflows/question-quality-50-pass.yml",
    "Release External Validation Boundary": ".github/workflows/release-external-validation.yml",
    "Exact-head CI Risk Coverage": ".github/workflows/ci-risk-coverage.yml",
}


def api_endpoint(url: str) -> str:
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "api.github.com":
        raise SystemExit(f"Refusing non-GitHub API URL: {url}")
    endpoint = parsed.path.lstrip("/")
    if parsed.query:
        endpoint += "?" + parsed.query
    if not endpoint.startswith("repos/"):
        raise SystemExit(f"Refusing unsupported GitHub API endpoint: {endpoint}")
    return endpoint


def request_json(token: str, url: str) -> object:
    """Read GitHub REST JSON through GitHub CLI's authenticated API transport."""
    if not shutil.which("gh"):
        raise SystemExit("GitHub CLI (gh) is required for production-source verification")
    env = os.environ.copy()
    env["GH_TOKEN"] = token
    env["GITHUB_TOKEN"] = token
    command = [
        "gh",
        "api",
        "--method",
        "GET",
        "-H",
        "Accept: application/vnd.github+json",
        api_endpoint(url),
    ]
    last_detail = ""
    for attempt in range(1, REQUEST_ATTEMPTS + 1):
        result = subprocess.run(command, capture_output=True, text=True, env=env)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as exc:
                last_detail = f"invalid/truncated JSON: {exc}"
        else:
            last_detail = (result.stderr or result.stdout).strip() or f"gh api exited {result.returncode}"
        if attempt < REQUEST_ATTEMPTS:
            print(
                f"GitHub production-source API transport was not usable; retrying "
                f"({attempt}/{REQUEST_ATTEMPTS}): {last_detail}",
                flush=True,
            )
            time.sleep(min(2 * attempt, 6))
    raise SystemExit(
        f"GitHub production-source query failed after {REQUEST_ATTEMPTS} transport attempts: {last_detail}"
    )


def request_workflow_runs(token: str, repository: str, head_sha: str) -> dict:
    rows: list[dict] = []
    for page in range(1, 11):
        query = urlencode({
            "head_sha": head_sha,
            "event": "pull_request",
            "per_page": 100,
            "page": page,
        })
        payload = request_json(token, f"{API}/repos/{repository}/actions/runs?{query}")
        if not isinstance(payload, dict):
            raise SystemExit("GitHub production-source workflow query returned a non-object payload")
        page_rows = payload.get("workflow_runs") or []
        if not isinstance(page_rows, list):
            raise SystemExit("GitHub production-source workflow query returned invalid workflow_runs")
        rows.extend(row for row in page_rows if isinstance(row, dict))
        if len(page_rows) < 100:
            return {"workflow_runs": rows}
    raise SystemExit("GitHub production-source workflow query exceeded the 1000-run pagination safety bound")


def matching_merged_prs(payload: object, source_sha: str) -> list[dict]:
    rows = payload if isinstance(payload, list) else []
    return [
        row
        for row in rows
        if isinstance(row, dict)
        and row.get("merged_at")
        and (row.get("base") or {}).get("ref") == "main"
        and row.get("merge_commit_sha") == source_sha
    ]


def unique_matching_merged_prs(payloads: tuple[object, ...], source_sha: str) -> list[dict]:
    """Deduplicate the same exact PR observed through independent GitHub endpoints."""
    by_number: dict[int, dict] = {}
    for payload in payloads:
        for row in matching_merged_prs(payload, source_sha):
            try:
                number = int(row.get("number"))
            except (TypeError, ValueError):
                raise SystemExit("GitHub returned an exact merged-PR candidate without a usable PR number")
            by_number[number] = row
    return list(by_number.values())


def resolve_merged_pr(token: str, repository: str, source_sha: str) -> dict:
    """Resolve exactly one merged-main PR without trusting a single association index."""
    recent_query = urlencode(
        {
            "state": "closed",
            "base": "main",
            "sort": "updated",
            "direction": "desc",
            "per_page": RECENT_MAIN_PULL_LIMIT,
        }
    )
    recent_url = f"{API}/repos/{repository}/pulls?{recent_query}"

    for attempt in range(1, PROVENANCE_ATTEMPTS + 1):
        associated = request_json(token, f"{API}/repos/{repository}/commits/{source_sha}/pulls")
        recent_main = request_json(token, recent_url)
        matches = unique_matching_merged_prs((associated, recent_main), source_sha)
        if len(matches) > 1:
            raise SystemExit(
                f"Production source {source_sha} is ambiguously attributable to {len(matches)} merged PRs targeting main"
            )
        if len(matches) == 1:
            return matches[0]
        if attempt < PROVENANCE_ATTEMPTS:
            print(
                f"Exact merged-PR provenance for {source_sha} is not visible through either GitHub index yet; "
                f"retrying ({attempt}/{PROVENANCE_ATTEMPTS}).",
                flush=True,
            )
            time.sleep(3)
    raise SystemExit(
        f"Production source {source_sha} is not uniquely attributable to a merged PR targeting main "
        f"after {PROVENANCE_ATTEMPTS} cross-index checks"
    )


def run_matches_main_pr(
    row: dict,
    pr_number: int,
    pr_head_ref: str = "",
    pr_head_repo_id: int | None = None,
) -> bool:
    prs = row.get("pull_requests") or []
    if prs:
        return any(
            isinstance(pr, dict)
            and int(pr.get("number") or 0) == pr_number
            and ((pr.get("base") or {}).get("ref") == "main")
            for pr in prs
        )
    # GitHub may clear workflow_run.pull_requests after merge. Fall back to
    # immutable source-branch/repository identity while head_sha is already
    # constrained by the API query.
    if not pr_head_ref or row.get("head_branch") != pr_head_ref:
        return False
    if pr_head_repo_id is not None:
        return int(((row.get("head_repository") or {}).get("id")) or 0) == pr_head_repo_id
    return True


def successful_required_workflows(
    payload: object,
    pr_number: int | None = None,
    pr_head_ref: str = "",
    pr_head_repo_id: int | None = None,
) -> tuple[bool, dict[str, tuple[str, str]]]:
    runs = (payload or {}).get("workflow_runs", []) if isinstance(payload, dict) else []
    states: dict[str, tuple[str, str]] = {}
    for name in REQUIRED_WORKFLOWS:
        candidates = [
            r for r in runs
            if r.get("name") == name
            and r.get("path") == REQUIRED_WORKFLOW_PATHS[name]
            and (pr_number is None or run_matches_main_pr(r, pr_number, pr_head_ref, pr_head_repo_id))
        ]
        candidates.sort(key=lambda r: str(r.get("updated_at") or ""), reverse=True)
        latest = candidates[0] if candidates else {}
        states[name] = (str(latest.get("status") or "missing"), str(latest.get("conclusion") or "missing"))
    return all(state == ("completed", "success") for state in states.values()), states


def verify(token: str, repository: str, source_sha: str, require_native_protection: bool) -> None:
    if re.fullmatch(r"[0-9a-f]{40}", source_sha) is None:
        raise SystemExit("Production source SHA must be a full lowercase 40-character commit SHA")
    pr = resolve_merged_pr(token, repository, source_sha)
    pr_number = int(pr["number"])
    pr_head_info = pr.get("head") or {}
    pr_head = str(pr_head_info.get("sha") or "")
    pr_head_ref = str(pr_head_info.get("ref") or "")
    pr_head_repo_id = int(((pr_head_info.get("repo") or {}).get("id")) or 0) or None
    if re.fullmatch(r"[0-9a-f]{40}", pr_head) is None:
        raise SystemExit(f"Merged PR #{pr_number} has no usable canonical exact head SHA")

    states: dict[str, tuple[str, str]] = {}
    for attempt in range(1, 11):
        runs = request_workflow_runs(token, repository, pr_head)
        ok, states = successful_required_workflows(runs, pr_number, pr_head_ref, pr_head_repo_id)
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
    current_main_sha = str(((branch or {}).get("commit") or {}).get("sha") or "") if isinstance(branch, dict) else ""
    if require_native_protection:
        if current_main_sha != source_sha:
            raise SystemExit(
                f"Production source must be the current main head; current={current_main_sha}, requested={source_sha}. "
                "Historical or arbitrary workflow-dispatch refs cannot publish."
            )
        if not protected:
            raise SystemExit("Native main protection is required for this production operation but GitHub reports protected=false")
        verify_main_ruleset(repository)
    elif not protected:
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
    assert ok and len(states) == len(REQUIRED_WORKFLOWS)
    bound = {
        "workflow_runs": [
            {
                "name": name,
                "status": "completed",
                "conclusion": "success",
                "updated_at": "2026-09-03T00:00:00Z",
                "pull_requests": [{"number": 1, "base": {"ref": "main"}}],
            }
            for name in REQUIRED_WORKFLOWS
        ]
    }
    ok, _ = successful_required_workflows(bound, 1)
    assert ok
    wrong_pr = {
        "workflow_runs": [{
            "name": REQUIRED_WORKFLOWS[0],
            "status": "completed",
            "conclusion": "success",
            "updated_at": "2026-09-03T01:00:00Z",
            "pull_requests": [{"number": 2, "base": {"ref": "preview"}}],
        }]
    }
    ok, wrong_states = successful_required_workflows(wrong_pr, 1)
    assert not ok and wrong_states[REQUIRED_WORKFLOWS[0]] == ("missing", "missing")
    historical = {
        "workflow_runs": [
            {
                "name": name,
                "status": "completed",
                "conclusion": "success",
                "updated_at": "2026-09-03T02:00:00Z",
                "pull_requests": [],
                "head_branch": "feature/source",
                "head_repository": {"id": 123},
            }
            for name in REQUIRED_WORKFLOWS
        ]
    }
    ok, _ = successful_required_workflows(historical, 1, "feature/source", 123)
    assert ok
    ok, _ = successful_required_workflows(historical, 1, "wrong/source", 123)
    assert not ok

    assert api_endpoint("https://api.github.com/repos/example/project/pulls?state=closed") == "repos/example/project/pulls?state=closed"
    for invalid in ("http://api.github.com/repos/a/b", "https://example.com/repos/a/b", "https://api.github.com/user"):
        try:
            api_endpoint(invalid)
        except SystemExit:
            pass
        else:
            raise AssertionError(f"unsafe API endpoint was accepted: {invalid}")

    source = "a" * 40
    exact = {"number": 1, "merged_at": "x", "base": {"ref": "main"}, "merge_commit_sha": source}
    same_exact = dict(exact)
    wrong_base = {"number": 2, "merged_at": "x", "base": {"ref": "dev"}, "merge_commit_sha": source}
    wrong_sha = {"number": 3, "merged_at": "x", "base": {"ref": "main"}, "merge_commit_sha": "b" * 40}
    second_exact = dict(exact, number=4)

    assert matching_merged_prs([], source) == []
    assert matching_merged_prs([wrong_base, wrong_sha, exact], source) == [exact]
    assert unique_matching_merged_prs(([], [exact]), source) == [exact]
    assert unique_matching_merged_prs(([exact], [same_exact]), source) == [same_exact]
    assert len(unique_matching_merged_prs(([exact], [second_exact]), source)) == 2
    assert REQUEST_ATTEMPTS >= 3
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
