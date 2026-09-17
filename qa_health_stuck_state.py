#!/usr/bin/env python3
"""Synthetic regression for health-state classification and recovery guidance.

This test never mutates the canonical governance contracts. It proves that a legitimate
external HOLD remains BLOCKED rather than STUCK, while transient/orphaned lifecycle
states fail closed with actionable repair guidance.
"""
from __future__ import annotations

from typing import Mapping, NamedTuple

STABLE = {"pass", "authorized", "hold", "validated", "advisory-only"}
TRANSIENT_PUBLIC = {"pending", "in-progress", "processing", "unknown", "unresolved"}


class HealthDecision(NamedTuple):
    health: str
    code: str
    guidance: str


def classify_public_binding(*, state: str, binding_exists: bool, exit_condition: str | None) -> HealthDecision:
    normalized = str(state or "").strip().lower()
    if not binding_exists:
        return HealthDecision(
            "failed",
            "governance-stuck-orphan",
            "Restore the missing authoritative binding and re-run canonical governance validation; do not relabel the state to PASS.",
        )
    if normalized in TRANSIENT_PUBLIC:
        return HealthDecision(
            "failed",
            "governance-stuck-orphan",
            "Repair the authoritative lifecycle record to a legal stable state with its real exit condition; do not hide or relabel the transient state.",
        )
    if normalized == "hold":
        if not str(exit_condition or "").strip():
            return HealthDecision(
                "failed",
                "governance-stuck-orphan",
                "Add the explicit governed exit condition/required evidence to the authoritative HOLD contract before treating it as owned.",
            )
        return HealthDecision(
            "blocked",
            "external-evidence-hold",
            "Keep the HOLD visible until its named genuine external evidence or authorised action exists; age alone does not make a HOLD stuck.",
        )
    if normalized in STABLE:
        return HealthDecision("ok", "governance-stable", "No lifecycle repair is required.")
    return HealthDecision(
        "failed",
        "governance-stuck-orphan",
        "Resolve the unsupported state in the authoritative lifecycle contract and re-run canonical governance validation.",
    )


def main() -> None:
    cases: Mapping[str, tuple[dict, HealthDecision]] = {
        "genuine-hold": (
            {"state": "hold", "binding_exists": True, "exit_condition": "Complete real NVDA and VoiceOver validation."},
            HealthDecision("blocked", "external-evidence-hold", ""),
        ),
        "orphaned-binding": (
            {"state": "hold", "binding_exists": False, "exit_condition": "Complete evidence."},
            HealthDecision("failed", "governance-stuck-orphan", ""),
        ),
        "transient-public-state": (
            {"state": "in-progress", "binding_exists": True, "exit_condition": "Complete evidence."},
            HealthDecision("failed", "governance-stuck-orphan", ""),
        ),
        "unowned-hold": (
            {"state": "hold", "binding_exists": True, "exit_condition": ""},
            HealthDecision("failed", "governance-stuck-orphan", ""),
        ),
        "stable-authorized": (
            {"state": "authorized", "binding_exists": True, "exit_condition": None},
            HealthDecision("ok", "governance-stable", ""),
        ),
    }

    for name, (inputs, expected) in cases.items():
        result = classify_public_binding(**inputs)
        if result.health != expected.health or result.code != expected.code:
            raise AssertionError(f"{name}: {result} != {expected}")
        if len(result.guidance) < 30:
            raise AssertionError(f"{name}: recovery guidance is missing")
        if result.health == "failed" and "authoritative" not in result.guidance.lower() and "governed" not in result.guidance.lower():
            raise AssertionError(f"{name}: failed state does not direct repair to the governed source")

    hold = classify_public_binding(state="hold", binding_exists=True, exit_condition="Obtain real human evidence")
    if hold.health == "failed" or hold.code == "governance-stuck-orphan":
        raise AssertionError("explicit external HOLD was incorrectly classified as stuck")

    stale = classify_public_binding(state="processing", binding_exists=True, exit_condition="Complete evidence")
    if stale.health != "failed" or stale.code != "governance-stuck-orphan":
        raise AssertionError("synthetic stuck/transient state did not fail closed")

    print("MouldMaster synthetic stuck-state QA passed: legitimate HOLD=blocked; orphan/transient/unowned states=failed with governed recovery guidance")


if __name__ == "__main__":
    main()
