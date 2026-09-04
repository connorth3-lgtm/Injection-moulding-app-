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
need(upper_fields["melt_volume"]["promotionEligible"] is True, "Upper melt volume must remain promoted after deterministic archive-wide profiling")
need(upper_fields["injection_velocity"]["engineeringUnit"] == "cm3/s", "Upper injection-velocity unit must remain source-backed cm3/s")
need(upper_fields["injection_velocity"]["promotionEligible"] is True, "Upper injection velocity must remain promoted after deterministic archive-wide profiling")
need(upper_fields["state"]["observedCodesInCheckedAuthorExample"] == [0, 1, 2, 4, 8], "Upper observed state-code set drifted")
need(upper_fields["state"]["sourceDefinedMeaning"] is None, "Do not invent upper state-code semantics")
need(upper_fields["state"]["promotionEligible"] is False, "Upper state codes must remain non-counting")
need(upper["timing"]["checkedAuthorExampleTimeIncrement"] == 0.01, "Upper checked source time increment drifted")
need(upper["timing"]["samplingRateAcceptedAsSingleArchiveConstant"] is False, "Do not collapse conflicting sampling evidence into one archive-wide rate")
need(upper["evidenceBoundary"]["additionalAcceptedMeasuredTimeSeriesSamples"] == 43_814_748, "Upper specialist-parser accepted value count drifted")
need(upper["evidenceBoundary"]["canonicalEffectiveProjectAcceptedMeasuredBaseline"] == 85_569_824, "Canonical effective project baseline drifted")
need(upper["evidenceBoundary"]["canonicalEffectiveFullyProfiledFamilies"] == 17, "Canonical effective family count drifted")
need((upper.get("publicSourceRecheck") or {}).get("contactOrEmailUsed") is False, "Cross-process public recheck must not fabricate contact")
need(len(upper["remainingAuthoritativeEvidenceRequired"]) == 2, "Upper blocker must remain narrowed to pressure unit and state semantics")
upper_result = load("data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json")
upper_profile = upper_result.get("profile") or {}
need(upper_result.get("status") == "completed-source-defined-upper-workpiece-partial-acceptance", "Upper specialist-parser result missing")
need(upper_profile.get("upperWorkpieceSerialCsvFilesAccepted") == 10_697 and upper_profile.get("upperWorkpieceSerialCsvFilesRejected") == 0, "Upper specialist-parser file acceptance drifted")
need(upper_profile.get("upperWorkpieceRowsAccepted") == 21_907_374, "Upper specialist-parser row count drifted")
need(upper_profile.get("acceptedMeasuredTimeSeriesSamples") == 43_814_748, "Upper specialist-parser measured total drifted")
need(upper_profile.get("pressureActualValuesExcludedPendingUnit") == 21_907_374, "Upper pressure actual must remain excluded pending unit")
need(upper_profile.get("stateValuesExcludedPendingSemantics") == 21_907_374, "Upper state must remain excluded pending semantics")
need(upper_profile.get("rawRowsOrCellValuesEmitted") is False, "Upper specialist parser must not emit raw rows")

impure = load("data/impure-pascoe-channel-dictionary-v1.json")
need(impure["datasetId"] == "impure-pascoe-2022", "ImPure dataset id drifted")
need(len(impure["cycleSchema"]) == 9, "ImPure exact cycle schema must contain nine fields")
need([x["column"] for x in impure["cycleSchema"]] == [
    "Time", "HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]", "Analog Input[1]", "Analog Input[2]",
    "TempMold1[IRT/Pascoe]", "TempMold2[IRT/Pascoe]", "Pressure1[IRT/Pascoe]", "Pressure2[IRT/Pascoe]"
], "ImPure delivered cycle schema drifted")
impure_fields = {x["column"]: x for x in impure["cycleSchema"]}
profile = impure["profiledStructure"]
need(profile["profiledNumericValues"] == 2_376_696, "ImPure profiled value count drifted")
need(profile["acceptedMeasuredChannels"] == 4, "ImPure partial-acceptance channel count drifted")
need(profile["acceptedMeasuredTimeSeriesSamples"] == 1_188_348, "ImPure partial-acceptance measured value count drifted")
need(profile["acceptedCountFormula"] == "4 * 297087", "ImPure partial-acceptance formula drifted")
for column, unit in {
    "TempMold1[IRT/Pascoe]": "degC",
    "TempMold2[IRT/Pascoe]": "degC",
    "Pressure1[IRT/Pascoe]": "bar",
    "Pressure2[IRT/Pascoe]": "bar",
}.items():
    field = impure_fields[column]
    need(field["status"] == "accepted-measured", f"{column}: accepted status drifted")
    need(field["engineeringUnit"] == unit, f"{column}: accepted unit drifted")
    need(field["commandActualSemantics"] == "measured", f"{column}: direct-measurement role drifted")
for column in ["HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]", "Analog Input[1]", "Analog Input[2]"]:
    need(impure_fields[column]["engineeringUnit"] is None, f"Do not invent an unresolved ImPure unit for {column}")
need(impure_fields["HydPressure[IRT/Pascoe]"]["status"] == "source-meaning-resolved-export-unit-required", "ImPure hydraulic-pressure export-unit gate drifted")
need(impure_fields["ScrewPosition[IRT/Pascoe]"]["status"] == "source-meaning-resolved-unit-reference-required", "ImPure screw-position unit/reference gate drifted")
need(impure_fields["Analog Input[1]"]["meaning"] is None, "Analog Input[1] exact signal must remain unresolved")
need(impure_fields["Analog Input[1]"]["status"] == "exact-signal-definition-required", "Analog Input[1] signal-definition gate drifted")
need(impure_fields["Analog Input[2]"]["status"] == "configuration-dependent-not-globally-counted", "Analog Input[2] stage-dependent gate drifted")
need("stage-dependent" in str(impure_fields["Analog Input[2]"]["meaning"]), "Analog Input[2] must remain explicitly configuration-dependent")
need(impure_fields["Time"]["status"] == "accepted-ordering-not-counted", "ImPure time basis must remain ordering-only")
need("seconds" in str(impure_fields["Time"]["engineeringUnit"]), "ImPure time-delta interpretation drifted")
need((impure.get("publicSourceRecheck") or {}).get("additionalColumnsPromoted") == 0, "Public-source recheck cannot promote unresolved ImPure fields")
need((impure.get("canonicalEffectiveProjectState") or {}).get("acceptedInjectionProcessTimeSeriesValues") == 85_569_824, "ImPure canonical effective baseline drifted")

warwick = load("data/warwick-demoulding-source-contract-v1.json")
need(warwick["datasetId"] == "warwick-demoulding", "Warwick dataset id drifted")
need(warwick["source"]["license"] == "CC BY 4.0", "Warwick licence drifted")
need(warwick["retrievedState"]["publisherProjectFiles"] == 5, "Warwick source project-file count drifted")
need(warwick["retrievedState"]["acceptedMeasuredTimeSeriesSamples"] == 0, "Warwick sample counts must remain zero before promotion-grade Origin export")
need(warwick["measurementChain"]["samplingRateHz"] == 10000, "Warwick source sampling rate drifted")
need("Kistler Type 9211B" in warwick["measurementChain"]["sensor"], "Warwick force sensor contract missing")
need("NI cDAQ-9174" in warwick["measurementChain"]["dataAcquisition"], "Warwick DAQ contract missing")
need(len(warwick["originExportAcceptance"]) >= 7, "Warwick export acceptance contract is incomplete")
need(warwick["originViewerLane"]["promotionEligible"] is False, "Warwick Viewer lane must remain non-counting")
need(warwick["executionContract"]["readyForCountingRequiresFullOriginOrOriginPro"] is True, "Warwick promotion must require full Origin/OriginPro")
need("must not be promoted into universal production setpoints" in warwick["boundary"], "Warwick study-specific boundary missing")

print("Measured-data blocker source contract QA passed")
