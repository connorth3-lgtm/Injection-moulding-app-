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


upper = load("data/cross-process-upper-workpiece-dictionary-v1.json")
need(upper["datasetId"] == "cross-process-chain-17240390", "Cross-process upper dataset id drifted")
need(upper["streamId"] == "upper-workpiece-injection-moulding", "Cross-process upper stream id drifted")
need(upper["exactDeliveredSchema"] == [
    "time", "injection_pressure_target", "injection_pressure_actual", "melt_volume", "injection_velocity", "state"
], "Cross-process upper delivered schema drifted")
upper_fields = {x["column"]: x for x in upper["fields"]}
need(upper_fields["injection_pressure_target"]["role"] == "command/target", "Upper pressure target must remain a command")
need(upper_fields["injection_pressure_target"]["engineeringUnit"] is None, "Do not infer the upper pressure-target unit")
need(upper_fields["injection_pressure_actual"]["engineeringUnit"] is None, "Do not infer the upper pressure-actual unit")
need(upper_fields["injection_pressure_actual"]["promotionEligible"] is False, "Upper pressure actual must remain non-counting while its unit is unresolved")
need(upper_fields["melt_volume"]["engineeringUnit"] == "cm3", "Upper melt-volume unit must remain source-backed cm3")
need(upper_fields["injection_velocity"]["engineeringUnit"] == "cm3/s", "Upper injection-velocity unit must remain source-backed cm3/s")
need(upper_fields["state"]["observedCodesInCheckedAuthorExample"] == [0, 1, 2, 4, 8], "Upper observed state-code set drifted")
need(upper_fields["state"]["sourceDefinedMeaning"] is None, "Do not invent upper state-code semantics")
need(upper_fields["state"]["promotionEligible"] is False, "Upper state codes must remain non-counting")
need(upper["timing"]["checkedAuthorExampleTimeIncrement"] == 0.01, "Upper checked source time increment drifted")
need(upper["timing"]["samplingRateAcceptedAsSingleArchiveConstant"] is False, "Do not collapse conflicting sampling evidence into one archive-wide rate")
need(upper["evidenceBoundary"]["additionalAcceptedMeasuredTimeSeriesSamples"] == 0, "Upper dictionary must not silently add measured values")
need(upper["evidenceBoundary"]["projectAcceptedMeasuredBaselineRemains"] == 21356311, "Project measured baseline must remain 21,356,311")
need(upper["evidenceBoundary"]["fullyProfiledFamiliesRemain"] == 7, "Fully profiled family count must remain seven")
need(len(upper["remainingAuthoritativeEvidenceRequired"]) == 2, "Upper blocker must remain narrowed to pressure unit and state semantics")

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
