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
    lines = [
        "# MouldMaster health status",
        "",
        f"Baseline review: **{review['date']}**  ",
        f"Source commit: `{review['sourceCommit']}`  ",
        f"Current learner-facing web release: **{data['currentWebRelease']}**",
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
        "Current repository engineering baseline: **OK**. Current external-validation boundary: **BLOCKED / HOLD**.",
        "",
        "## Current baseline",
        "",
        f"- Protected PR evidence: PR #{review['prEvidence']['pr']} — {review['prEvidence']['prTriggeredWorkflows']} PR-triggered workflows — **{review['prEvidence']['result'].upper()}**.",
        f"- External validation: **{review['externalValidation'].upper()}**. This is a governed evidence boundary, not a software defect.",
        f"- Platform-admin immutable-release work: issue **#{review['knownPlatformAdminHold']}** remains external to repository source changes.",
        "- Canonical governance orphan/stuck detection: required by protected health/deep-audit QA.",
        "- Backup/restore drill: deterministic synthetic drill required by protected health QA.",
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
