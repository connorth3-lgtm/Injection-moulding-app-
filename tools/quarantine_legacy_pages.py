#!/usr/bin/env python3
"""Contain GitHub's legacy branch Pages publisher before the hardened deploy.

The repository historically has a legacy Pages source configured on main. GitHub can
therefore start the dynamic `pages build and deployment` workflow on the same push as
our production-only Pages workflow. This helper first attempts to switch the Pages
site to workflow build mode. If the workflow token is not authorised to change that
repository setting, it cancels/waits out any same-SHA legacy publisher so the hardened
production-only deployment always runs last.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API_VERSION = "2026-03-10"
LEGACY_NAME = "pages build and deployment"
LEGACY_PATH = "dynamic/pages/pages-build-deployment"


def api(token: str, method: str, url: str, payload: dict | None = None) -> tuple[int, bytes]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "MouldMaster-Pages-Publisher-Guard/1",
            **({"Content-Type": "application/json"} if body is not None else {}),
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            return int(response.status), response.read()
    except HTTPError as exc:
        return int(exc.code), exc.read()


def legacy_runs(token: str, repository: str, source_sha: str) -> list[dict]:
    query = urlencode({"head_sha": source_sha, "per_page": 100})
    status, body = api(token, "GET", f"https://api.github.com/repos/{repository}/actions/runs?{query}")
    if status != 200:
        raise SystemExit(f"Could not inspect competing Pages workflows: HTTP {status}")
    payload = json.loads(body.decode("utf-8"))
    return [
        run
        for run in payload.get("workflow_runs", [])
        if run.get("name") == LEGACY_NAME or run.get("path") == LEGACY_PATH
    ]


def try_switch_to_workflow_mode(token: str, repository: str) -> bool:
    pages_url = f"https://api.github.com/repos/{repository}/pages"
    status, body = api(token, "GET", pages_url)
    if status != 200:
        print(f"::warning::Could not read GitHub Pages build mode (HTTP {status}); using race containment.")
        return False
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        payload = {}
    if payload.get("build_type") == "workflow":
        print("GitHub Pages is already configured for custom workflow publishing.")
        return True

    status, body = api(token, "PUT", pages_url, {"build_type": "workflow"})
    if status == 204:
        print("Switched GitHub Pages build_type from legacy to workflow.")
        return True

    detail = body.decode("utf-8", errors="replace")[:240].replace("\n", " ")
    print(
        "::warning::GitHub Pages is still configured for legacy branch publishing and "
        f"this workflow token could not switch it (HTTP {status}: {detail}). "
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
            status, _ = api(
                token,
                "POST",
                f"https://api.github.com/repos/{repository}/actions/runs/{run_id}/cancel",
            )
            if status not in (202, 409):
                raise SystemExit(f"Could not cancel competing legacy Pages run {run_id}: HTTP {status}")
            print(f"Requested cancellation of competing legacy Pages run {run_id} (HTTP {status}).")

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
