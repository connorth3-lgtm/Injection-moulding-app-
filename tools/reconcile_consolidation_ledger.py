#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
target_path = ROOT / "data" / "content-scale-targets.json"
qa_path = ROOT / "qa_content_scale_targets.py"

target = json.loads(target_path.read_text(encoding="utf-8"))
target["version"] = "2026.08.30.1"
target["reviewed"] = "2026-08-30"
fully = target["targets"]["fully_profiled_measured_datasets"]
fully["currentAccepted"] = 7
fully["currentDiscovered"] = 20
fully["notes"] = (
    "Seven exact-source measured dataset families satisfy the profiling acceptance definition. "
    "Cross-process contributes 51,241,491 accepted values while remaining partially unresolved for upper pressure/state semantics. "
    "ImPure now contributes 1,188,348 accepted cavity pressure/contact-temperature values but its hydraulic-pressure, screw-position and two generic analogue fields remain fail-closed, so the fully profiled-family count does not increase. "
    "FORinFPRO contributes 162,112 accepted ENGEL heating-zone actual-temperature values without changing the existing family count. "
    "PET is terminalized as zero-measured simulation/model evidence; Warwick, RWTH, rights, request-only, confidential and embargoed sources retain their explicit blockers."
)
measured = target["targets"]["measured_time_series_samples"]
measured["currentAccepted"] = 66_521_519
measured["notes"] = (
    "Accepted real time-series evidence totals 66,521,519 values: AVAPS 13,631,488; OpenMMS-T4G 298,080; "
    "cross-process 51,241,491; ImPure 1,188,348; and FORinFPRO 162,112. Commands, setpoints, unresolved channels, "
    "derived/model outputs, confidential/request-only/embargoed data and synthetic learning cycles remain excluded."
)
target_path.write_text(json.dumps(target, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

text = qa_path.read_text(encoding="utf-8")n = text
replacements = {
    'need((rights.get("summary") or {}).get("sourcesReviewed") == 5, "waveform rights-review source count drifted")':
    'need((rights.get("summary") or {}).get("sourcesReviewed") == len(rights.get("sources") or []) == 7, "waveform rights-review source count drifted")',
    'for blocked_id in ["skz-loki-v1"]:\n    need(rights_by_id[blocked_id].get("decision") == "blocked-no-explicit-license", f"{blocked_id} rights decision drifted")\n    need(by_id[blocked_id].get("license") is None and by_id[blocked_id].get("automatedIngestionAllowed") is False, f"{blocked_id} must remain non-executable without explicit data licence")':
    'blocked_rights = {\n    "probayes-main-v2": "blocked-no-v2-specific-license",\n    "probayes-doptimal-v1": "blocked-conflicting-official-license-metadata",\n    "skz-loki-v1": "blocked-no-explicit-license",\n}\nfor blocked_id, expected_decision in blocked_rights.items():\n    need(rights_by_id[blocked_id].get("decision") == expected_decision, f"{blocked_id} rights decision drifted")\n    need(by_id[blocked_id].get("license") is None and by_id[blocked_id].get("automatedIngestionAllowed") is False, f"{blocked_id} must remain non-executable without explicit data licence")',
    'need("dataVolumeMB" not in impure_count, "ImPure must not mislabel cumulative download traffic as source-data size")':
    'need("dataVolumeMB" not in impure_count, "ImPure must not mislabel cumulative download traffic as source-data size")\nneed(impure_count.get("acceptedMeasuredTimeSeriesSamples") == 1_188_348, "ImPure accepted measured-value count drifted")\nforinfpro_count = by_id["forinfpro-himd-v1"].get("count") or {}\nneed(forinfpro_count.get("acceptedMeasuredTimeSeriesSamples") == 162_112, "FORinFPRO accepted measured-value count drifted")',
    'accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"] + cl_profile["acceptedMeasuredTimeSeriesSamples"] + cu_profile["acceptedMeasuredTimeSeriesSamples"]':
    'accepted_measured_total = av_profile["acceptedMeasuredTimeSeriesSamples"] + om_profile["acceptedMeasuredTimeSeriesSamples"] + cl_profile["acceptedMeasuredTimeSeriesSamples"] + cu_profile["acceptedMeasuredTimeSeriesSamples"] + impure_count["acceptedMeasuredTimeSeriesSamples"] + forinfpro_count["acceptedMeasuredTimeSeriesSamples"]',
    'need(accepted_measured_total == 65_171_059, "combined real measured-sample arithmetic drifted")':
    'need(accepted_measured_total == 66_521_519, "combined real measured-sample arithmetic drifted")',
    'need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS plus OpenMMS plus accepted cross-process lower and upper evidence")':
    'need(targets["measured_time_series_samples"]["currentAccepted"] == accepted_measured_total, "measured sample count must equal AVAPS, OpenMMS, cross-process, ImPure and FORinFPRO accepted evidence")',
    '            {"path": "data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json", "accepted": cu_profile["acceptedMeasuredTimeSeriesSamples"]},':
    '            {"path": "data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json", "accepted": cu_profile["acceptedMeasuredTimeSeriesSamples"]},\n            {"path": "data/measured-dataset-inventory-v1.json#impure-pascoe-2022", "accepted": impure_count["acceptedMeasuredTimeSeriesSamples"]},\n            {"path": "data/measured-dataset-inventory-v1.json#forinfpro-himd-v1", "accepted": forinfpro_count["acceptedMeasuredTimeSeriesSamples"]},',
    'print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; 7 fully profiled families including ImPure and 1 restricted research/education profile; {accepted_measured_total:,} accepted real measured time-series values; {verified} publisher-verified primary measured studies; {summary.get(\'automatedIngestionAllowed\')} sources legally executable)")':
    'print(f"MouldMaster content-scale target integrity QA passed ({len(datasets)} measured datasets inventoried; 7 fully profiled families and 1 restricted research/education profile; {accepted_measured_total:,} accepted real measured time-series values; {verified} publisher-verified primary measured studies; {summary.get(\'automatedIngestionAllowed\')} sources legally executable)")',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"required reconciliation anchor missing: {old[:90]}")
    text = text.replace(old, new, 1)
if text == n:
    raise SystemExit("no QA reconciliation changes made")
qa_path.write_text(text, encoding="utf-8")
print("Reconciled canonical measured-data ledger to 66,521,519 accepted values and seven-source rights review")
