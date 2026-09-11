#!/usr/bin/env python3
"""Run the smallest useful QA set for the files that changed.

This command is intentionally an iteration accelerator, not release authority.
Full governed release QA plus exact-release physical/human evidence remain the
source of truth for publication decisions.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def changed_files(base: str, head: str) -> set[str]:
    out = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=ACMR", f"{base}...{head}"],
        cwd=ROOT,
        text=True,
    )
    return {line.strip() for line in out.splitlines() if line.strip()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="HEAD^", help="base ref for change detection")
    parser.add_argument("--head", default="HEAD", help="head ref for change detection")
    args = parser.parse_args()

    files = changed_files(args.base, args.head)
    print(f"FAST FEEDBACK: {len(files)} changed file(s)")
    for path in sorted(files):
        print(f" - {path}")

    # Cheap syntax/format checks first so contributors get useful failures early.
    js = sorted(p for p in files if p.endswith((".js", ".cjs", ".mjs")) and (ROOT / p).exists())
    for path in js:
        run(["node", "--check", path])
    for path in sorted(p for p in files if p.endswith(".json") and (ROOT / p).exists()):
        json.loads((ROOT / path).read_text(encoding="utf-8"))
        print(f"JSON OK: {path}")

    commands: list[list[str]] = []
    if files & {"primary-learning-practice-hubs.js", "mobile-lesson-fix.css", "qa_practice_hub.py"}:
        commands.append([sys.executable, "qa_practice_hub.py"])

    if any("process-data" in p or p in {"data-integration-runtime.js", "current-data-manifest.json"} for p in files):
        if (ROOT / "qa_process_data_integrity.cjs").exists():
            commands.append(["node", "qa_process_data_integrity.cjs"])

    assessment_changed = any(
        p.startswith("assessment-")
        or p.startswith("qa_assessment_")
        or p == "qa_evidence_maturity.py"
        or "/assessment/" in p
        or p in {
            "tools/generate_assessment_decision_manifest.py",
            "data/assessment-decision-manifest-v1.json",
        }
        for p in files
    )
    if assessment_changed:
        for qa in [
            "qa_assessment_storage_scope.py",
            "qa_assessment_decision_manifest.py",
            "qa_assessment_quality.py",
            "qa_assessment_evidence.py",
            "qa_assessment_final_hardening.py",
            "qa_evidence_maturity.py",
        ]:
            if (ROOT / qa).exists():
                commands.append([sys.executable, qa])

    engineer_simulator_changed = bool(files & {
        "src/domains/engineering/engineer-simulator-ui.js",
        "qa_engineer_simulator_units.cjs",
    })
    if engineer_simulator_changed and (ROOT / "qa_engineer_simulator_units.cjs").exists():
        commands.append(["node", "qa_engineer_simulator_units.cjs"])

    code_scanning_changed = bool(files & {
        "MouldMaster_Core_App.html",
        "index.html",
        "tools/externalize_core_scripts.py",
        "tools/html_script_parser.py",
        "qa_release.py",
        "qa_architecture_debt.py",
        "src/core-runtime/inline-handler-bridge.js",
        "src/core-runtime/core-inline-004.js",
        "src/core-runtime/core-inline-010.js",
        "qa_html_script_parser.py",
        "qa_code_scanning_remediation.py",
    })
    if code_scanning_changed:
        commands.append([sys.executable, "qa_html_script_parser.py"])
        commands.append([sys.executable, "qa_code_scanning_remediation.py"])
        commands.append([sys.executable, "tools/externalize_core_scripts.py", "--check"])

    release_docs_changed = bool(files & {
        "README.md",
        "support.html",
        "version.json",
        "index.html",
        "pwa-shell.js",
        "service-worker.js",
        "qa_release_docs.py",
    })
    if release_docs_changed and (ROOT / "qa_release_docs.py").exists():
        commands.append([sys.executable, "qa_release_docs.py"])

    browser_contract_changed = any(
        p in {
            ".github/workflows/mobile-browser-qa.yml",
            "qa_webkit_regression.py",
            "playwright.config.cjs",
            "playwright.webkit-full.config.cjs",
            "playwright.cross-browser.config.cjs",
        }
        or (p.startswith("qa/") and p.endswith(".spec.js"))
        for p in files
    )
    if browser_contract_changed and (ROOT / "qa_webkit_regression.py").exists():
        commands.append([sys.executable, "qa_webkit_regression.py"])

    if any(p.startswith("src/domains/") or p in {"runtime-v2.js", "runtime-domain-manifest.json"} for p in files):
        if (ROOT / "qa_audit_consolidation.py").exists():
            commands.append([sys.executable, "qa_audit_consolidation.py"])

    # De-duplicate while preserving deterministic order.
    seen: set[tuple[str, ...]] = set()
    for command in commands:
        key = tuple(command)
        if key in seen:
            continue
        seen.add(key)
        run(command)

    print("FAST FEEDBACK: PASS")
    print("Fast feedback only; full release QA and exact-release physical/human evidence remain authoritative.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
