#!/usr/bin/env python3
"""Block GitHub's legacy branch Pages publisher from masquerading as a safe release.

The repository historically has a legacy Pages source configured on main. GitHub can
therefore start the dynamic `pages build and deployment` workflow on the same push as
our production-only Pages workflow. This helper first attempts to switch the Pages
site to workflow build mode. If the workflow token is not authorised to change that
repository setting, it best-effort cancels/waits out any same-SHA legacy publisher but
still fails the release gate: race cancellation is damage limitation, not proof that
publication was prevented.

A terminal/cancelled dynamic run is not sufficient evidence of safety. The helper also
inspects its jobs and fails if any `Deploy to GitHub Pages` step already succeeded.
This guards the exact race observed after PR #195, where GitHub completed deployment
before the cancellation request arrived and only later marked the workflow cancelled.

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
DEPLOY_STEP_NAME = "Deploy to GitHub Pages"


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


def jobs_report_successful_deploy(payload: object) -> bool:
    """Return true only when GitHub reports a successful Pages deploy step."""
    if not isinstance(payload, dict):
        return False
    for job in payload.get("jobs") or []:
        if not isinstance(job, dict):
            continue
        for step in job.get("steps") or []:
            if not isinstance(step, dict):
                continue
            if step.get("name") == DEPLOY_STEP_NAME and step.get("conclusion") == "success":
                return True
    return False


def legacy_run_has_successful_deploy(token: str, repository: str, run_id: int) -> bool:
    query = urlencode({"filter": "latest", "per_page": 100})
    payload = request_json(
        token,
        f"https://api.github.com/repos/{repository}/actions/runs/{run_id}/jobs?{query}",
    )
    return jobs_report_successful_deploy(payload)


def fail_if_legacy_deployed(token: str, repository: str, runs: list[dict]) -> None:
    for run in runs:
        run_id = int(run["id"])
        if legacy_run_has_successful_deploy(token, repository, run_id):
            raise SystemExit(
                f"Competing legacy Pages run {run_id} already completed {DEPLOY_STEP_NAME}; "
                "the physical-device publication gate was bypassed. Disable legacy branch "
                "publishing in repository Pages settings before any further main merge."
            )


def try_switch_to_workflow_mode(token: str, repository: str) -> bool:
    pages_url = f"https://api.github.com/repos/{repository}/pages"
    read_result = gh_request(token, "GET", pages_url)
    if read_result.returncode != 0:
        detail = (read_result.stderr or read_result.stdout).strip()[:240].replace("\n", " ")
        print(
            "::warning::Could not read GitHub Pages build mode via gh api "
            f"({detail}); same-SHA legacy cancellation will be attempted, but release "
            "readiness remains blocked until workflow mode is administrator-confirmed."
        )
        return False
    try:
        payload = json.loads(read_result.stdout)
    except json.JSONDecodeError:
        print(
            "::warning::GitHub Pages build-mode query returned invalid JSON; same-SHA "
            "legacy cancellation will be attempted, but release readiness remains blocked."
        )
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
        f"this workflow token could not switch it via gh api ({detail}). Same-SHA "
        "cancellation will be attempted as damage limitation, but production publication "
        "remains blocked until an administrator changes Pages Source to GitHub Actions."
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

        # Check job steps before cancellation and again on every poll. A run that is
        # later labelled cancelled is unsafe if deploy-pages already reported success.
        fail_if_legacy_deployed(token, repository, runs)

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
                # cancellation. Re-polling below will inspect its deploy step.
                if "HTTP 409" not in detail:
                    raise SystemExit(f"Could not cancel competing legacy Pages run {run_id} via gh api: {detail}")
                print(f"Competing legacy Pages run {run_id} became terminal before cancellation.")
            else:
                print(f"Requested cancellation of competing legacy Pages run {run_id}.")

        if seen and not active:
            # Give GitHub's job/step view a moment to converge before declaring the
            # terminal run free of a successful deployment.
            time.sleep(1)
            terminal = legacy_runs(token, repository, source_sha)
            fail_if_legacy_deployed(token, repository, terminal)
            conclusions = ", ".join(
                f"{run.get('id')}={run.get('conclusion') or run.get('status')}" for run in terminal
            )
            print(f"Legacy same-SHA Pages publisher is terminal without a successful deploy ({conclusions}).")
            return

        if not seen and time.monotonic() >= no_run_grace:
            print("No same-SHA legacy Pages publisher appeared during the guard window.")
            return

        time.sleep(3)

    remaining = legacy_runs(token, repository, source_sha)
    fail_if_legacy_deployed(token, repository, remaining)
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
    # created for the current push, so always drain/cancel and inspect the same-SHA race.
    contain_same_sha_legacy_run(token, args.repository, args.source_sha)
    if not switched:
        raise SystemExit(
            "GitHub Pages remains configured for legacy branch publishing or workflow mode "
            "could not be confirmed. Production publication remains blocked until an "
            "administrator changes Pages Source to GitHub Actions."
        )
    print("Pages publisher guard passed: workflow mode confirmed/selected and no successful legacy deploy detected.")


if __name__ == "__main__":
    main()
