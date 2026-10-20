#!/usr/bin/env python3
"""Apply the reviewed FORinFPRO semantic acceptance to the canonical inventory.

This script is intentionally narrow and idempotent. It refuses to update an
unexpected source record and changes only the FORinFPRO entry plus inventory
version/review date.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "measured-dataset-inventory-v1.json"
DATASET_ID = "forinfpro-himd-v1"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


inv = json.loads(PATH.read_text(encoding="utf-8"))
need(inv.get("schema") == 1, "unexpected inventory schema")
rows = inv.get("datasets") or []
matches = [x for x in rows if x.get("datasetId") == DATASET_ID]
need(len(matches) == 1, "FORinFPRO inventory record missing/duplicated")
x = matches[0]
need(x.get("source") == "https://doi.org/10.5281/zenodo.20744054", "FORinFPRO source drifted")
need(x.get("license") == "CC BY 4.0", "FORinFPRO licence drifted")
need(x.get("automatedIngestionAllowed") is True, "FORinFPRO execution gate drifted")
count = x.get("count") or {}
need(count.get("cyclesInCurrentVisibleRelease") == 1, "FORinFPRO visible-cycle count drifted")
need(count.get("deliveredFiles") == 3, "FORinFPRO delivered-file count drifted")
need(count.get("totalRowsAcrossFiles") == 12689, "FORinFPRO delivered-row count drifted")
need(count.get("namedMachineChannels") == 60, "FORinFPRO named machine-channel count drifted")
existing = count.get("acceptedMeasuredTimeSeriesSamples")
need(existing in {None, 0, 162112}, f"unexpected pre-existing FORinFPRO accepted count: {existing}")

count.update({
    "acceptedMachineRows": 10132,
    "acceptedMeasuredChannels": 16,
    "acceptedMeasuredTimeSeriesSamples": 162112,
    "acceptedCountFormula": "16 * 10132"
})
x["count"] = count
x["signals"] = [
    "16 ENGEL Heating.sv_Zone*.rActualTemp actual heating-zone temperature channels (degC; accepted)",
    "other machine injection pressure/screw position/injection speed/clamping-force/temperature fields (unit-limited; excluded unless separately source-resolved)",
    "cavity pressure/temperature file (roles known, engineering units unresolved; excluded)",
    "ultrasonic RMS channels (derived/unit-limited; excluded)"
]
x["sampling"] = (
    "one synchronized delivered cycle; accepted ENGEL machine temperature traces contain 10,132 ordered rows "
    "under Datum/Zeit, with all timestamps parsed and strictly increasing; observed positive deltas span "
    "0.009834–0.014125 s (median 0.011953 s), so no fixed sampling interval is assumed"
)
x["statusNote"] = (
    "Exact CC BY 4.0 v1 release is fingerprinted. Manufacturer-backed ENGEL data-interface semantics plus an "
    "aggregate source probe accept 16 exact Heating.sv_Zone*.rActualTemp channels as actual heating-zone "
    "temperatures in degC across 10,132 strictly time-ordered machine rows, contributing 162,112 measured "
    "time-series values. HeatingOven1, other machine fields, cavity pressure/temperature and ultrasonic RMS "
    "remain excluded where source-specific units/roles are incomplete. This source was already one profiled "
    "dataset family, so the family count does not change."
)
inv["version"] = "2026.08.30.2"
inv["reviewed"] = "2026-08-30"
PATH.write_text(json.dumps(inv, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("Applied reviewed FORinFPRO inventory acceptance: 16 channels / 162,112 measured values")
