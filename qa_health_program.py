#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data" / "health-program-v1.json"
DOC = ROOT / "docs" / "HEALTH_PROGRAM.md"
STATUS = ROOT / "HEALTH_STATUS.md"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_tool(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    require(spec is not None and spec.loader is not None, f"could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    data = json.loads(CONTRACT.read_text(encoding="utf-8"))
    doc = DOC.read_text(encoding="utf-8")

    require(data.get("schemaVersion") == 1, "health program schema mismatch")
    principles = data.get("principles", {})
    require(principles.get("protectedMainRequired") is True, "protected-main boundary missing")
    require(principles.get("failClosedEngineering") is True, "fail-closed engineering boundary missing")
    require(principles.get("externalHoldsAreNotDefects") is True, "external HOLD distinction missing")
    require(principles.get("productionAuthority") == "advisory-only", "production authority boundary changed")
    require(principles.get("automaticMachineControl") is False, "machine-control boundary changed")

    ci = data.get("ci", {})
    require(set(ci.get("failureClasses", [])) == {"product-regression", "infrastructure-failure", "external-evidence-hold"}, "CI failure taxonomy incomplete")
    critical_ids = {row.get("id") for row in ci.get("criticalPaths", [])}
    for required in ["backup-import", "process-data-numerics", "process-data-delete", "release-fingerprint", "offline-pwa", "desktop-integrity", "governance-holds"]:
        require(required in critical_ids, f"critical CI path missing: {required}")
    require(set(ci.get("historicalDefectRegressions", [])) >= {281, 282, 283, 285, 288, 300}, "historical audit regressions not tracked")

    workflow_text = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / ".github" / "workflows").glob("*.yml"))
    for signal in ci["fastPrTier"]["requiredSignals"] + ci["deepReleaseTier"]["requiredSignals"]:
        require(f"name: {signal}" in workflow_text, f"declared CI signal has no workflow: {signal}")

    stores = {row["id"]: row for row in data.get("persistence", {}).get("stores", [])}
    require(stores["learner-core"]["identity"] == "mouldmasterProDB", "learner source-of-truth key mismatch")
    require(stores["engineering-cases"]["identity"] == "mouldmaster-engineering-v2" and stores["engineering-cases"]["version"] == 2, "engineering DB inventory mismatch")
    require(stores["process-data"]["identity"] == "mouldmaster-process-data-v1" and stores["process-data"]["version"] == 1, "process-data DB inventory mismatch")
    require(stores["production-health"]["retentionMaxEvents"] == 120, "diagnostic retention inventory mismatch")
    backup = data["persistence"]["learnerBackupContract"]
    require(backup["maxBytes"] == 10 * 1024 * 1024 and backup["maxLearners"] == 500, "learner backup bounds mismatch")
    require(backup["commitAfterFullValidation"] is True and backup["failurePreservesExistingData"] is True, "restore last-known-good rules missing")

    health_runtime = (ROOT / "production-health.js").read_text(encoding="utf-8")
    require("MAX_EVENTS=120" in health_runtime, "runtime diagnostic bound drifted")
    for kind in ["runtime_error", "promise_error", "resource_error", "deployment_mismatch", "deployment_unreachable"]:
        require(kind in health_runtime, f"runtime observability signal missing: {kind}")
    require("raw process data" in health_runtime and "No learner identity" in health_runtime, "observability privacy boundary drifted")

    operations = data.get("operations", {})
    require({row["id"] for row in operations.get("lanes", [])} == {"web-pwa", "open-desktop", "frozen-recovery"}, "release lane inventory incomplete")
    for stop in ["release-fingerprint-mismatch", "unverified-data-restore", "critical-security-integrity-failure", "governance-state-contradiction"]:
        require(stop in operations.get("stopConditions", []), f"incident stop condition missing: {stop}")

    maintenance = data.get("maintenance", {})
    require(maintenance.get("supportedAutomationBaseline") == {"node": "22", "python": "3.12"}, "automation baseline mismatch")
    cadence = maintenance.get("cadenceDays", {})
    require(all(1 <= int(v) <= 90 for v in cadence.values()), "maintenance cadence must stay bounded to 90 days")
    exceptions = maintenance.get("exceptions", {})
    require(exceptions.get("mustHaveOwner") is True and exceptions.get("mustHaveExpiry") is True and exceptions.get("mustNotDisableRequiredGates") is True, "security exception controls incomplete")
    require((ROOT / "package-lock.json").exists(), "dependency lock missing")

    indicator_ids = {row["id"] for row in data.get("indicators", [])}
    for required in ["required-pr-gates", "flaky-required-gates", "critical-defects", "backup-restore-recency", "release-recovery-recency", "stuck-orphan", "external-validation"]:
        require(required in indicator_ids, f"health indicator missing: {required}")

    for phrase in [
        "A red product check is a product failure until investigated",
        "failed import must leave the previous database intact",
        "HOLD is not a runtime failure",
        "do not mutate an already governed release",
        "Automated dependency PRs are review-only",
        "Metrics must never improve merely because checks were deleted, weakened or reclassified",
    ]:
        require(phrase in doc, f"health documentation boundary missing: {phrase}")

    restore = load_tool("health_restore_drill", ROOT / "tools" / "health_restore_drill.py")
    result = restore.run_drill()
    require(all(result[key] == "pass" for key in ["learnerRestore", "invalidRestorePreservesLastKnownGood", "engineeringMigration", "engineeringMigrationReplay", "processDataResetContract"]), "restore drill failed")

    operations_drill = load_tool("health_operations_drill", ROOT / "tools" / "health_operations_drill.py")
    operations_drill.main()

    renderer = load_tool("render_health_status", ROOT / "tools" / "render_health_status.py")
    require(STATUS.read_text(encoding="utf-8") == renderer.render(), "HEALTH_STATUS.md is stale")

    governance_qa = (ROOT / "qa_governance_orphan_detection.py").read_text(encoding="utf-8")
    require("orphan" in governance_qa.lower() and "hold" in governance_qa.lower(), "canonical stuck/orphan HOLD distinction missing")

    print("MouldMaster long-term health program QA passed: CI risk tiers, persistent-data ownership, synthetic restore/recovery drills, operations, dependency/security policy, health indicators and HOLD boundaries.")


if __name__ == "__main__":
    main()
