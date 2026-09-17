#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data" / "health-program-v1.json"
EVENT_CATALOG = ROOT / "data" / "health-event-catalog-v1.json"
DEPENDENCY_INVENTORY = ROOT / "data" / "dependency-maintenance-v1.json"
DOC = ROOT / "docs" / "HEALTH_PROGRAM.md"
REVIEW_TEMPLATE = ROOT / "docs" / "HEALTH_REVIEW_TEMPLATE.md"
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
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    catalog = json.loads(EVENT_CATALOG.read_text(encoding="utf-8"))
    dependency_inventory = json.loads(DEPENDENCY_INVENTORY.read_text(encoding="utf-8"))
    doc = DOC.read_text(encoding="utf-8")
    review_template = REVIEW_TEMPLATE.read_text(encoding="utf-8")

    require(data.get("schemaVersion") == 1, "health program schema mismatch")
    require(data.get("currentWebRelease") == version.get("web_release"), "health program web release drifted from version.json")
    principles = data.get("principles", {})
    require(principles.get("protectedMainRequired") is True, "protected-main boundary missing")
    require(principles.get("failClosedEngineering") is True, "fail-closed engineering boundary missing")
    require(principles.get("externalHoldsAreNotDefects") is True, "external HOLD distinction missing")
    require(principles.get("productionAuthority") == "advisory-only", "production authority boundary changed")
    require(principles.get("automaticMachineControl") is False, "machine-control boundary changed")

    ci = data.get("ci", {})
    require(set(ci.get("failureClasses", [])) == {"product-regression", "infrastructure-failure", "external-evidence-hold"}, "CI failure taxonomy incomplete")
    critical_rows = {row.get("id"): row for row in ci.get("criticalPaths", [])}
    for required in ["backup-import", "process-data-numerics", "process-data-delete", "release-fingerprint", "offline-pwa", "desktop-integrity", "governance-holds"]:
        require(required in critical_rows, f"critical CI path missing: {required}")
    backup_regressions = set(critical_rows["backup-import"].get("regressions", []))
    require({"src/domains/learning/backup-authority-notice.js", "qa_learner_backup_integrity.cjs", "tools/health_restore_drill.py"}.issubset(backup_regressions), "backup integrity regression ownership incomplete")
    require(set(ci.get("historicalDefectRegressions", [])) >= {281, 282, 283, 285, 288, 300, 311}, "historical audit regressions not tracked")

    workflow_text = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / ".github" / "workflows").glob("*.yml"))
    for signal in ci["fastPrTier"]["requiredSignals"] + ci["deepReleaseTier"]["requiredSignals"]:
        require(f"name: {signal}" in workflow_text, f"declared CI signal has no workflow: {signal}")
    require("node qa_learner_backup_integrity.cjs" in workflow_text, "backup integrity runtime regression is not wired into CI")

    stores = {row["id"]: row for row in data.get("persistence", {}).get("stores", [])}
    require(stores["learner-core"]["identity"] == "mouldmasterProDB", "learner source-of-truth key mismatch")
    require(stores["engineering-cases"]["identity"] == "mouldmaster-engineering-v2" and stores["engineering-cases"]["version"] == 2, "engineering DB inventory mismatch")
    require(stores["process-data"]["identity"] == "mouldmaster-process-data-v1" and stores["process-data"]["version"] == 1, "process-data DB inventory mismatch")
    require(stores["production-health"]["retentionMaxEvents"] == 120, "diagnostic retention inventory mismatch")
    backup = data["persistence"]["learnerBackupContract"]
    require(backup["maxBytes"] == 10 * 1024 * 1024 and backup["maxLearners"] == 500, "learner backup bounds mismatch")
    require(backup["commitAfterFullValidation"] is True and backup["failurePreservesExistingData"] is True, "restore last-known-good rules missing")
    require(backup.get("format") == "mouldmaster-backup-v3" and backup.get("payloadFormat") == "mouldmaster-backup-v2", "learner backup format contract mismatch")
    integrity = backup.get("integrity", {})
    require(integrity.get("algorithm") == "SHA-256", "learner backup SHA-256 contract missing")
    require(integrity.get("canonicalization") == "json-stable-v1" and integrity.get("scope") == "backupFormat+payload", "learner backup canonical integrity scope mismatch")
    require(integrity.get("verifiedBeforeRestore") is True and integrity.get("detectsCorruptionOrModification") is True, "learner backup verify-before-restore boundary missing")
    require(integrity.get("provesAuthenticity") is False, "learner backup checksum must not be represented as authentication/signature")
    legacy = backup.get("legacyCompatibility", {})
    require(legacy.get("format") == "mouldmaster-backup-v2" and legacy.get("integrityStatus") == "unverified", "legacy backup compatibility status is not explicit")
    require(legacy.get("requiresExplicitUserDisclosure") is True and legacy.get("usesExistingStrictImporter") is True, "legacy backup compatibility boundary incomplete")

    backup_runtime = (ROOT / "src" / "domains" / "learning" / "backup-authority-notice.js").read_text(encoding="utf-8")
    for marker in [
        "const BACKUP_FORMAT='mouldmaster-backup-v3'",
        "const INTEGRITY_ALGORITHM='SHA-256'",
        "const CANONICALIZATION='json-stable-v1'",
        "await verifyEnvelope(parsed)",
        "MM_BACKUP_INTEGRITY_MISMATCH",
        "checksum is not a digital signature",
        "no cryptographic integrity checksum",
    ]:
        require(marker in backup_runtime, f"backup integrity runtime marker missing: {marker}")
    require(backup_runtime.index("await verifyEnvelope(parsed)") < backup_runtime.index("baseImportData(new Blob"), "backup payload can reach restore before SHA-256 verification")

    health_runtime = (ROOT / "production-health.js").read_text(encoding="utf-8")
    require("MAX_EVENTS=120" in health_runtime, "runtime diagnostic bound drifted")
    runtime_kinds = ["runtime_error", "promise_error", "resource_error", "offline", "online", "sw_update_found", "sw_installed", "sw_redundant", "sw_controller_change", "deployment_ok", "deployment_mismatch", "deployment_unreachable"]
    for kind in runtime_kinds:
        require(kind in health_runtime, f"runtime observability signal missing: {kind}")
    require("raw process data" in health_runtime and "No learner identity" in health_runtime, "observability privacy boundary drifted")

    event_rows = catalog.get("events", [])
    event_codes = {row.get("code") for row in event_rows}
    require(set(runtime_kinds).issubset(event_codes), "stable event catalog does not cover current runtime signals")
    require({"external-evidence-hold", "governance-stuck-orphan"}.issubset(event_codes), "governance health codes missing")
    for row in event_rows:
        require(row.get("class") in {"ok", "degraded", "blocked", "failed"}, f"invalid health class for {row.get('code')}")
        require(len(str(row.get("human") or "")) >= 30, f"human diagnostic explanation missing for {row.get('code')}")
    require("raw learner/process values" in catalog.get("privacy", ""), "diagnostic catalog privacy boundary missing")

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
    require((ROOT / "desktop" / "electron" / "package-lock.json").exists(), "desktop dependency lock missing")
    require(dependency_inventory.get("reviewBy"), "critical dependency review deadline missing")
    require(len(dependency_inventory.get("components", [])) >= 5, "critical dependency inventory incomplete")

    indicator_ids = {row["id"] for row in data.get("indicators", [])}
    for required in ["required-pr-gates", "flaky-required-gates", "critical-defects", "backup-restore-recency", "release-recovery-recency", "stuck-orphan", "external-validation"]:
        require(required in indicator_ids, f"health indicator missing: {required}")

    for phrase in [
        "A red product check is a product failure until investigated",
        "failed import must leave the previous database intact",
        "Current exports use `mouldmaster-backup-v3`",
        "verified **before** handing an isolated payload Blob",
        "not a digital signature or authenticity proof",
        "legacy-unverified",
        "HOLD is not a runtime failure",
        "Do not mutate an already governed release",
        "Automated dependency PRs are review-only",
        "Metrics must never improve merely because checks were deleted, weakened or reclassified",
    ]:
        require(phrase in doc, f"health documentation boundary missing: {phrase}")

    for phrase in [
        "Any flaky required gate has its own GitHub issue and owner",
        "node qa_learner_backup_integrity.cjs",
        "not a digital signature or authenticity proof",
        "Every overdue recovery, security or dependency action must have a GitHub issue",
        "No required gate was deleted or weakened to improve a metric",
        "External validation state",
    ]:
        require(phrase in review_template, f"periodic health review template incomplete: {phrase}")

    restore = load_tool("health_restore_drill", ROOT / "tools" / "health_restore_drill.py")
    result = restore.run_drill()
    restore_keys = [
        "learnerV3IntegrityRestore",
        "tamperAndMetadataRejection",
        "invalidRestorePreservesLastKnownGood",
        "legacyV2CompatibilityExplicitlyUnverified",
        "engineeringMigration",
        "engineeringMigrationReplay",
        "processDataResetContract",
    ]
    require(all(result.get(key) == "pass" for key in restore_keys), "restore drill failed")

    operations_drill = load_tool("health_operations_drill", ROOT / "tools" / "health_operations_drill.py")
    operations_drill.main()

    stuck = load_tool("health_stuck_state", ROOT / "qa_health_stuck_state.py")
    blocked = stuck.classify_public_binding(state="hold", binding_exists=True, exit_condition="real external evidence")
    failed = stuck.classify_public_binding(state="in-progress", binding_exists=True, exit_condition="real external evidence")
    require(blocked.health == "blocked" and failed.health == "failed", "health-state classifier does not distinguish HOLD from stuck")

    renderer = load_tool("render_health_status", ROOT / "tools" / "render_health_status.py")
    rendered = renderer.render()
    require(STATUS.read_text(encoding="utf-8") == rendered, "HEALTH_STATUS.md is stale")
    for state in ["**OK**", "**DEGRADED**", "**BLOCKED / HOLD**", "**FAILED / STUCK**"]:
        require(state in rendered, f"generated health surface is missing state {state}")

    governance_qa = (ROOT / "qa_governance_orphan_detection.py").read_text(encoding="utf-8")
    require("orphan" in governance_qa.lower() and "hold" in governance_qa.lower(), "canonical stuck/orphan HOLD distinction missing")

    print("MouldMaster long-term health program QA passed: CI risk tiers, v3 SHA-256 learner-backup integrity, persistent-data ownership, stable diagnostic codes, four-state health surface, synthetic restore/recovery/stuck drills, dependency policy, review template and HOLD boundaries.")


if __name__ == "__main__":
    main()
