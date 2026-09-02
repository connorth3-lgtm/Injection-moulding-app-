#!/usr/bin/env python3
"""Verify that a production deployment/release source is governed and fully validated.

This is intentionally a production-time gate, not a PR-time branch-protection
substitute. It requires GitHub's live native main ruleset and, unless
--protection-only is used, verifies that the current main SHA came from a merged
PR whose exact source head passed every release-critical PR workflow.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RULESET_NAME = "Protect main — MouldMaster required gates"
REQUIRED_STATUS_CONTEXTS = {
    "integrity",
    "mobile-browser",
    "build-windows",
    "question-quality-50-pass",
}
REQUIRED_WORKFLOWS = (
    "MouldMaster Release QA",
    "Question Quality 50-Pass",
    "Mobile Browser QA",
    "Open Desktop Build",
    "Desktop Dependency Lock",
    "Research Utilisation QA",
    "Connected Process Data QA",
    "MouldMaster Maturity Hardening v2",
    "MouldMaster Deep Dive v2 QA",
    "MouldMaster Real Site Pilot Preflight",
    "Production Observability QA",
    "Read Aloud QA",
    "MouldMaster Specialist Evidence Gaps",
    "MouldMaster Evidence Scale Overlay QA",
    "Deploy MouldMaster to GitHub Pages",
)


def fail(message: str) -> "NoReturn":
    raise SystemExit(f"production source gate failed: {message}")


def api(repo: str, token: str, path: str):
    url = f"https://api.github.com/repos/{repo}/{path.lstrip('/')}"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "mouldmaster-production-source-gate/1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        fail(f"GitHub API {exc.code} for {path}: {detail}")
    except urllib.error.URLError as exc:
        fail(f"GitHub API unavailable for {path}: {exc}")


def verify_protection(repo: str, token: str) -> dict:
    branch = api(repo, token, "branches/main")
    if branch.get("protected") is not True:
        fail("GitHub does not report main as protected")

    summaries = api(repo, token, "rulesets")
    if not isinstance(summaries, list):
        fail("repository ruleset list is unavailable")
    match = next(
        (
            item
            for item in summaries
            if item.get("name") == RULESET_NAME
            and item.get("target") == "branch"
            and item.get("enforcement") == "active"
        ),
        None,
    )
    if not match:
        fail(f"active reviewed ruleset not found: {RULESET_NAME}")

    detail = api(repo, token, f"rulesets/{match['id']}")
    if detail.get("bypass_actors") not in ([], None):
        fail("main protection ruleset contains bypass actors")
    conditions = detail.get("conditions", {}).get("ref_name", {})
    if conditions.get("include") != ["refs/heads/main"] or conditions.get("exclude") not in ([], None):
        fail("main protection ruleset does not target only refs/heads/main")

    rules = detail.get("rules") or []
    by_type = {rule.get("type"): rule for rule in rules}
    for rule_type in ("deletion", "non_fast_forward", "required_linear_history", "pull_request", "required_status_checks"):
        if rule_type not in by_type:
            fail(f"main protection ruleset missing {rule_type}")

    pr_params = by_type["pull_request"].get("parameters") or {}
    if pr_params.get("allowed_merge_methods") != ["squash"]:
        fail("main ruleset must allow squash merge only")
    if pr_params.get("required_review_thread_resolution") is not True:
        fail("main ruleset must require review-thread resolution")

    status_params = by_type["required_status_checks"].get("parameters") or {}
    if status_params.get("strict_required_status_checks_policy") is not True:
        fail("main ruleset must require branches to be current before merge")
    contexts = {
        item.get("context")
        for item in status_params.get("required_status_checks") or []
        if item.get("context")
    }
    missing_contexts = sorted(REQUIRED_STATUS_CONTEXTS - contexts)
    if missing_contexts:
        fail("main ruleset missing required status contexts: " + ", ".join(missing_contexts))

    return {
        "id": detail.get("id"),
        "name": detail.get("name"),
        "enforcement": detail.get("enforcement"),
        "required_status_contexts": sorted(contexts),
        "review_thread_resolution": True,
        "bypass_actor_count": len(detail.get("bypass_actors") or []),
    }


def latest_successful_runs(runs: list[dict]) -> dict[str, dict]:
    latest: dict[str, dict] = {}
    for run in sorted(runs, key=lambda x: (x.get("updated_at") or "", int(x.get("id") or 0))):
        name = str(run.get("name") or "")
        if name:
            latest[name] = run
    return latest


def verify_release_source(repo: str, token: str, source_sha: str) -> dict:
    ref = api(repo, token, "git/ref/heads/main")
    main_sha = ref.get("object", {}).get("sha")
    if main_sha != source_sha:
        fail(f"release source {source_sha} is not the current main SHA {main_sha}")

    pulls = api(repo, token, f"commits/{source_sha}/pulls")
    merged = [
        pr
        for pr in (pulls or [])
        if pr.get("merged_at")
        and pr.get("base", {}).get("ref") == "main"
        and pr.get("merge_commit_sha") == source_sha
    ]
    if len(merged) != 1:
        fail("current main SHA is not uniquely attributable to one merged pull request")
    pr = merged[0]
    pr_head = pr.get("head", {}).get("sha")
    if not pr_head:
        fail("merged pull request source head is unavailable")

    query = urllib.parse.urlencode({"head_sha": pr_head, "event": "pull_request", "per_page": 100})
    run_payload = api(repo, token, f"actions/runs?{query}")
    latest = latest_successful_runs(run_payload.get("workflow_runs") or [])
    evidence = {}
    failures = []
    for workflow in REQUIRED_WORKFLOWS:
        run = latest.get(workflow)
        state = {
            "id": run.get("id") if run else None,
            "status": run.get("status") if run else "missing",
            "conclusion": run.get("conclusion") if run else "missing",
            "head_sha": run.get("head_sha") if run else None,
        }
        evidence[workflow] = state
        if not run or run.get("status") != "completed" or run.get("conclusion") != "success" or run.get("head_sha") != pr_head:
            failures.append(f"{workflow}={state['status']}/{state['conclusion']}")
    if failures:
        fail("exact merged PR head is not fully green: " + "; ".join(failures))

    return {
        "main_sha": main_sha,
        "pull_request": int(pr.get("number")),
        "pull_request_head_sha": pr_head,
        "required_workflows": evidence,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--protection-only", action="store_true")
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY"))
    parser.add_argument("--source-sha", default=os.environ.get("GITHUB_SHA"))
    parser.add_argument("--evidence-out")
    args = parser.parse_args()

    repo = args.repo
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not repo or "/" not in repo:
        fail("repository must be supplied with --repo or GITHUB_REPOSITORY")
    if not token:
        fail("GITHUB_TOKEN or GH_TOKEN is required")

    protection = verify_protection(repo, token)
    result = {
        "schema": 1,
        "checked_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "repository": repo,
        "protection": protection,
    }
    if not args.protection_only:
        if not args.source_sha:
            fail("source SHA must be supplied with --source-sha or GITHUB_SHA")
        result.update(verify_release_source(repo, token, args.source_sha))

    if args.evidence_out:
        out = Path(args.evidence_out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    if args.protection_only:
        print(f"Verified live main protection: {protection['name']} (ruleset {protection['id']}).")
    else:
        print(
            "Verified production source: "
            f"main={result['main_sha'][:12]} PR=#{result['pull_request']} "
            f"head={result['pull_request_head_sha'][:12]} workflows={len(REQUIRED_WORKFLOWS)} green."
        )


if __name__ == "__main__":
    main()
