#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data" / "health-program-v1.json"
OUTPUT = ROOT / "HEALTH_STATUS.md"


def render() -> str:
    data = json.loads(CONTRACT.read_text(encoding="utf-8"))
    review = data["baselineReview"]
    cadence = data["maintenance"]["cadenceDays"]
    indicators = data["indicators"]
    current = data["currentStatus"]
    lines = [
        "# MouldMaster health status",
        "",
        f"Historical health-control review: **{review['date']}**  ",
        f"Historical source commit: `{review['sourceCommit']}`  ",
        f"Current governed web candidate: **{data['currentWebRelease']}**",
        "",
        "This file is generated from `data/health-program-v1.json`. It reports engineering/operations health separately from deliberate external-validation HOLDs.",
        "",
        "## Health-state model",
        "",
        "| State | Meaning | Required response |",
        "| --- | --- | --- |",
        "| **OK** | Software-controlled checks and governed bindings are coherent. | Continue normal operation/review cadence. |",
        "| **DEGRADED** | A recoverable operational condition exists, such as offline/unreachable resources, without proven integrity loss. | Preserve state, diagnose the bounded signal, and restore normal service without bypassing gates. |",
        "| **BLOCKED / HOLD** | A deliberate governance boundary is waiting for named external evidence or authorised action. | Keep the HOLD visible until the real exit condition is satisfied; age alone does not make it stuck. |",
        "| **FAILED / STUCK** | Integrity cannot be verified, a canonical binding is missing/contradictory, or a public lifecycle is in an illegal transient state. | Stop promotion/affected workflow, repair the authoritative governed source, and rerun validation. |",
        "",
        f"Current repository engineering baseline: **{current['repositoryEngineering']}**. Current native governance: **{current['governance']}**. Current external-validation boundary: **{current['externalValidation']}**.",
        f"Current block reason: {current['reason']}",
        "",
        "## Historical control baseline",
        "",
        f"- Historical protected PR evidence: PR #{review['prEvidence']['pr']} — {review['prEvidence']['prTriggeredWorkflows']} PR-triggered workflows — **{review['prEvidence']['result'].upper()}**.",
        f"- External validation at that review: **{review['externalValidation'].upper()}**. This remains a governed evidence boundary, not a software defect.",
        f"- Platform-admin immutable-release work: issue **#{review['knownPlatformAdminHold']}** remains external to repository source changes.",
        "- Canonical governance orphan/stuck detection and backup/restore drills remain required controls inherited from this baseline.",
        "",
        "## Current release contract",
        "",
        f"- Current governed web candidate: **{data['currentWebRelease']}**.",
        "- Current release promotion is governed by the declared fast/deep CI tiers and exact-head protected workflows; the historical PR count above is not presented as current-release evidence.",
        f"- Native main governance: **{current['governance']}**. Promotion remains blocked until the live ruleset satisfies the canonical policy.",
        f"- Current external-validation boundary: **{review['externalValidation'].upper()}** until genuine release-bound human/device/platform evidence satisfies the governed exit conditions.",
        "",
        "## Indicators",
        "",
        "| Indicator | Healthy interpretation | Failure condition |",
        "| --- | --- | --- |",
    ]
    for item in indicators:
        lines.append(f"| `{item['id']}` | {item['healthy']} | {item['failure']} |")
    lines += [
        "",
        "## Maintenance cadence",
        "",
        f"Dependency review: **{cadence['dependencyReview']} days**; security review: **{cadence['securityReview']} days**; backup/restore drill: **{cadence['backupRestoreDrill']} days**; release/recovery drill: **{cadence['releaseRecoveryDrill']} days**; health review: **{cadence['healthReview']} days**.",
        "",
        "## Boundaries",
        "",
        "A truthful HOLD for physical-device, assistive-technology, independent human SME, learner-outcome, signed/Store distribution or accreditation evidence must remain HOLD until genuine evidence exists. Health metrics cannot be improved by deleting/weaking required tests or by relabelling a HOLD as PASS.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.check:
        actual = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if actual != expected:
            raise SystemExit("HEALTH_STATUS.md is stale; run tools/render_health_status.py")
        print("MouldMaster generated health status is current")
        return
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()