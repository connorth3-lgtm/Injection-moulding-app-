#!/usr/bin/env python3
"""Generate the public aggregate current-data manifest from the governed closeout ledger."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/measured-data-collection-closeout-2026-08-30.json"
OUTPUT = ROOT / "current-data-manifest.json"
VERSION = "2026.09.02.2"


def build() -> dict:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    effective = source["canonicalEffectiveState"]
    return {
        "schema": 1,
        "version": VERSION,
        "generatedFrom": "data/measured-data-collection-closeout-2026-08-30.json",
        "generatedFromVersion": source["version"],
        "effectiveMeasuredState": {
            "inventoriedMeasuredSources": int(effective["inventoriedMeasuredSources"]),
            "rightsExecutableSources": int(effective["rightsExecutableSources"]),
            "fullyProfiledMeasuredFamilies": int(effective["fullyProfiledMeasuredFamilies"]),
            "acceptedInjectionProcessTimeSeriesValues": int(effective["acceptedInjectionProcessTimeSeriesValues"]),
        },
        "semanticRegistry": "./process-data-semantic-registry.json",
        "researchUtilisation": {
            "manifest": "data/research-utilisation-manifest-v1.json",
            "promotedMechanisms": 12,
            "publisherVerifiedPrimaryMeasuredStudies": 70,
            "evidenceQualitySeparatedFromApplicability": True,
            "supportsFalsification": True,
            "supportsVerificationPlans": True,
            "activeSurfaces": [
                "lessons",
                "measured-evidence panels",
                "process diagnostic labs",
                "semantic process-data intake",
                "site-local process intelligence",
                "workspace troubleshooting cases",
            ],
        },
        "evidenceStates": ["measured", "synthetic", "research-derived", "draft-unvalidated"],
        "boundaries": {
            "measuredDoesNotMeanUniversal": True,
            "researchDoesNotMeanUniversal": True,
            "unresolvedSemanticsFailClosed": True,
            "commandsAndSetpointsAreNotMeasuredActuals": True,
            "predictionIsNotCausation": True,
            "rawThirdPartyNumericPayloadShippedToPublicRuntime": False,
            "siteLocalPreparedDataIsNotAutomaticallyPromotedToRepositoryMeasuredEvidence": True,
        },
        "localProcessData": {
            "storage": "IndexedDB",
            "database": "mouldmaster-process-data-v1",
            "rawUpload": False,
            "intelligence": [
                "site-local baseline",
                "drift comparison",
                "before-after intervention comparison",
                "cavity intelligence",
                "quality association support",
                "energy per good part",
                "structured troubleshooting links",
                "similar-case support",
                "research applicability context",
                "learner recommendation bridge",
            ],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if the committed manifest is not current.")
    args = parser.parse_args()
    expected = json.dumps(build(), indent=2) + "\n"
    if args.check:
        actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if actual != expected:
            raise SystemExit("current-data-manifest.json is stale; run tools/generate_current_data_manifest.py")
        print("current-data-manifest.json is current")
        return
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
