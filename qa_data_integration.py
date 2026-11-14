#!/usr/bin/env python3
"""QA for MouldMaster connected process-data architecture."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    manifest = json.loads((ROOT / "current-data-manifest.json").read_text(encoding="utf-8"))
    closeout = json.loads((ROOT / "data/measured-data-collection-closeout-2026-08-30.json").read_text(encoding="utf-8"))
    registry = json.loads((ROOT / "process-data-semantic-registry.json").read_text(encoding="utf-8"))
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    runtime_manifest = json.loads((ROOT / "runtime-domain-manifest.json").read_text(encoding="utf-8"))
    runtime = (ROOT / "data-integration-runtime.js").read_text(encoding="utf-8")
    runtime_pack = (ROOT / "src/domains/runtime-packs/process-data-runtime-pack.js").read_text(encoding="utf-8")
    statistics = (ROOT / "process-data-statistics.js").read_text(encoding="utf-8")
    integrity = (ROOT / "src/domains/process/process-data-integrity.js").read_text(encoding="utf-8")
    shell = (ROOT / "src/domains/shell/app-shell-finalize.js").read_text(encoding="utf-8")
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    builder = (ROOT / "tools/build_pages_artifact.py").read_text(encoding="utf-8")
    desktop_pkg = json.loads((ROOT / "desktop/electron/package.json").read_text(encoding="utf-8"))
    desktop_integrity = (ROOT / "desktop/electron/scripts/generate-integrity.cjs").read_text(encoding="utf-8")

    effective = closeout["canonicalEffectiveState"]
    require(manifest["effectiveMeasuredState"] == effective, "public current-data manifest must match governed effective closeout")
    require(manifest["boundaries"]["unresolvedSemanticsFailClosed"] is True, "unresolved semantics must fail closed")
    require(manifest["boundaries"]["commandsAndSetpointsAreNotMeasuredActuals"] is True, "command/setpoint boundary missing")
    require(manifest["localProcessData"]["storage"] == "IndexedDB", "local process store must be IndexedDB")

    roles = set(registry["roleVocabulary"])
    require({"actual", "setpoint", "command", "state", "quality", "derived", "structural", "unresolved"} <= roles, "semantic role vocabulary incomplete")
    require(registry["channels"]["cooling_time_s"]["role"] == "unresolved", "ambiguous cooling time must not be silently treated as measured actual")
    require(registry["channels"]["shot_index"]["role"] == "structural", "shot index must not be treated as a measurement")
    require(registry["channels"]["dimension_value"]["unit_from_column"] == "dimension_unit", "dynamic dimension unit linkage missing")

    required_runtime_tokens = [
        "indexedDB.open(DB_NAME",
        "semantic-unresolved",
        "analysisReady",
        "savePrepared",
        "createBaseline",
        "compareToBaseline",
        "compareWindows",
        "linkCase",
        "similarCases",
        "process_dataset_saved",
        "function linkCase",
        "deleteAllProcessData",
        "referenceScale",
        "insufficient-reference-observations",
        "zero-reference-spread",
        "insufficient-window-observations",
        "current-data-manifest.json",
        "process-data-semantic-registry.json",
    ]
    for token in required_runtime_tokens:
        require(token in runtime, f"connected runtime missing required behavior: {token}")

    require("data-pdi-launch" not in runtime and "interceptLegacyLauncher" not in runtime, "connected runtime must not intercept a duplicate legacy launcher")
    require(not (ROOT / "process-data-intelligence-ui.js").exists(), "retired duplicate Process Data screen source must be removed")
    require("MM_PROCESS_DATA_STATISTICS" in runtime_pack and "process-data-statistics.