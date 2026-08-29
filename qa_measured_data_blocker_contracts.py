#!/usr/bin/env python3
"""Fail-closed QA for unresolved measured-data source contracts."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def need(condition, message):
    if not condition:
        raise AssertionError(message)


impure = load("data/impure-pascoe-channel-dictionary-v1.json")
need(impure["datasetId"] == "impure-pascoe-2022", "ImPure dataset id drifted")
need(len(impure["cycleSchema"]) == 9, "ImPure exact cycle schema must contain nine fields")
need([x["column"] for x in impure["cycleSchema"]] == [
    "Time", "HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]", "Analog Input[1]", "Analog Input[2]",
    "TempMold1[IRT/Pascoe]", "TempMold2[IRT/Pascoe]", "Pressure1[IRT/Pascoe]", "Pressure2[IRT/Pascoe]"
], "ImPure delivered cycle schema drifted")
need(impure["profiledStructure"]["profiledNumericValues"] == 2376696, "ImPure profiled value count drifted")
need(impure["profiledStructure"]["acceptedMeasuredTimeSeriesSamples"] == 0, "ImPure values must remain non-counting while semantics/units are unresolved")
for field in impure["cycleSchema"]:
    need(field["engineeringUnit"] is None, f"Do not invent an ImPure unit for {field['column']}")
need(next(x for x in impure["cycleSchema"] if x["column"] == "Analog Input[1]")["meaning"] is None, "Analog Input[1] must remain unresolved")
need(next(x for x in impure["cycleSchema"] if x["column"] == "Analog Input[2]")["meaning"] is None, "Analog Input[2] must remain unresolved")

warwick = load("data/warwick-demoulding-source-contract-v1.json")
need(warwick["datasetId"] == "warwick-demoulding", "Warwick dataset id drifted")
need(warwick["source"]["license"] == "CC BY 4.0", "Warwick licence drifted")
need(warwick["retrievedState"]["publisherProjectFiles"] == 5, "Warwick source project-file count drifted")
need(warwick["retrievedState"]["acceptedMeasuredTimeSeriesSamples"] == 0, "Warwick sample counts must remain zero before Origin export")
need(warwick["measurementChain"]["samplingRateHz"] == 10000, "Warwick source sampling rate drifted")
need("Kistler Type 9211B" in warwick["measurementChain"]["sensor"], "Warwick force sensor contract missing")
need("NI cDAQ-9174" in warwick["measurementChain"]["dataAcquisition"], "Warwick DAQ contract missing")
need(len(warwick["originExportAcceptance"]) >= 7, "Warwick export acceptance contract is incomplete")
need("must not be promoted into universal production setpoints" in warwick["boundary"], "Warwick study-specific boundary missing")

print("Measured-data blocker source contract QA passed")
