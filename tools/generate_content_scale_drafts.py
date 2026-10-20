#!/usr/bin/env python3
"""Generate full-scale *draft* MouldMaster content banks.

The generated records deliberately do NOT count toward accepted content targets. They are
coverage scaffolds that must be evidence-reviewed and promoted through the existing
approval gates. The goal is to make the scale problem concrete without lowering the
project's evidence standard or inventing production setpoints.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

MATERIAL_FAMILIES = [
    ("PP", "semi-crystalline polyolefin"), ("HDPE", "semi-crystalline polyolefin"),
    ("LDPE", "semi-crystalline polyolefin"), ("LLDPE", "semi-crystalline polyolefin"),
    ("ABS", "amorphous styrenic"), ("PC", "amorphous engineering thermoplastic"),
    ("PA6", "semi-crystalline polyamide"), ("PA66", "semi-crystalline polyamide"),
    ("PA12", "semi-crystalline polyamide"), ("PBT", "semi-crystalline polyester"),
    ("PET", "semi-crystalline polyester"), ("POM", "semi-crystalline engineering thermoplastic"),
    ("PMMA", "amorphous acrylic"), ("TPU", "thermoplastic elastomer"),
    ("TPE-S", "styrenic thermoplastic elastomer"), ("TPE-E", "polyester thermoplastic elastomer"),
    ("PPS", "high-temperature semi-crystalline polymer"), ("PEEK", "high-performance semi-crystalline polymer"),
    ("PEI", "high-temperature amorphous polymer"), ("PESU", "high-temperature amorphous polymer"),
    ("PS", "amorphous styrenic"), ("HIPS", "impact-modified styrenic"),
    ("ASA", "weather-resistant styrenic"), ("SAN", "styrenic copolymer"),
    ("PC/ABS", "amorphous polymer blend"), ("PPO/PS", "amorphous engineering blend")
]
MATERIAL_VARIANTS = [
    "standard-unfilled", "high-flow", "high-viscosity", "impact-modified",
    "glass-reinforced", "mineral-filled", "flame-retardant", "UV-stabilised",
    "recycled-content", "conductive-or-antistatic"
]

DEFECTS = [
    "short-shot", "flash", "sink-mark", "warpage", "burn-dieseling", "splay-silver-streak",
    "weld-knit-line", "jetting", "delamination", "black-speck", "void-internal-bubble",
    "gloss-variation", "stringing-drool", "ejection-mark-sticking", "flow-mark",
    "tiger-stripe-record-groove", "gate-blush", "cold-slug-mark", "vent-erosion",
    "dimensional-drift", "brittle-part", "colour-shift", "surface-haze", "gate-vestige-damage",
    "drag-mark", "parting-line-mismatch", "cavity-imbalance", "weight-drift", "bubbles-at-gate",
    "diesel-crack", "fibre-read-through", "fibre-orientation-warp"
]
MECHANISMS = [
    "insufficient-effective-fill-pressure-or-flow", "excessive-local-pressure-or-clamp-load",
    "thermal-state-too-low", "thermal-state-too-high-or-residence-degradation",
    "gas-entrapment-or-inadequate-venting", "material-moisture-volatiles-or-contamination",
    "packing-gate-seal-or-shrinkage-compensation", "cooling-imbalance-or-solidification-gradient",
    "tool-geometry-wear-damage-or-alignment", "material-rheology-or-batch-variation"
]

SENSOR_MODALITIES = [
    "cavity-pressure", "nozzle-pressure", "barrel-melt-pressure", "hydraulic-pressure",
    "injection-force", "screw-position", "screw-velocity", "screw-acceleration",
    "injection-flow-rate", "cushion-position", "transfer-position", "recovery-time",
    "screw-rotation-speed", "motor-current", "motor-torque", "servo-load",
    "electrical-power", "specific-energy", "tie-bar-strain", "clamp-force",
    "mould-surface-temperature", "cavity-temperature", "melt-temperature-probe", "IR-melt-temperature",
    "coolant-supply-temperature", "coolant-return-temperature", "coolant-flow", "coolant-pressure",
    "ultrasound-time-of-flight", "ultrasound-amplitude", "dielectric-capacitance", "dielectric-loss",
    "vibration-accelerometer", "acoustic-emission", "airborne-sound", "machine-vision",
    "part-weight", "dimensional-metrology", "surface-gloss", "colour-spectrometry",
    "dryer-dew-point", "resin-moisture", "ambient-temperature", "ambient-humidity"
]
SENSOR_CONCEPTS = ["measurement-and-location", "calibration-and-reference", "drift-and-failure", "derived-feature", "diagnostic-interpretation"]

ASSESSMENT_FORMS = [
    "recognise-evidence", "choose-next-test", "separate-cause-from-correlation", "select-controlled-response",
    "interpret-trend", "identify-confounder", "explain-physical-mechanism", "apply-safety-boundary"
]


def material_drafts() -> list[dict]:
    out = []
    for family, family_type in MATERIAL_FAMILIES:
        for variant in MATERIAL_VARIANTS:
            out.append({
                "id": f"mat-{family.lower().replace('/', '-')}-{variant}",
                "status": "draft-evidence-review-required",
                "family": family,
                "familyType": family_type,
                "profileClass": variant,
                "commercialGrade": None,
                "fillerReinforcement": "derive-from-exact-grade-before-promotion" if variant in {"glass-reinforced", "mineral-filled", "conductive-or-antistatic"} else "grade-specific",
                "rheology": {"status": "exact-grade-data-required", "fields": ["MFR-or-MVR", "viscosity-or-flow-curve-where-available"]},
                "dryingMoisture": {"status": "supplier-grade-guidance-required", "note": "Do not infer a universal drying recipe from family alone."},
                "thermal": {"status": "grade-data-required", "fields": ["Tg-if-applicable", "Tm-if-applicable", "thermal-history-limits"]},
                "processingWindow": {"status": "supplier-or-validated-process-source-required", "numericSetpoints": None},
                "shrinkageDimensional": {"status": "grade-and-flow-direction-data-required"},
                "degradationCompatibility": {"status": "family-and-grade-evidence-required"},
                "evidenceRequired": ["supplier-datasheet-or-authoritative-material-source", "at-least-one-processing-or-characterisation-source"],
                "promotionRule": "Complete exact-grade identity/properties and evidence review before counting toward accepted material-profile target."
            })
    assert len(out) == 260
    return out


def defect_drafts() -> list[dict]:
    out = []
    for defect in DEFECTS:
        for mechanism in MECHANISMS:
            out.append({
                "id": f"def-{defect}-{mechanism}",
                "status": "draft-mechanism-hypothesis-review-required",
                "visibleDefect": defect,
                "physicalMechanismCandidate": mechanism,
                "likelyCauseFamilies": [mechanism],
                "distinguishingEvidence": ["location-and-timing", "actual-process-signal-change", "material-tool-machine-context"],
                "tests": ["compare-baseline-fault-recovery-evidence", "change-one-controlled-factor-only-when-authorised"],
                "correctiveActionBoundary": "Educational response concept only; exact production changes require machine/mould/material/site validation.",
                "interactionDimensions": ["material", "tool", "machine", "thermal", "flow", "measurement"],
                "evidenceRequired": ["authoritative-mechanism-source", "primary-measured-study-where-available"],
                "promotionRule": "Reviewer must confirm that this defect/mechanism pairing is physically applicable and evidence-supported before acceptance."
            })
    assert len(out) == 320
    return out


def sensor_drafts() -> list[dict]:
    out = []
    for modality in SENSOR_MODALITIES:
        for concept in SENSOR_CONCEPTS:
            out.append({
                "id": f"sig-{modality}-{concept}",
                "status": "draft-evidence-review-required",
                "modality": modality,
                "concept": concept,
                "measurementLocationOrDomain": "must-be-defined-for-exact-machine-tool-sensor-context",
                "unitsOrFeatureSemantics": "sensor-or-derived-feature-specific",
                "calibrationReference": "required-where-applicable",
                "failureAndConfounders": ["sensor-drift", "installation-location", "sampling-and-filtering", "machine-tool-material-transfer"],
                "diagnosticUseBoundary": "A signal feature is evidence, not automatic root-cause proof.",
                "evidenceRequired": ["sensor-or-machine-documentation", "measured-study-or-calibration-source"],
                "promotionRule": "Confirm meaning, calibration/failure modes and injection-moulding relevance before acceptance."
            })
    assert len(out) == 220
    return out


def assessment_drafts(materials: list[dict], defects: list[dict], sensors: list[dict]) -> list[dict]:
    nodes = (
        [("material", x["id"]) for x in materials] +
        [("defect", x["id"]) for x in defects] +
        [("sensor", x["id"]) for x in sensors]
    )
    out = []
    i = 0
    while len(out) < 1200:
        domain, node = nodes[i % len(nodes)]
        form = ASSESSMENT_FORMS[(i // len(nodes)) % len(ASSESSMENT_FORMS)]
        out.append({
            "id": f"draft-q-{i+1:04d}",
            "status": "draft-not-live-not-counted",
            "domain": domain,
            "knowledgeNode": node,
            "form": form,
            "level": ["foundation", "intermediate", "advanced", "expert"][(i // 3) % 4],
            "promptTemplate": f"Using the evidence associated with {node}, complete a {form.replace('-', ' ')} task without treating correlation as proof or inventing a universal setpoint.",
            "scoring": {"type": "review-required", "answerKey": None},
            "explanationRequired": True,
            "evidenceMappingRequired": True,
            "safetyClassificationRequired": domain in {"defect", "sensor"},
            "duplicateCueQARequired": True,
            "promotionRule": "Must be rewritten into a learner-ready item, keyed, evidence-mapped and pass existing assessment approval/quality QA before entering the accepted bank."
        })
        i += 1
    return out


def write(path: Path, kind: str, records: list[dict]) -> None:
    payload = {
        "schema": 1,
        "kind": kind,
        "status": "draft-bank-not-counted-as-accepted",
        "count": len(records),
        "records": records,
        "boundary": "Generated coverage scaffolds are not accepted educational/engineering evidence. Promotion requires the area-specific MouldMaster evidence and QA gates."
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output-dir", default="generated/content-scale-drafts")
    args = ap.parse_args()
    root = Path(args.output_dir)
    root.mkdir(parents=True, exist_ok=True)
    mats = material_drafts()
    defs = defect_drafts()
    sigs = sensor_drafts()
    qs = assessment_drafts(mats, defs, sigs)
    write(root / "material-profile-drafts.json", "material-profiles", mats)
    write(root / "defect-mechanism-drafts.json", "defect-mechanisms", defs)
    write(root / "sensor-machine-health-drafts.json", "sensor-machine-health-concepts", sigs)
    write(root / "assessment-item-drafts.json", "assessment-education-items", qs)
    manifest = {
        "schema": 1,
        "status": "draft-generation-complete-not-accepted",
        "counts": {"materialProfiles": len(mats), "defectMechanisms": len(defs), "sensorMachineHealthConcepts": len(sigs), "assessmentEducationItems": len(qs)},
        "acceptedCountsChanged": False,
        "boundary": "These outputs intentionally meet draft-scale coverage counts while preserving accepted-count truthfulness."
    }
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
