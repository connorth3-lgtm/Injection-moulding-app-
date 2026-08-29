#!/usr/bin/env python3
"""Fail-closed QA for KAMP and Foxconn original-source rights evidence."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REVIEW = ROOT / "data" / "kamp-foxconn-origin-rights-review-2026-08-29.json"


def need(condition, message):
    if not condition:
        raise AssertionError(message)


review = json.loads(REVIEW.read_text(encoding="utf-8"))
need(review.get("schema") == 1, "KAMP/Foxconn rights-review schema drifted")
need(review.get("reviewed") == "2026-08-29", "KAMP/Foxconn review date drifted")

policy = review.get("policy") or {}
need(policy.get("publicMirrorDoesNotEstablishSourceDataRights") is True, "Public-mirror rights boundary missing")
need(policy.get("repositoryCodeLicenceDoesNotAutomaticallyLicenseThirdPartyData") is True, "Repository-code licence boundary missing")
need(policy.get("competitionDownloadAccessDoesNotEqualEnduringReusePermission") is True, "Competition-access boundary missing")
need(policy.get("catalogLicenceDoesNotAutomaticallyTransferToUnderlyingManufacturingFiles") is True, "Catalog licence boundary missing")
need(policy.get("automatedIngestionRemainsFailClosedUntilDatasetSpecificTermsAreCaptured") is True, "Fail-closed ingestion policy missing")

sources = {item["datasetId"]: item for item in review.get("sources") or []}
need(set(sources) == {"kamp-injection-7996", "foxconn-competition-16600"}, "KAMP/Foxconn rights-review source set drifted")

kamp = sources["kamp-injection-7996"]
need(kamp.get("decision") == "blocked-pending-first-party-dataset-row-or-terms-capture", "KAMP blocker decision drifted")
need(kamp.get("automatedIngestionAllowed") is False, "KAMP must remain non-executable pending first-party terms capture")
need(kamp.get("rawRedistributionAllowed") is False, "KAMP raw redistribution must remain fail-closed")
korig = kamp.get("originalSource") or {}
need(korig.get("datasetSequence") == 4, "KAMP DATASET_SEQ identity drifted")
need(korig.get("rows") == 7996 and korig.get("columns") == 44, "KAMP exact mirror/source identity counts drifted")
need(korig.get("target") == "PassOrFail", "KAMP target identity drifted")
need("DATASET_SEQ=4" in str(korig.get("datasetUrl", "")), "KAMP exact original dataset URL missing")
kcatalog = kamp.get("governmentCatalogEvidence") or {}
need("15089213" in str(kcatalog.get("recordUrl", "")), "KAMP official government catalog id missing")
need(kcatalog.get("exactRowCapturedFromFirstParty") is False, "KAMP must remain blocked until exact first-party usage condition is captured")
need("콘텐츠 변경허용" in str(kcatalog.get("exactRowUsageConditionStatus", "")), "KAMP secondary usage-condition evidence missing")
kmirror = kamp.get("mirrorEvidence") or {}
need(kmirror.get("repositoryLicence") == "MIT", "KAMP analysis-repository licence evidence drifted")
need("not accepted" in str(kmirror.get("licenceBoundary", "")), "KAMP mirror licence must not be treated as source-data permission")

fox = sources["foxconn-competition-16600"]
need(fox.get("decision") == "blocked-no-authoritative-reuse-license", "Foxconn blocker decision drifted")
need(fox.get("automatedIngestionAllowed") is False, "Foxconn must remain non-executable without source reuse rights")
need(fox.get("rawRedistributionAllowed") is False, "Foxconn raw redistribution must remain fail-closed")
forig = fox.get("originalSource") or {}
need(forig.get("provider") == "Foxconn Industrial Internet Co., Ltd.", "Foxconn source-provider provenance drifted")
need(forig.get("competitionDownloadWasAvailable") is True, "Foxconn historical competition access fact drifted")
need(forig.get("enduringReuseLicenceLocated") is False, "Do not invent a Foxconn enduring reuse licence")
need(forig.get("postCompetitionRedistributionPermissionLocated") is False, "Do not invent Foxconn post-competition redistribution permission")
fmirror = fox.get("mirrorEvidence") or {}
need(fmirror.get("repositoryLicence") is None, "Do not invent a licence for the Foxconn mirror")
need("dengxq888/Injection-Molding-Dataset" in str(fmirror.get("url", "")), "Foxconn mirror identity drifted")

boundary = str(review.get("evidenceBoundary", ""))
need("changes no accepted dataset-family count" in boundary, "KAMP/Foxconn non-inflation boundary missing")
need("measured-sample count" in boundary, "KAMP/Foxconn measured-count boundary missing")

print("KAMP/Foxconn source-rights QA passed (both sources remain fail-closed)")
