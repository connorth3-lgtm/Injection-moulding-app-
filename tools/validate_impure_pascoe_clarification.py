#!/usr/bin/env python3
"""Fail-closed validator for PASCOE/ImPure delivered-channel clarification."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

SOURCE_TYPES = {"dataset-depositor", "source-author", "publisher", "source-controlled-documentation", "acquisition-export-definition"}
TOTAL_FILES = 307


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_segment(segment: dict, label: str) -> int:
    need(text(segment.get("scope")), f"{label}: source-defined scope is required")
    need(text(segment.get("physicalSignal")), f"{label}: physical signal is required")
    need(text(segment.get("engineeringUnit")), f"{label}: engineering unit is required")
    need(text(segment.get("scaling")), f"{label}: scaling/conversion statement is required")
    need(text(segment.get("sourceEvidence")), f"{label}: source evidence is required")
    count = segment.get("cycleFileCount")
    need(isinstance(count, int) and count > 0, f"{label}: cycleFileCount must be positive")
    return count


def validate(data: dict, require_resolved: bool = False) -> dict:
    need(data.get("schema") == 1, "clarification schema must be 1")
    need(data.get("datasetId") == "impure-pascoe-2022", "dataset id drifted")
    need(data.get("deliveredCycleFiles") == TOTAL_FILES, "delivered cycle-file count drifted")
    status = data.get("status")
    need(status in {"pending-source-clarification", "resolved-source-defined"}, "unknown clarification status")

    boundary = data.get("promotionBoundary") or {}
    need(boundary.get("manufacturerNominalUnitsAloneInsufficient") is True, "manufacturer-unit inference must remain forbidden")
    need(boundary.get("aggregateSimilarityAloneInsufficient") is True, "distribution inference must remain forbidden")
    need(boundary.get("analogInput2GlobalMeaningForbidden") is True, "Analog Input[2] must remain stage-dependent")
    need(boundary.get("unknownCoverageRemainsNonCounting") is True, "unknown coverage must remain non-counting")

    channels = data.get("channels") or {}
    required = {"HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]", "Analog Input[1]", "Analog Input[2]"}
    need(set(channels) == required, "clarification must cover exactly the four unresolved delivered fields")
    hyd = channels["HydPressure[IRT/Pascoe]"]
    screw = channels["ScrewPosition[IRT/Pascoe]"]
    a1 = channels["Analog Input[1]"]
    a2 = channels["Analog Input[2]"]
    need(hyd.get("meaning") == "measured hydraulic pressure", "hydraulic-pressure physical meaning drifted")
    need(screw.get("meaning") == "measured screw position", "screw-position physical meaning drifted")
    need(a2.get("mappingType") == "stage-dependent", "Analog Input[2] must not be collapsed to one global meaning")

    coverage = data.get("coverage") or {}
    mapped = coverage.get("cycleFilesMapped")
    excluded = coverage.get("cycleFilesExplicitlyExcluded")
    need(isinstance(mapped, int) and mapped >= 0, "cycleFilesMapped must be a non-negative integer")
    need(isinstance(excluded, int) and excluded >= 0, "cycleFilesExplicitlyExcluded must be a non-negative integer")
    need(mapped + excluded == TOTAL_FILES, "mapped plus explicitly excluded cycle files must equal 307")

    resolved = status == "resolved-source-defined"
    if require_resolved:
        need(resolved, "authoritative resolved clarification is required")
    segment_count = 0
    if resolved:
        authority = data.get("authority") or {}
        need(authority.get("sourceType") in SOURCE_TYPES, "resolved clarification needs an authoritative source type")
        need(text(authority.get("sourceReference")), "resolved clarification needs a traceable source reference")
        need(text(authority.get("sourceIdentity")), "resolved clarification needs a source identity")
        for key, record in (("HydPressure", hyd), ("ScrewPosition", screw)):
            need(text(record.get("engineeringUnit")), f"{key}: engineering unit is required")
            need(text(record.get("scaling")), f"{key}: scaling/conversion statement is required")
            need(text(record.get("sourceEvidence")), f"{key}: source evidence is required")
        need(text(screw.get("referenceOrigin")), "ScrewPosition: physical reference/origin is required")
        need(a1.get("mappingType") in {"stable", "stage-dependent"}, "Analog Input[1] needs a source-defined mapping type")
        a1_segments = a1.get("segments") or []
        a2_segments = a2.get("segments") or []
        need(isinstance(a1_segments, list) and a1_segments, "Analog Input[1] needs at least one source-defined segment")
        need(isinstance(a2_segments, list) and len(a2_segments) >= 2, "Analog Input[2] needs at least two stage-dependent segments")
        a1_files = sum(validate_segment(seg, f"Analog Input[1] segment {i+1}") for i, seg in enumerate(a1_segments))
        a2_files = sum(validate_segment(seg, f"Analog Input[2] segment {i+1}") for i, seg in enumerate(a2_segments))
        need(a1_files <= TOTAL_FILES and a2_files <= TOTAL_FILES, "analogue segment coverage cannot exceed delivered files")
        need(len({seg["physicalSignal"] for seg in a2_segments}) >= 2, "Analog Input[2] must preserve its source-defined changing physical purpose")
        segment_count = len(a1_segments) + len(a2_segments)
        need(mapped > 0, "resolved clarification must map at least one delivered cycle file")
    else:
        need(hyd.get("engineeringUnit") is None and hyd.get("sourceEvidence") is None, "pending hydraulic-pressure definition must remain unresolved")
        need(screw.get("engineeringUnit") is None and screw.get("sourceEvidence") is None, "pending screw-position definition must remain unresolved")
        need(a1.get("mappingType") is None and (a1.get("segments") or []) == [], "pending Analog Input[1] must remain unresolved")
        need((a2.get("segments") or []) == [], "pending Analog Input[2] must not invent stage mappings")
        need(mapped == 0 and excluded == TOTAL_FILES, "pending clarification must keep all cycle files explicitly non-counting")

    return {
        "status": status,
        "promotionReady": resolved,
        "mappedCycleFiles": mapped,
        "explicitlyExcludedCycleFiles": excluded,
        "sourceDefinedAnalogueSegments": segment_count,
        "rawValuesEmitted": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=Path("data/impure-pascoe-author-response-template-v1.json"))
    parser.add_argument("--require-resolved", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    report = validate(data, args.require_resolved)
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"ImPure/PASCOE clarification: {report['status']} (promotionReady={str(report['promotionReady']).lower()})")


if __name__ == "__main__":
    main()
