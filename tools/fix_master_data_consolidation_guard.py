#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
qa = ROOT / "qa_master_data_compile.py"
workflow = ROOT / ".github" / "workflows" / "master-data-compile.yml"

s = qa.read_text(encoding="utf-8")
old = 'need(expected_samples == 65_171_059, "audited measured-sample baseline drifted")'
new = 'need(expected_samples == 66_521_519, "audited measured-sample baseline drifted")'
if old not in s:
    raise SystemExit("missing master QA baseline anchor")
s = s.replace(old, new, 1)

old_block = '''    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-upper-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] == expected_samples, "compiled measured benchmark sample totals do not reconcile")

    by_id = {x["datasetId"]: x for x in inv["datasets"]}
    impure = by_id["impure-pascoe-2022"]["count"]
    need(impure.get("publisherBytes") == 18_708_850 and impure.get("publisherFiles") == 309 and impure.get("cycleFiles") == 307 and impure.get("zenodoCumulativeDownloadTrafficMB") == 605.2 and "dataVolumeMB" not in impure, "compiled ImPure source dimensions drifted")'''
new_block = '''    by_id = {x["datasetId"]: x for x in inv["datasets"]}
    impure = by_id["impure-pascoe-2022"]["count"]
    forinfpro_inv = by_id["forinfpro-himd-v1"]["count"]
    need(results["scatimdata-avaps"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + results["openmms-t4g"]["measurement_profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-lower-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + review_results["cross-process-upper-workpiece-source-contract"]["profile"]["acceptedMeasuredTimeSeriesSamples"] + impure.get("acceptedMeasuredTimeSeriesSamples", 0) + forinfpro_inv.get("acceptedMeasuredTimeSeriesSamples", 0) == expected_samples, "compiled measured benchmark sample totals do not reconcile")
    need(impure.get("publisherBytes") == 18_708_850 and impure.get("publisherFiles") == 309 and impure.get("cycleFiles") == 307 and impure.get("zenodoCumulativeDownloadTrafficMB") == 605.2 and "dataVolumeMB" not in impure, "compiled ImPure source dimensions drifted")
    need(impure.get("acceptedMeasuredChannels") == 4 and impure.get("acceptedMeasuredTimeSeriesSamples") == 1_188_348, "compiled ImPure accepted partial-semantic count drifted")
    need(forinfpro_inv.get("acceptedMachineRows") == 10_132 and forinfpro_inv.get("acceptedMeasuredChannels") == 16 and forinfpro_inv.get("acceptedMeasuredTimeSeriesSamples") == 162_112, "compiled FORinFPRO accepted partial-semantic count drifted")'''
if old_block not in s:
    raise SystemExit("missing master QA source-reconciliation anchor")
s = s.replace(old_block, new_block, 1)
qa.write_text(s, encoding="utf-8")

w = workflow.read_text(encoding="utf-8")
old = "assert c['measuredTimeSeriesSamplesAccepted']==65171059"
new = "assert c['measuredTimeSeriesSamplesAccepted']==66521519"
if old not in w:
    raise SystemExit("missing master workflow measured-sample anchor")
workflow.write_text(w.replace(old, new, 1), encoding="utf-8")

print("Reconciled master-data compiler guard to 66,521,519 accepted measured values")
