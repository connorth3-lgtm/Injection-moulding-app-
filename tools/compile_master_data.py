#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def snapshot_file(path):
    p = ROOT / path
    raw = p.read_bytes()
    return {
        "path": path,
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "content": raw.decode("utf-8"),
    }


def compile_measured():
    targets = load_json("data/content-scale-targets.json")
    inventory = load_json("data/measured-dataset-inventory-v1.json")
    execution = load_json("data/measured-dataset-execution-ledger-v1.json")
    discovery = load_json("data/measured-dataset-catalog.json")
    queue = load_json("data/measured-data-discovery-queue-v1.json")
    evidence50 = load_json("data/measured-evidence-50-pass.json")
    registry = load_json("data/primary-measured-evidence-registry-v1.json")

    studies = []
    packs = []
    for pack in registry.get("packs", []):
        obj = load_json(pack["path"])
        rows = obj.get("entries") or []
        need(len(rows) == pack["entries"], f"primary measured pack count mismatch: {pack['path']}")
        studies.extend(rows)
        packs.append({"path": pack["path"], "pack": obj.get("pack"), "entries": rows})
    dois = [str(x.get("doi", "")).lower() for x in studies]
    expected = registry["summary"]["publisherVerifiedPeerReviewedPrimaryMeasured"]
    need(len(studies) == expected == 60, "primary measured registry must compile to 60 studies")
    need(len(dois) == len(set(dois)) and all(dois), "compiled primary measured studies must have 60 unique DOIs")

    dossiers = {}
    for p in sorted((ROOT / "data/mechanism-promotion-evidence").glob("*.json")):
        dossiers[p.name] = json.loads(p.read_text(encoding="utf-8"))

    benchmark_specs = [
        ("gtnb4j7bfx-v1", "data/public-benchmark-contracts/gtnb4j7bfx-v1.json", "data/public-benchmark-results/gtnb4j7bfx-v1.json"),
        ("scatimdata-avaps", "data/public-benchmark-contracts/scatimdata-avaps-v1.json", "data/public-benchmark-results/scatimdata-avaps-v1.json"),
        ("openmms-t4g", "data/public-benchmark-contracts/openmms-t4g-v1.json", "data/public-benchmark-results/openmms-t4g-v1.json"),
        ("su13148102-supplement", "data/public-benchmark-contracts/su13148102-supplement-v1.json", "data/public-benchmark-results/su13148102-supplement-v1.json"),
    ]
    benchmark_contracts = {}
    benchmark_results = {}
    for benchmark_id, contract_path, result_path in benchmark_specs:
        contract = load_json(contract_path)
        result = load_json(result_path)
        need(result.get("status") == "completed-public-measured-benchmark", f"completed measured benchmark status missing: {benchmark_id}")
        benchmark_contracts[benchmark_id] = contract
        benchmark_results[benchmark_id] = result

    accepted_profiled = targets["targets"]["fully_profiled_measured_datasets"]["currentAccepted"]
    need(len(benchmark_results) == accepted_profiled == 4, "completed measured benchmark result count must match accepted profiled dataset count")
    need(execution.get("summary", {}).get("acceptedProfiled") == accepted_profiled, "execution ledger accepted-profiled count drifted")

    return {
        "targetLedger": targets,
        "datasetInventory": inventory,
        "datasetExecutionLedger": execution,
        "datasetDiscoveryCatalog": discovery,
        "datasetDiscoveryQueue": queue,
        "measuredEvidence50Pass": evidence50,
        "primaryMeasuredRegistry": registry,
        "primaryMeasuredPacks": packs,
        "primaryMeasuredStudies": studies,
        "mechanismPromotionDossiers": dossiers,
        "publicBenchmarkContracts": benchmark_contracts,
        "publicBenchmarkResults": benchmark_results,
        "publicBenchmarkReviewResults": {
            "pet-preform-v2": load_json("data/public-benchmark-results/pet-preform-v2.json"),
            "warwick-demoulding": load_json("data/public-benchmark-results/warwick-demoulding-v2.json"),
        },
        # Backward-compatible aliases for the original record-level benchmark.
        "publicBenchmarkContract": benchmark_contracts["gtnb4j7bfx-v1"],
        "publicBenchmarkResult": benchmark_results["gtnb4j7bfx-v1"],
    }


def compile_research(candidate_path=None):
    wave_paths = [
        "data/deep-dive-v2-100-pass.json",
        "data/deep-dive-v2-wave2-100-pass.json",
        "data/deep-dive-v2-wave3-100-pass.json",
        "data/deep-dive-v2-wave4-100-pass.json",
        "data/deep-dive-v2-wave5-100-pass.json",
        "data/deep-dive-v2-wave6-100-pass.json",
    ]
    waves = []
    cumulative = []
    for number, path in enumerate(wave_paths, 1):
        obj = load_json(path)
        rows = obj.get("passes") or []
        need(len(rows) == 100, f"{path} must contain 100 evidence passes")
        waves.append({"wave": number, "path": path, "metadata": {k: v for k, v in obj.items() if k != "passes"}, "passes": rows})
        cumulative.extend(rows)
    need(len(cumulative) == 600, "Deep Dive v2 compilation must contain 600 passes")

    candidates = None
    if candidate_path:
        p = Path(candidate_path)
        candidates = json.loads(p.read_text(encoding="utf-8"))
        need(candidates.get("status") == "candidate-registry-not-counted-as-verified", "research candidate boundary missing")
        need(candidates.get("candidateCount") == len(candidates.get("records") or []), "research candidate count mismatch")

    return {
        "programmeTargets": load_json("data/deep-dive-v2-targets.json"),
        "waves": waves,
        "cumulativePassCount": len(cumulative),
        "candidateRegistry": candidates,
        "sourceFreshness": {
            "authoritative": load_json("sources/SOURCE_FRESHNESS.json"),
            "research": load_json("sources/RESEARCH_SOURCE_FRESHNESS.json"),
        },
    }


def data_source_paths():
    fixed = [
        "MouldMaster_Core_App.html",
        "source-library.js",
        "reference-data.js",
        "reference-deep-dive.js",
        "reference-research-extension.js",
        "reference-20x-extension.js",
        "reference-2026-expansion.js",
        "reference-sources.js",
        "diagnostic-learning-labs.js",
        "material-behaviour-labs.js",
        "evidence-maturity-deep-dive.js",
        "evidence-maturity-formal-bridge.js",
        "lesson-evidence-depth.js",
        "training-upgrade.js",
        "training-qa-fix.js",
        "curriculum-integration.js",
        "specialist-curriculum.js",
        "specialist-evidence-gap-extension.js",
    ]
    patterns = ["assessment-*.js", "process-data-*.js"]
    paths = set(fixed)
    for pattern in patterns:
        for p in ROOT.glob(pattern):
            if p.is_file():
                paths.add(p.name)
    for path in [
        "sources/QUESTION_REVISION_INDEX.json",
        "data/real-process-data-pilot-template.csv",
    ]:
        paths.add(path)
    return sorted(paths)


def compile_app_sources():
    paths = data_source_paths()
    snapshots = {path: snapshot_file(path) for path in paths}
    core = snapshots["MouldMaster_Core_App.html"]["content"]
    marker = "window.MM_DATA = "
    need(marker in core, "canonical MM_DATA block missing")
    runtime, _ = json.JSONDecoder().raw_decode(core[core.index(marker) + len(marker):])
    need(len(runtime.get("lessons") or []) == 120, "canonical core lesson count drifted")

    specialist_text = snapshots["specialist-curriculum.js"]["content"] + "\n" + snapshots["specialist-evidence-gap-extension.js"]["content"]
    specialist_ids = sorted(set(re.findall(r"\bid:'(S\d{2})',title:", specialist_text)))
    need(specialist_ids == [f"S{i:02d}" for i in range(1, 21)], f"specialist lesson IDs drifted: {specialist_ids}")

    reference_text = "\n".join(snapshots[x]["content"] for x in [
        "reference-data.js", "reference-deep-dive.js", "reference-research-extension.js", "reference-20x-extension.js", "reference-2026-expansion.js"
    ])
    structured_reference_entries = len(re.findall(r"\{\s*name\s*:\s*['\"]", reference_text))
    need(structured_reference_entries >= 180, "reference knowledge compilation unexpectedly small")

    return {
        "canonicalRuntimeData": runtime,
        "specialistLessonIds": specialist_ids,
        "structuredReferenceEntryMarkers": structured_reference_entries,
        "sourceSnapshots": snapshots,
    }


def compile_process_summary():
    p = subprocess.run([sys.executable, "qa_process_data_sweep.py"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    need(p.returncode == 0, p.stderr or p.stdout or "process-data sweep failed during compilation")
    report = load_json("process-data-sweep-report.json")
    totals = report.get("totals") or {}
    need(totals.get("cases") == 264 and totals.get("cycles") == 19008, "synthetic process-data corpus totals drifted")
    need((report.get("measuredDataBoundary") or {}).get("measuredRowsInSyntheticCorpus") == 0, "synthetic corpus must contain zero measured rows")
    return report


def compile_drafts():
    with tempfile.TemporaryDirectory() as td:
        p = subprocess.run([sys.executable, "tools/generate_content_scale_drafts.py", "--output-dir", td], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        need(p.returncode == 0, p.stderr or p.stdout or "draft-bank generator failed")
        root = Path(td)
        manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
        banks = {}
        for name in ["material-profile-drafts.json", "defect-mechanism-drafts.json", "sensor-machine-health-drafts.json", "assessment-item-drafts.json"]:
            banks[name] = json.loads((root / name).read_text(encoding="utf-8"))
        need(manifest.get("acceptedCountsChanged") is False, "draft compilation must never change accepted counts")
        return {"manifest": manifest, "banks": banks}


def make_manifest(measured, research, app, process, drafts, candidate_path):
    targets = measured["targetLedger"]["targets"]
    inventory_summary = measured["datasetInventory"]["summary"]
    primary_summary = measured["primaryMeasuredRegistry"]["summary"]
    draft_counts = drafts["manifest"]["counts"]
    candidates = research.get("candidateRegistry") or {}
    return {
        "schema": 2,
        "compiledOn": measured["targetLedger"].get("reviewed"),
        "scope": "Master compilation of MouldMaster structured data, evidence/provenance registries, application data assets, synthetic learning corpus metadata, curriculum/assessment data, generated draft banks and optionally the research-candidate registry. Restricted third-party raw files are not copied.",
        "boundaries": {
            "syntheticIsNotMeasured": True,
            "candidateResearchIsNotVerified": True,
            "metadataOnlyDatasetIsNotProfiled": True,
            "thirdPartyRawRedistributionNotAssumed": True,
            "productionSetpointsNotDerived": True,
        },
        "counts": {
            "measuredDatasetInventory": inventory_summary["datasets"],
            "automatedIngestionAllowedDatasets": inventory_summary["automatedIngestionAllowed"],
            "fullyProfiledMeasuredDatasets": targets["fully_profiled_measured_datasets"]["currentAccepted"],
            "measuredTimeSeriesSamplesAccepted": targets["measured_time_series_samples"]["currentAccepted"],
            "publisherVerifiedPrimaryMeasuredStudies": primary_summary["publisherVerifiedPeerReviewedPrimaryMeasured"],
            "verifiedPeerReviewedResearchRecords": targets["peer_reviewed_research_records"]["currentAccepted"],
            "measuredEvidencePasses": len(measured["measuredEvidence50Pass"].get("passes") or []),
            "deepDiveEvidencePasses": research["cumulativePassCount"],
            "researchCandidates": candidates.get("candidateCount", 0),
            "heuristicPrimaryMeasuredCandidates": candidates.get("primaryMeasuredCandidateCount", 0),
            "syntheticProcessCases": process["totals"]["cases"],
            "syntheticGeneratedCycles": process["totals"]["cycles"],
            "approvedAssessmentItems": targets["assessment_education_items"]["currentAccepted"],
            "coreLessons": len(app["canonicalRuntimeData"]["lessons"]),
            "specialistLessons": len(app["specialistLessonIds"]),
            "structuredReferenceEntryMarkers": app["structuredReferenceEntryMarkers"],
            "draftMaterialProfiles": draft_counts["materialProfiles"],
            "draftDefectMechanisms": draft_counts["defectMechanisms"],
            "draftSensorMachineHealthConcepts": draft_counts["sensorMachineHealthConcepts"],
            "draftAssessmentItems": draft_counts["assessmentEducationItems"],
        },
        "candidateRegistryEmbedded": bool(candidate_path),
        "sectionFiles": ["measured-data.json", "research-evidence.json", "app-data-sources.json", "synthetic-process-data.json", "draft-banks.json", "mouldmaster-all-data.json"],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output-dir", default="compiled-data")
    ap.add_argument("--research-candidates", default=None)
    args = ap.parse_args()
    out = Path(args.output_dir)
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True, exist_ok=True)

    measured = compile_measured()
    research = compile_research(args.research_candidates)
    app = compile_app_sources()
    process = compile_process_summary()
    drafts = compile_drafts()
    manifest = make_manifest(measured, research, app, process, drafts, args.research_candidates)

    write_json(out / "manifest.json", manifest)
    write_json(out / "measured-data.json", measured)
    write_json(out / "research-evidence.json", research)
    write_json(out / "app-data-sources.json", app)
    write_json(out / "synthetic-process-data.json", process)
    write_json(out / "draft-banks.json", drafts)
    write_json(out / "mouldmaster-all-data.json", {"manifest": manifest, "measured": measured, "research": research, "appData": app, "processData": process, "drafts": drafts})
    print(json.dumps(manifest["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
