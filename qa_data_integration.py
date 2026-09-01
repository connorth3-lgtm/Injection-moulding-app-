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
    runtime = (ROOT / "data-integration-runtime.js").read_text(encoding="utf-8")
    intelligence_ui = (ROOT / "process-data-intelligence-ui.js").read_text(encoding="utf-8")
    shell = (ROOT / "app-shell-finalize.js").read_text(encoding="utf-8")
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    builder = (ROOT / "tools/build_pages_artifact.py").read_text(encoding="utf-8")

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
        "process_case_linked",
        "data-pdi-launch",
        "current-data-manifest.json",
        "process-data-semantic-registry.json",
    ]
    for token in required_runtime_tokens:
        require(token in runtime, f"connected runtime missing required behavior: {token}")

    require("script.src='./data-integration-runtime.js'" in shell, "app shell must load connected data runtime")
    require("ui.src='./process-data-intelligence-ui.js'" in shell, "app shell must load process intelligence UI")
    require("'./data-integration-runtime.js'" in worker, "connected runtime must be a published worker asset")
    require("'./process-data-intelligence-ui.js'" in worker, "process intelligence UI must be a published worker asset")
    require("'./process-data-semantic-registry.json'" in worker, "semantic registry must be a published worker asset")
    require("'./current-data-manifest.json'" in worker, "current-data manifest must be a published worker asset")

    core = re.search(r"const\s+CORE\s*=\s*\[(.*?)\]\s*;", worker, re.S)
    optional = re.search(r"const\s+OPTIONAL\s*=\s*\[(.*?)\]\s*;", worker, re.S)
    require(core is not None and optional is not None, "service worker must split CORE and OPTIONAL assets")
    core_assets = set(re.findall(r"['\"]\./([^'\"]+)['\"]", core.group(1)))
    optional_assets = set(re.findall(r"['\"]\./([^'\"]+)['\"]", optional.group(1)))
    require(not (core_assets & optional_assets), "service-worker core and optional assets must not overlap")
    require("reference-20x-extension.js" in optional_assets, "large specialist/reference packs should be on-demand")
    require("data-integration-runtime.js" in core_assets, "connected process-data layer should be available in offline core")
    require("process-data-intelligence-ui.js" in core_assets, "process intelligence UI should be available in offline core")
    require(len(optional_assets) >= 20, "offline split did not materially reduce atomic pre-cache scope")

    for token in [
        "Golden baseline / drift",
        "Before / after intervention",
        "Cavity intelligence",
        "Quality associations",
        "Energy per good part",
        "compareToBaseline",
        "compareWindows",
    ]:
        require(token in intelligence_ui, f"process intelligence UI missing required behavior: {token}")

    require("extract_service_worker_assets" in builder, "Pages builder must publish both core and on-demand worker assets")
    require("on_demand_assets" in builder and "precache_assets" in builder, "Pages manifest must expose cache policy")
    require("FORBIDDEN_PREFIXES" in builder and '"data/"' in builder, "raw governed data must remain excluded from public Pages artifact")

    print(
        "Connected process-data QA passed: "
        f"{effective['inventoriedMeasuredSources']} inventoried sources, "
        f"{effective['fullyProfiledMeasuredFamilies']} profiled families, "
        f"{effective['acceptedInjectionProcessTimeSeriesValues']:,} accepted time-series values; "
        f"{len(core_assets)} offline-core assets and {len(optional_assets)} on-demand assets."
    )


if __name__ == "__main__":
    main()
