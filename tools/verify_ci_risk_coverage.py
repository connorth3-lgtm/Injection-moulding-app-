#!/usr/bin/env python3
"""Fail closed if risk-required PR workflows did not run successfully on the exact head SHA."""
from __future__ import annotations

import fnmatch
import json
import os
import subprocess
import time
import urllib.parse
import urllib.request

REPO = os.environ.get("GITHUB_REPOSITORY", "connorth3-lgtm/Injection-moulding-app-")
SHA = os.environ.get("CI_RISK_HEAD_SHA", "").strip() or os.environ.get("GITHUB_SHA", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
BASE_REF = os.environ.get("GITHUB_BASE_REF", "main")
EVENT = os.environ.get("GITHUB_EVENT_NAME", "")
ATTEMPTS = max(1, int(os.environ.get("CI_RISK_ATTEMPTS", "16")))
SLEEP_SECONDS = max(1, int(os.environ.get("CI_RISK_SLEEP_SECONDS", "20")))

UNIVERSAL = {
    "MouldMaster Release QA",
    "MouldMaster Domain Foundation QA",
    "Deep Audit Governance",
}
RISK_RULES = [
    (
        "browser/runtime",
        ["index.html", "*.css", "*.js", "src/domains/**", "src/core-runtime/**", "service-worker.js", "qa/**/*.spec.js"],
        {"Premium UI QA", "MouldMaster Physical PWA Contract QA"},
    ),
    (
        "desktop",
        ["desktop/electron/**", "runtime-domain-manifest.json", "service-worker.js"],
        {"Open Desktop Build"},
    ),
    (
        "release/provenance",
        ["version.json", "service-worker.js", "runtime-domain-manifest.json", "release-asset-graph.json", "tools/build_pages_artifact.py", "data/release-external-validation-v1.json"],
        {"MouldMaster Pages Release Readiness", "Release External Validation Boundary", "MouldMaster Physical PWA Contract QA", "Open Desktop Build"},
    ),
    (
        "assessment",
        ["assessment-*.js", "qa_assessment_*.py", "qa/question*.spec.js", "sources/question*", "data/assessment*", "data/question*"],
        {"Question Quality 50-Pass", "Premium UI QA", "MouldMaster Release QA"},
    ),
]

def changed_paths() -> list[str]:
    if EVENT != "pull_request":
        return []
    subprocess.run(["git", "fetch", "--no-tags", "--depth=1", "origin", BASE_REF], check=True, stdout=subprocess.DEVNULL)
    out = subprocess.check_output(["git", "diff", "--name-only", f"origin/{BASE_REF}...HEAD"], text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]

def matches(path: str, pattern: str) -> bool:
    if pattern.endswith("/**"):
        return path.startswith(pattern[:-3].rstrip("/") + "/")
    return fnmatch.fnmatchcase(path.lower(), pattern.lower())

def expected_for(paths: list[str]) -> tuple[set[str], list[str]]:
    expected = set(UNIVERSAL)
    classes: list[str] = []
    for name, patterns, workflows in RISK_RULES:
        if any(matches(path, pattern) for path in paths for pattern in patterns):
            expected.update(workflows)
            classes.append(name)
    return expected, classes

def api_runs() -> dict[str, dict]:
    query = urllib.parse.urlencode({"head_sha": SHA, "event": "pull_request", "per_page": 100})
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/actions/runs?{query}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {TOKEN}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "mouldmaster-ci-risk-coverage",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        payload = json.load(response)
    latest: dict[str, dict] = {}
    for run in payload.get("workflow_runs", []):
        name = str(run.get("name") or "")
        prior = latest.get(name)
        if prior is None or str(run.get("created_at") or "") > str(prior.get("created_at") or ""):
            latest[name] = run
    return latest

def main() -> None:
    if EVENT != "pull_request":
        print("CI risk-coverage runtime meta-gate: non-PR event; exact-head workflow enforcement skipped.")
        return
    if not SHA or not TOKEN:
        raise SystemExit("Exact PR head SHA/GITHUB_TOKEN required for CI risk-coverage verification")
    paths = changed_paths()
    expected, classes = expected_for(paths)
    print("Changed paths:", json.dumps(paths))
    print("Risk classes:", ", ".join(classes) if classes else "universal-only")
    print("Expected workflows:", ", ".join(sorted(expected)))

    latest: dict[str, dict] = {}
    for attempt in range(ATTEMPTS):
        latest = api_runs()
        unresolved = []
        failed = []
        for name in sorted(expected):
            run = latest.get(name)
            if not run:
                unresolved.append(f"{name}:missing")
            elif run.get("status") != "completed":
                unresolved.append(f"{name}:{run.get('status')}")
            elif run.get("conclusion") != "success":
                failed.append(f"{name}:{run.get('conclusion')}")
        if failed:
            raise SystemExit("CI risk coverage failed on exact head: " + ", ".join(failed))
        if not unresolved:
            print(f"CI risk coverage passed for {len(expected)} workflow(s) on {SHA}.")
            return
        if attempt == ATTEMPTS - 1:
            raise SystemExit("CI risk coverage incomplete on exact head: " + ", ".join(unresolved))
        print("Waiting for exact-head workflow coverage:", ", ".join(unresolved))
        time.sleep(SLEEP_SECONDS)

if __name__ == "__main__":
    main()