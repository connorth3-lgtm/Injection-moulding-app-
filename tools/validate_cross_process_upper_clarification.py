#!/usr/bin/env python3
"""Fail-closed validator for authoritative upper-workpiece pressure/state clarification."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

SOURCE_TYPES = {"source-author", "publisher", "source-controlled-documentation", "machine-export-definition"}
ENCODINGS = {"categorical", "bitmask", "flags", "other-source-defined"}
CODES = {"0", "1", "2", "4", "8"}


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate(data: dict, require_resolved: bool = False) -> dict:
    need(data.get("schema") == 1, "clarification schema must be 1")
    need(data.get("datasetId") == "cross-process-chain-17240390", "dataset id drifted")
    need(data.get("streamId") == "upper-workpiece-injection-moulding", "stream id drifted")
    status = data.get("status")
    need(status in {"pending-source-clarification", "resolved-source-defined"}, "unknown clarification status")

    boundary = data.get("promotionBoundary") or {}
    need(boundary.get("pressureActualMayCountOnlyAfterResolvedValidation") is True, "pressure promotion must remain gated")
    need(boundary.get("pressureTargetAlwaysNonCounting") is True, "pressure target must remain non-counting")
    need(boundary.get("stateAlwaysNonCountingAsNumericMeasurement") is True, "state must remain non-counting as a numeric measurement")
    need(boundary.get("noMachineFamilyInference") is True, "machine-family inference must remain forbidden")

    pressure = data.get("pressure") or {}
    target = pressure.get("injection_pressure_target") or {}
    actual = pressure.get("injection_pressure_actual") or {}
    need(target.get("role") == "command", "pressure target must remain a command")
    need(actual.get("role") == "measured-signal", "pressure actual must remain a measured signal")

    state = data.get("state") or {}
    mapping = state.get("mapping") or {}
    need(set(mapping) == CODES, "state mapping must cover exactly codes 0,1,2,4,8")

    resolved = status == "resolved-source-defined"
    if require_resolved:
        need(resolved, "authoritative resolved clarification is required")
    if resolved:
        authority = data.get("authority") or {}
        need(authority.get("sourceType") in SOURCE_TYPES, "resolved clarification needs an authoritative source type")
        need(text(authority.get("sourceReference")), "resolved clarification needs a traceable source reference")
        need(text(authority.get("sourceIdentity")), "resolved clarification needs a source identity")
        need(text(target.get("engineeringUnit")), "pressure target engineering unit is required")
        need(text(target.get("sourceEvidence")), "pressure target source evidence is required")
        need(text(actual.get("engineeringUnit")), "pressure actual engineering unit is required")
        need(text(actual.get("sourceEvidence")), "pressure actual source evidence is required")
        need(state.get("encoding") in ENCODINGS, "source-defined state encoding is required")
        need(text(state.get("sourceEvidence")), "state source evidence is required")
        for code in sorted(CODES, key=int):
            need(text(mapping.get(code)), f"state code {code} meaning is required")
    else:
        need(target.get("engineeringUnit") is None, "pending target unit must remain null")
        need(actual.get("engineeringUnit") is None, "pending actual unit must remain null")
        need(state.get("encoding") is None, "pending state encoding must remain null")
        need(all(mapping.get(code) is None for code in CODES), "pending state meanings must remain null")

    return {
        "status": status,
        "promotionReady": resolved,
        "pressureActualUnit": actual.get("engineeringUnit") if resolved else None,
        "stateCodesDefined": len(CODES) if resolved else 0,
        "rawValuesEmitted": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=Path("data/cross-process-upper-author-response-template-v1.json"))
    parser.add_argument("--require-resolved", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    report = validate(data, args.require_resolved)
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Cross-process upper clarification: {report['status']} (promotionReady={str(report['promotionReady']).lower()})")


if __name__ == "__main__":
    main()
