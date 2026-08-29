#!/usr/bin/env python3
"""Fail-closed QA for the remaining unresolved ImPure/PASCOE channels."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data" / "impure-pascoe-remaining-clarification-2026-08-30.json"
DICTIONARY = ROOT / "data" / "impure-pascoe-channel-dictionary-v1.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f"missing ImPure clarification dependency: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


c = load(CONTRACT)
d = load(DICTIONARY)

need(c.get("schema") == 1, "ImPure clarification schema drifted")
need(c.get("reviewed") == "2026-08-30", "ImPure clarification review date drifted")
need(c.get("datasetId") == "impure-pascoe-2022", "ImPure clarification dataset id drifted")
need(c.get("decision") == "remaining-four-channels-fail-closed-pending-source-clarification", "ImPure clarification decision drifted")

base = c.get("baseSemanticAcceptance") or {}
need(base.get("cycleRows") == 297_087, "ImPure clarification cycle-row count drifted")
need(base.get("profiledNumericSensorValues") == 2_376_696, "ImPure clarification profiled-value count drifted")
need(base.get("acceptedMeasuredTimeSeriesSamples") == 1_188_348, "ImPure current accepted count drifted")
need(base.get("remainingProfiledNumericSensorValues") == 1_188_348, "ImPure remaining value count drifted")
need(set(base.get("acceptedMeasuredColumns") or []) == {
    "TempMold1[IRT/Pascoe]", "TempMold2[IRT/Pascoe]",
    "Pressure1[IRT/Pascoe]", "Pressure2[IRT/Pascoe]"
}, "ImPure accepted cavity-channel set drifted")

routes = c.get("authoritativeSourceRoutes") or []
need(len(routes) >= 3, "ImPure clarification needs dataset-depositor and paper-author routes")
route_roles = {x.get("role"): x for x in routes}
need((route_roles.get("dataset depositor") or {}).get("name") == "Georgios Bakas", "ImPure dataset depositor route missing")
need((route_roles.get("dataset depositor") or {}).get("publicContact") == "gbakas@innovation-res.eu", "ImPure depositor contact evidence drifted")
need(any(x.get("publicContact") == "manaf.al-ahmad@strath.ac.uk" for x in routes), "ImPure Manaf Al-Ahmad contact route missing")
need(any(x.get("publicContact") == "qin.yi@strath.ac.uk" for x in routes), "ImPure Yi Qin contact route missing")

support = c.get("supportingEvidence") or {}
instrumentation = support.get("instrumentationPaper") or {}
need(instrumentation.get("hydraulicPressureSensor") == "Kistler 4262A", "ImPure hydraulic sensor model drifted")
need(instrumentation.get("screwPositionSensor") == "Kistler P510", "ImPure screw-position sensor model drifted")
manufacturer = support.get("manufacturerBoundary") or {}
need(manufacturer.get("mustNotInferDeliveredCsvUnitFromSensorFamilyAlone") is True, "ImPure manufacturer inference gate missing")
need("mV/V/mA" in manufacturer.get("assessment", ""), "ImPure 4262A multi-output evidence missing")
stage = support.get("stageMetadata") or {}
need(stage.get("analogInput2SingleGlobalDefinitionRejected") is True, "ImPure Analog Input[2] global-definition rejection missing")

requests = {x.get("column"): x for x in c.get("clarificationRequests") or []}
need(set(requests) == {
    "HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]",
    "Analog Input[1]", "Analog Input[2]"
}, "ImPure unresolved clarification-column set drifted")
need(requests["HydPressure[IRT/Pascoe]"].get("potentialAdditionalMeasuredValues") == 297_087, "ImPure hydraulic-pressure potential count drifted")
need(requests["ScrewPosition[IRT/Pascoe]"].get("potentialAdditionalMeasuredValues") == 297_087, "ImPure screw-position potential count drifted")
need(requests["Analog Input[1]"].get("potentialAdditionalMeasuredValuesIfStableAcrossAllRows") == 297_087, "ImPure Analog Input[1] upper-bound count drifted")
need(requests["Analog Input[2]"].get("potentialAdditionalMeasuredValuesUpperBound") == 297_087, "ImPure Analog Input[2] upper-bound count drifted")
need("single global meaning/unit is not acceptable" in requests["Analog Input[2]"].get("minimumEvidenceForPromotion", ""), "ImPure Analog Input[2] stage-specific rule missing")

boundary = c.get("countingBoundary") or {}
need(boundary.get("automaticPromotionAllowed") is False, "ImPure clarification must not auto-promote")
need(boundary.get("currentAcceptedMeasuredTimeSeriesSamples") == 1_188_348, "ImPure clarification current count drifted")
need(boundary.get("additionalAcceptedMeasuredTimeSeriesSamplesFromThisContract") == 0, "ImPure clarification cannot add values before source response")
need(boundary.get("maximumRemainingProfiledNumericValuesPotentiallyResolvable") == 1_188_348, "ImPure remaining upper bound drifted")
need(boundary.get("manufacturerNominalUnitsAloneAreInsufficient") is True, "ImPure manufacturer-only promotion gate missing")
need(boundary.get("aggregateDistributionSimilarityAloneIsInsufficient") is True, "ImPure aggregate-shape inference gate missing")
need(boundary.get("rawRowsOrCellValuesCommitted") is False, "ImPure raw-value repository boundary drifted")

outreach = c.get("outreachDraft") or {}
need(outreach.get("status") == "prepared-not-sent", "ImPure clarification must not claim outreach was sent")
body = outreach.get("body", "")
for text in ["HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]", "Analog Input[1]", "Analog Input[2]"]:
    need(text in body, f"ImPure outreach draft missing {text}")

fields = {x.get("column"): x for x in d.get("cycleSchema") or []}
need(fields["HydPressure[IRT/Pascoe]"].get("engineeringUnit") is None, "Do not promote hydraulic pressure before clarification")
need(fields["ScrewPosition[IRT/Pascoe]"].get("engineeringUnit") is None, "Do not promote screw position before clarification")
need(fields["Analog Input[1]"].get("engineeringUnit") is None, "Do not promote Analog Input[1] before clarification")
need(fields["Analog Input[2]"].get("engineeringUnit") is None, "Do not assign one global Analog Input[2] unit")
need((d.get("profiledStructure") or {}).get("acceptedMeasuredTimeSeriesSamples") == 1_188_348, "ImPure clarification branch must preserve existing partial acceptance")

print("MouldMaster ImPure remaining-channel clarification QA passed (four unresolved fields remain fail-closed; current accepted total stays 1,188,348; up to 1,188,348 further profiled values require source-defined units/mappings)")
