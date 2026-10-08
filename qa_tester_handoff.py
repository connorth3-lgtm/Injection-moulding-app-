#!/usr/bin/env python3
"""Fail-closed non-production tester-handoff checks; no network access by default.

--live is intentionally a separate human-operated pre-send gate. It verifies
actual Pages publication against the exact protected-main SHA, not the preview
Git branch or a pre-merge candidate artifact.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
DOCS = {
    "handoff": "docs/TESTER_HANDOFF.md",
    "quickstart": "docs/TESTER_QUICK_START.md",
    "invitation": "docs/TESTER_INVITATION.md",
    "triage": "docs/TESTER_FEEDBACK_TRIAGE.md",
}
HOLD_SECTIONS = (
    "accessibility", "pwaPhysicalDevices", "windowsDistribution",
    "bookSme", "curriculumSme", "learnerOutcomes", "nzqaProvider",
)
PREVIEW_SUFFIX = "preview/"
ISSUE_FORM = "https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/new?template=learner-problem.yml"


def need(ok: bool, explanation: str) -> None:
    if not ok:
        raise AssertionError("Tester handoff preflight: " + explanation)


def read(relative: str) -> str:
    path = ROOT / relative
    need(path.is_file(), f"required file missing: {relative}")
    return path.read_text(encoding="utf-8")


def load(relative: str) -> dict:
    value = json.loads(read(relative))
    need(isinstance(value, dict), f"expected JSON object in {relative}")
    return value


def verify_local() -> tuple[str, str]:
    version = load("version.json")
    release = str(version.get("web_release") or "")
    root_url = str(version.get("pages_url") or "").rstrip("/") + "/"
    need(re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+", release) is not None,
         "governed version.json web_release is missing")
    need(root_url == "https://connorth3-lgtm.github.io/Injection-moulding-app-/",
         "Pages root URL differs from the configured governed destination")
    preview_url = root_url + PREVIEW_SUFFIX

    ledger = load("data/release-external-validation-v1.json")
    need(ledger.get("release") == release, "external-validation release is stale")
    candidate = ledger.get("webCandidate") or {}
    need(candidate.get("release") == release, "candidate release is stale")
    need(re.fullmatch(r"[0-9a-f]{40}", str(candidate.get("sourceSha") or "")) is not None,
         "retained source SHA is missing/invalid")
    need(re.fullmatch(r"sha256:[0-9a-f]{64}", str(candidate.get("runtimeFingerprint") or "")) is not None,
         "retained runtime fingerprint is missing/invalid")
    for section in HOLD_SECTIONS:
        need((ledger.get(section) or {}).get("status") == "hold",
             f"{section} must retain its external-validation HOLD for this handoff")
    need((ledger.get("productionUse") or {}).get("status") == "advisory-only",
         "a tester invitation cannot grant production authority")
    for claim in (
        "fullyExternallyValidated", "accreditationAuthorized",
        "learnerEfficacyEstablished", "productionRecipeValidated",
        "automaticMachineControlAuthorized",
    ):
        need((ledger.get("claims") or {}).get(claim) is False,
             f"candidate incorrectly claims {claim}")

    texts = {key: read(path) for key, path in DOCS.items()}
    for key, body in texts.items():
        need("non-production" in body.lower(), f"{key} must state non-production status")
    for key in ("handoff", "quickstart", "invitation"):
        body = texts[key]
        need(release in body, f"{key} must visibly bind to the current release")
        need(preview_url in body, f"{key} must link to the explicit preview, not the root")
    for marker in (
        "not cleared to circulate", "--expected-source-sha",
        "protected-main", "Non-production preview", "STOP / no-send",
        "PR's pre-merge SHA",
    ):
        need(marker.lower() in texts["handoff"].lower(),
             f"operator handoff boundary missing: {marker}")
    for marker in (
        "No questionnaire or learning outcome is automatically submitted",
        "fictional", "Data & Reset", "SECURITY.md",
        "browser/device", "Non-production preview",
    ):
        need(marker.lower() in texts["quickstart"].lower(),
             f"tester quick start is missing: {marker}")
    for marker in (
        "voluntary", "privacy", "GitHub", "fictional",
        "15–20 minutes", "non-production",
    ):
        need(marker.lower() in texts["invitation"].lower(),
             f"invitation is missing: {marker}")
    for marker in (
        "P0", "P1", "P2", "P3", "SECURITY.md", "release", "HOLD",
    ):
        need(marker in texts["triage"], f"triage protocol is missing: {marker}")

    issue = read(".github/ISSUE_TEMPLATE/learner-problem.yml")
    support = read("support.html")
    privacy = read("privacy.html")
    need(ISSUE_FORM in support, "public Support page lost its learner problem route")
    need("Do not include learner names" in issue,
         "issue form must prohibit private learner identifiers")
    for marker in ("Reproduction steps", "What did you expect", "Browser or app",
                   "Learner impact", "Safe diagnostics"):
        need(marker in issue, f"tester issue form lacks {marker}")
    need("does not currently upload" in privacy,
         "privacy notice no longer discloses no application analytics upload")

    pages = read(".github/workflows/pages.yml")
    builder = read("tools/build_pages_hold.py")
    checker = read("tools/verify_pages_hold.py")
    need("branches: [main]" in pages and "python3 tools/build_pages_hold.py --preview-source .pages-dist" in pages,
         "hosted preview must remain controlled by the protected-main release-hold Pages workflow")
    need("PREVIEW_MARKER = 'content=\"non-production-preview\"'" in builder,
         "non-production preview boundary missing from build script")
    need("parser.add_argument(\"--expected-source-sha\")" in checker,
         "live preview checker cannot bind the protected-main SHA")
    need("preview/deployment.json" in checker,
         "live preview checker must inspect deployment provenance")

    print(f"Tester handoff repository checks passed: {release}; external validation HOLDs retained; "
          "invitation, privacy, reporting and preview release boundary coherent. "
          "LIVE DEPLOYMENT AND HUMAN PREFLIGHT ARE STILL REQUIRED.")
    return release, root_url


def verify_live(root_url: str, expected_source_sha: str, release: str) -> None:
    need(re.fullmatch(r"[0-9a-f]{40}", expected_source_sha) is not None,
         "expected protected-main SHA must be exactly 40 lowercase hex characters")
    subprocess.run(
        [
            sys.executable, str(ROOT / "tools/verify_pages_hold.py"),
            "--base-url", root_url,
            "--expected-source-sha", expected_source_sha,
            "--convergence-attempts", "1",
        ],
        cwd=ROOT,
        check=True,
    )
    request = Request(
        root_url + "preview/version.json",
        headers={"User-Agent": "MouldMaster-Tester-Handoff-Preflight/1",
                 "Cache-Control": "no-cache"},
    )
    with urlopen(request, timeout=20) as response:
        need(response.status == 200, "live preview version endpoint is unavailable")
        live_version = json.load(response)
    need(isinstance(live_version, dict) and live_version.get("web_release") == release,
         "live hosted preview web release does not match local intended version.json")
    print(f"LIVE TESTER PREFLIGHT PASSED: {release}, hosted preview source {expected_source_sha}; "
          "operator's manual first-run, privacy and triage checks remain required.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true",
                        help="check current Pages preview; requires --expected-source-sha")
    parser.add_argument("--expected-source-sha",
                        help="actual successful protected-main deployment SHA; not PR candidate SHA")
    args = parser.parse_args()
    if args.live and not args.expected_source_sha:
        parser.error("--live requires --expected-source-sha from a successful main Pages deployment")
    if args.expected_source_sha and not args.live:
        parser.error("--expected-source-sha only applies together with --live")
    release, root_url = verify_local()
    if args.live:
        verify_live(root_url, args.expected_source_sha, release)


if __name__ == "__main__":
    main()
