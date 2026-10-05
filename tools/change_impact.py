#!/usr/bin/env python3
"""Shared change-impact classification for local QA and CI.

One source of truth for deciding which subsystems a diff can affect. This module
must stay conservative: false positives cost CI time; false negatives can hide
breakage.
"""
from __future__ import annotations
import argparse, json, subprocess
from pathlib import Path
from dependency_graph import impact as graph_impact

ROOT=Path(__file__).resolve().parents[1]

RUNTIME_ROOT_FILES={
    "index.html","service-worker.js","manifest.webmanifest","version.json",
    "latest.json","materials.html","reference-data.html",
}
RELEASE_METADATA_PREFIXES=(
    "data/release-external-validation",
    "data/pwa-physical-device-validation",
    "data/accessibility-real-at-validation",
    "data/nzqa-external-validation",
)
BROWSER_CONTRACT_FILES={
    ".github/workflows/mobile-browser-qa.yml",
    "playwright.config.cjs","playwright.webkit-full.config.cjs",
    "playwright.cross-browser.config.cjs","playwright.reachability.config.cjs",
    "playwright.app-500.config.cjs","qa_webkit_regression.py",
}

def changed_files(base:str,head:str="HEAD")->set[str]:
    try:
        out=subprocess.check_output(
            ["git","diff","--name-only","--diff-filter=ACMR",f"{base}...{head}"],
            cwd=ROOT,text=True,stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        out=subprocess.check_output(
            ["git","diff","--name-only","--diff-filter=ACMR",base,head],
            cwd=ROOT,text=True,
        )
    return {x.strip() for x in out.splitlines() if x.strip()}

def classify(files:set[str])->dict[str,bool]:
    graph_areas=set(graph_impact(files)["directAreas"])
    runtime=bool(graph_areas & {"shell","assessment","process-data","measured-learning","book","preview-release","production-health"}) or any(
        p in RUNTIME_ROOT_FILES
        or p.startswith("src/")
        or ("/" not in p and p.endswith((".js",".css",".html")))
        for p in files
    )
    release_metadata=("release-evidence" in graph_areas) or any(p.startswith(RELEASE_METADATA_PREFIXES) for p in files)
    browser=runtime or any(
        p in BROWSER_CONTRACT_FILES
        or (p.startswith("qa/") and p.endswith(".spec.js"))
        for p in files
    )
    generated=any(
        p.startswith("src/domains/runtime-packs/")
        or p in {"runtime-domain-manifest.json","tools/build_runtime_packs.py",
                 "tools/generate_runtime_manifest.py","tools/generate_style_csp.cjs"}
        for p in files
    )
    pages=runtime or any(
        ("pages" in p and (p.startswith(".github/workflows/") or p.startswith("tools/")))
        or p in {"qa_pages_single_publisher.py","qa_pages_candidate_handoff.py",
                 "qa_release_supply_chain.py"}
        for p in files
    )
    assessment=("assessment" in graph_areas) or any(
        p.startswith("assessment-") or p.startswith("qa_assessment_")
        or "/assessment/" in p or "learner-scope" in p
        for p in files
    )
    process_data=("process-data" in graph_areas) or any(
        "process-data" in p or "process_data" in p or "/process/" in p
        for p in files
    )
    book=("book" in graph_areas) or any(
        p.startswith("src/domains/learning/book-") or p.startswith("data/book-")
        or p.startswith("qa_book_") or p=="book-runtime.js"
        for p in files
    )
    shell=("shell" in graph_areas) or any(
        p in {"index.html","service-worker.js","materials.html"}
        or p.startswith("src/domains/shell/")
        or p.startswith("src/domains/runtime-packs/shell-")
        for p in files
    )
    question_quality=assessment or any(
        p.startswith("qa_question_")
        or p in {
            "real-measured-data-assessment.js",
            "assessment-psychometric-approval.js",
            "assessment-evidence-integrity-upgrade.js",
            "qa_audit_consolidation.py",
            ".github/workflows/question-quality-50-pass.yml",
        }
        for p in files
    )
    measured_learning=("measured-learning" in graph_areas) or any(
        p.startswith("data/measured-learning/")
        or p in {
            "measured-learning-library.js","measured-learning-library.css",
            "src/domains/shell/app-shell-finalize.js","service-worker.js",
            "tools/measured_learning_core.py","tools/build_measured_learning_case.py",
            "tools/promote_measured_learning_release.py",
            "qa_measured_learning_production_gate.py","qa_measured_learning_launch_gate.py",
            "tests/test_measured_learning_production_gate.py","tests/test_measured_learning_activation.js",
            "sources/MEASURED_LEARNING_PRODUCTION_GATE_V2.md",
            ".github/workflows/measured-learning-production-gate.yml",
        }
        for p in files
    )
    residual_integrity=any(
        p in {
            "data-integration-runtime.js","process-data-intelligence-ui.js",
            "src/domains/learning/training-qa-fix.js",
            "src/domains/process/process-data-integrity.js","privacy.html",
            "qa_data_integration.py","qa_process_data_integrity.cjs",
            "qa_process_statistics_integrity.cjs","qa_import_identity_integrity.cjs",
            "qa_final_audit_lifecycle.cjs",".github/workflows/residual-integrity.yml",
        }
        for p in files
    )
    workflow=any(p.startswith(".github/workflows/") for p in files)
    tooling=any(
        p.startswith("tools/") or p.startswith("qa_") or p.startswith("qa/")
        or p.startswith(".github/workflows/")
        or p in {"package.json","package-lock.json"}
        for p in files
    )
    return {
        "runtime":runtime,
        "release_metadata":release_metadata,
        "browser":browser,
        "generated":generated,
        "pages":pages,
        "assessment":assessment,
        "process_data":process_data,
        "book":book,
        "shell":shell,
        "question_quality":question_quality,
        "measured_learning":measured_learning,
        "residual_integrity":residual_integrity,
        "workflow":workflow,
        "tooling":tooling,
        "candidate_binding":runtime or release_metadata,
        "metadata_only":bool(files) and release_metadata and not runtime,
        "tooling_only":bool(files) and tooling and not runtime and not release_metadata,
        "graph_areas":sorted(graph_areas),
    }

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--base",required=True)
    ap.add_argument("--head",default="HEAD")
    ap.add_argument("--format",choices=("json","shell","text"),default="json")
    a=ap.parse_args()
    files=changed_files(a.base,a.head)
    impact=classify(files)
    payload={"base":a.base,"head":a.head,"files":sorted(files),"impact":impact}
    if a.format=="json":
        print(json.dumps(payload,indent=2))
    elif a.format=="shell":
        for key,val in impact.items():
            if isinstance(val,bool):
                print(f"{key}={'true' if val else 'false'}")
    else:
        print(f"{len(files)} changed file(s)")
        for key,val in impact.items():
            if isinstance(val,bool):
                print(f"{key}: {'yes' if val else 'no'}")
            else:
                print(f"{key}: {val}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
