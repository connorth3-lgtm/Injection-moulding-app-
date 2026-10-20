#!/usr/bin/env python3
"""Fail-closed QA for the confidential bottle-cap measured-data source."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data" / "bottle-cap-confidential-access-contract-2026-08-30.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(contract.get("schema") == 1, "unsupported bottle-cap contract schema")
need(contract.get("datasetId") == "bottle-cap-7162-confidential", "bottle-cap dataset id drifted")
need(contract.get("status") == "confidential-owner-authorization-required", "confidential status drifted")

source = contract.get("source") or {}
need(source.get("paperDoi") == "10.1016/j.asoc.2023.111029", "paper DOI drifted")
need(source.get("paperOpenAccess") is True, "paper open-access fact must be preserved")
need(source.get("paperLicenceDoesNotAuthorizeConfidentialProductionData") is True, "paper/data licence boundary missing")
need(source.get("publicCompanionDatasetLocated") is False, "do not invent a public companion dataset")
need(source.get("datasetSpecificReuseLicenceLocated") is False, "do not invent a dataset licence")
need("confidential" in source.get("dataAvailability", "").lower(), "publisher confidentiality statement missing")

ctx = contract.get("paperBackedExperimentContext") or {}
need(ctx.get("productionCycles") == 7162, "paper-reported cycle count drifted")
need(ctx.get("qualityCriteria") == 3, "paper-reported quality-criteria count drifted")
need(ctx.get("acceptedMeasuredSamplesBeforeAuthorization") == 0, "confidential data must remain non-counting")
need(ctx.get("paperReportedPredictionCorrelations") == [0.7, 0.89, 0.98], "paper-reported correlations drifted")

owner = contract.get("ownershipBoundary") or {}
need(owner.get("publiclyNamedIndustrialDataOwner") is None, "do not invent the industrial data owner")
need(owner.get("authorsAreNotAssumedToOwnOrControlTheConfidentialProductionData") is True, "author/owner boundary missing")
need(owner.get("paperPublicationLicenceDoesNotOverrideConfidentiality") is True, "confidentiality override guard missing")

route = contract.get("currentContactRoute") or {}
primary = route.get("primary") or {}
need(primary.get("name") == "Kurt Pichler", "current surviving-author route drifted")
need(primary.get("organisation") == "Linz Center of Mechatronics GmbH (LCM)", "LCM route drifted")
need(primary.get("email") == "kurt.pichler@lcm.at", "Kurt Pichler contact drifted")
need((route.get("organisationalFallback") or {}).get("email") == "office@lcm.at", "LCM fallback route missing")
need("died" in route.get("historicalAuthorBoundary", "").lower(), "historical-author boundary missing")

paths = contract.get("acceptableAuthorizationPaths") or []
need({x.get("id") for x in paths} == {"controlled-transfer", "owner-side-execution"}, "authorization path set drifted")
need(all(len(x.get("minimumTerms") or []) >= 5 for x in paths), "authorization paths are under-specified")
need(len(contract.get("requiredAuthorizationEvidence") or []) >= 6, "owner authorization evidence requirements too weak")
need(len(contract.get("profilingGateAfterAuthorization") or []) >= 7, "post-authorization profiling gate too weak")

decision = contract.get("decision") or {}
need(decision.get("automatedIngestionAllowed") is False, "confidential source must remain non-executable")
need(decision.get("rawRedistributionAllowed") is False, "confidential raw redistribution must remain disabled")
need(decision.get("restrictedAggregateProfilingAllowed") is False, "aggregate profiling needs owner authorization first")
need(decision.get("acceptedMeasuredSamplesChanged") is False, "this contract must not change measured totals")

boundary = contract.get("evidenceBoundary", "")
need("7,162" in boundary, "cycle-count evidence boundary missing")
need("confidential" in boundary.lower(), "confidentiality boundary missing")
need("zero accepted measured samples" in boundary.lower(), "non-counting boundary missing")

print("Bottle-cap confidential access contract QA passed")
