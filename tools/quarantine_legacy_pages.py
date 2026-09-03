#!/usr/bin/env python3
"""Contain GitHub's legacy branch Pages publisher before the hardened deploy.

The repository historically has a legacy Pages source configured on main. GitHub can
therefore start the dynamic `pages build and deployment` workflow on the same push as
our production-only Pages workflow. This helper first attempts to switch the Pages
site to workflow build mode. If the workflow token is not authorised to change that
repository setting, it cancels/waits out any same-SHA legacy publisher so the hardened
production-only deployment always runs last.

All GitHub API calls use the same authenticated `gh api` transport as the production
source verifier and post-merge provenance guard. Keeping one Actions API transport
avoids protocol/version drift between release gates.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import time
from urllib.parse import urlencode, urlsplit

LEGACY_NAME = "pages build and deployment"
LEGACY_PATH = "dynamic/pages/pages-build-deployment"


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


def gh_request(token: str, method: str, url: str, payload: dict | None = None) -> subprocess.CompletedProcess[str]:
    if not shutil.which("gh"):
        raise SystemExit("GitHub CLI (gh) is required for Pages publisher containment")
    env = os.environ.copy()
    env["GH_TOKEN"] = token
    env["GITHUB_TOKEN"] = token
    command = [
        "gh",
        "api",
        "--method",
        method,
        "-H",
        "Accept: application/vnd.github+json",
        api_endpoint(url),
    ]
    body = None
    if payload is not None:
        command.extend(["--input", "-"])
        body = json.dumps(payload)
    return subprocess.run(command, input=body, capture_output=True, text=True, env=env)


def request_json(token: str, url: str) -> object:
    result = gh_request(token, "GET", url)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise SystemExit(f"Could not inspect GitHub Pages state via gh api: {detail}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit("GitHub Pages query returned invalid JSON") from exc


def legacy_runs(token: str, repository: str, source_sha: str) -> list[dict]:
    query = urlencode({"head_sha": source_sha, "per_page": 100})
    payload = request_json(token, f"https://api.github.com/repos/{repository}/actions/runs?{query}")
    rows = payload.get("workflow_runs", []) if isinstance(payload, dict) else []
    return [
        run
        for run in rows
        if run.get("name") == LEGACY_NAME or run.get("path") == LEGACY_PATH
    ]


def try_switch_to_workflow_mode(token: str, repository: str) -> bool:
    pages_url = f"https://api.github.com/repos/{repository}/pages"
    read_result = gh_request(token, "GET", pages_url)
    if read_result.returncode != 0:
        detail = (read_result.stderr or read_result.stdout).strip()[:240].replace("\n", " ")
        print(f"::warning::Could not read GitHub Pages build mode via gh api ({detail}); using race containment.")
        return False
    try:
        payload = json.loads(read_result.stdout)
    except json.JSONDecodeError:
        print("::warning::GitHub Pages build-mode query returned invalid JSON; using race containment.")
        return False
    if payload.get("build_type") == "workflow":
        print("GitHub Pages is already configured for custom workflow publishing.")
        return True

    update_result = gh_request(token, "PUT", pages_url, {"build_type": "workflow"})
    if update_result.returncode == 0:
        print("Switched GitHub Pages build_type from legacy to workflow.")
        return True

    detail = (update_result.stderr or update_result.stdout).strip()[:240].replace("\n", " ")
    print(
        "::warning::GitHub Pages is still configured for legacy branch publishing and "
        f"this workflow token could not switch it via gh api ({detail}). "
        "Cancelling/waiting out the same-SHA legacy publisher before hardened deployment."
    )
    return False


def contain_same_sha_legacy_run(token: str, repository: str, source_sha: str) -> None:
    started = time.monotonic()
    deadline = started + 90
    no_run_grace = started + 30
    seen = False

    while time.monotonic() < deadline:
        runs = legacy_runs(token, repository, source_sha)
        if runs:
            seen = True

        active = [run for run in runs if run.get("status") != "completed"]
        for run in active:
            run_id = int(run["id"])
            result = gh_request(
                token,
                "POST",
                f"https://api.github.com/repos/{repository}/actions/runs/{run_id}/cancel",
            )
            if result.returncode != 0:
                detail = (result.stderr or result.stdout).strip()
                # GitHub returns 409 if the run became terminal between listing and
                # cancellation. That race is safe; every other API failure is fatal.
                if "HTTP 409" not in detail:
                    raise SystemExit(f"Could not cancel competing legacy Pages run {run_id} via gh api: {detail}")
                print(f"Competing legacy Pages run {run_id} became terminal before cancellation.")
            else:
                print(f"Requested cancellation of competing legacy Pages run {run_id}.")

        if seen and not active:
            conclusions = ", ".join(
                f"{run.get('id')}={run.get('conclusion') or run.get('status')}" for run in runs
            )
            print(f"Legacy same-SHA Pages publisher is terminal ({conclusions}); hardened deploy may proceed.")
            return

        if not seen and time.monotonic() >= no_run_grace:
            print("No same-SHA legacy Pages publisher appeared during the guard window.")
            return

        time.sleep(3)

    remaining = legacy_runs(token, repository, source_sha)
    active_ids = [str(run.get("id")) for run in remaining if run.get("status") != "completed"]
    raise SystemExit(
        "Competing legacy Pages publisher did not become terminal before timeout"
        + (f": {', '.join(active_ids)}" if active_ids else "")
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--source-sha", required=True)
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_TOKEN is required")

    switched = try_switch_to_workflow_mode(token, args.repository)
    # Even after a successful settings switch, a legacy run may already have been
    # created for the current push, so always drain/cancel the same-SHA race.
    contain_same_sha_legacy_run(token, args.repository, args.source_sha)
    print(
        "Pages publisher guard passed: "
        + ("workflow mode confirmed/selected" if switched else "legacy race contained for this SHA")
        + "."
    )


if __name__ == "__main__":
    main()
