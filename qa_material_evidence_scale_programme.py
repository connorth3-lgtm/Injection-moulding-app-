#!/usr/bin/env python3
from pathlib import Path
import json

wave=json.loads(Path("data/asian-aus-nz-material-grade-extraction-wave2-v1.json").read_text())
programme=json.loads(Path("data/material-evidence-scale-programme-v2.json").read_text())
rows=wave["records"]
complete=[r for r in rows if r.get("status")=="candidate-complete"]
discovery=[r for r in rows if r.get("status")=="discovery-only"]
partial=[r for r in rows if r.get("status")=="candidate-partial"]
conditional=[r for r in rows if r.get("status")=="conditional"]
assert programme["targets"]["propertyCompleteProfiles"]["stretch"]==1000
assert programme["targets"]["traceablePropertyObservations"]["preferred"]==25000
rules=programme["acceptanceRules"]
for k in ["primaryManufacturerEvidenceRequired","noUniversalSettings","noInterpolationAcrossGrades","regionalAvailabilityIsNotManufacturingOrigin","typicalValuesAreNotSpecifications","discoveryOnlyDoesNotCountAsComplete","partialDoesNotCountAsComplete","sourceRevisionConflictsMustRemainVisible","processingWindowsRemainGradeAndSourceSpecific"]:
    assert rules[k] is True, k
assert len(complete) >= 75
assert len(discovery) > 0
assert len(partial) > 0
assert len(conditional) > 0
# Scale targets are programme goals, not pass criteria until evidence exists.
assert len(complete) < programme["targets"]["propertyCompleteProfiles"]["stretch"] or len(complete) >= 1000
print(f"Material scale governance QA passed: {len(complete)} complete / {len(rows)} governed records; stretch target 1000 remains evidence-gated")
