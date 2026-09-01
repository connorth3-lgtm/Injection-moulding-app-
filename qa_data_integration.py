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
    runtime = (ROOT / "data-integration-runtime.js").read_text(encoding="utf-8")
    intelligence_ui = (ROOT / "process-data-intelligence-ui.js").read_text(encoding="utf-8")
    shell = (ROOT / "app-shell-finalize.js").read_text(encoding="utf-8")
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
        "process_case_linked",
        "data-pdi-launch",
        "current-data-manifest.json",
        "process-data-semantic-registry.json",
    ]
    for token in required_runtime_tokens:
        require(token in runtime, f"connected runtime missing required behavior: {token}")

    require("script.src='./data-integration-runtime.js'" in shell, "app shell must load connected data runtime")
    require("ui.src='./process-data-intelligence-ui.js'" in shell, "app shell must load process intelligence UI")
    require("MM_APP_SHELL_FINALIZED='2026.08.26.4'" in shell, "connected data must not change the canonical app-shell compatibility marker")
    require("'./data-integration-runtime.js'" in worker, "connected runtime must be a published worker asset")
    require("'./process-data-intelligence-ui.js'" in worker, "process intelligence UI must be a published worker asset")
    require("'./process-data-semantic-registry.json'" in worker, "semantic registry must be a published worker asset")
    require("'./current-data-manifest.json'" in worker, "current-data manifest must be a published worker asset")
    require(f"CACHE_VERSION='{version['android_release']}'" in worker, "service-worker cache version must stay aligned with the audited Android release")
    cache_version = re.search(r"CACHE_VERSION='([^']+)'", worker)
    cache_revision = re.search(r"CACHE_REVISION='([^']+)'", worker)
    runtime_version = re.search(r'RUNTIME_ASSET_VERSION="([^"]+)"', index)
    require(cache_version is not None and cache_revision is not None and runtime_version is not None, "runtime/cache metadata missing")
    expected_cache = f"mouldmaster-static-{cache_version.group(1)}-{cache_revision.group(1)}"
    require(f'const EXPECTED_STATIC_CACHE="{expected_cache}"' in index, "bootstrap expected cache must match the service-worker cache exactly")
    revision_date = re.search(r"(\d{8})$", cache_revision.group(1))
    require(revision_date is not None and runtime_version.group(1).startswith(revision_date.group(1)), "bootstrap/runtime and worker cache revision dates must match")
    require(runtime_version.group(1).endswith("-maturity-hardening-v2"), "connected-data changes must retain the repository runtime family")
    require(cache_revision.group(1).startswith("maturity-hardening-v2-"), "connected-data changes must retain the repository cache family")

    core = re.search(r"const\s+CORE\s*=\s*\[(.*?)\]\s*;", worker, re.S)
    optional = re.search(r"const\s+OPTIONAL\s*=\s*\[(.*?)\]\s*;", worker, re.S)
    require(core is not None and optional is not None, "service worker must split CORE and OPTIONAL assets")
    core_assets = set(re.findall(r"['\"]\./([^'\"]+)['\"]", core.group(1)))
    optional_assets = set(re.findall(r"['\"]\./([^'\"]+)['\"]", optional.group(1)))
    require(not (core_assets & optional_assets), "service-worker core and optional assets must not overlap")
    require("reference-20x-extension.js" in optional_assets, "large specialist/reference packs should not be part of the atomic offline install")
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
        "if(!dataset.quality?.analysisReady)",
        "includes('blocked')",
    ]:
        require(token in intelligence_ui, f"process intelligence UI missing required behavior: {token}")

    require("extract_service_worker_assets" in builder, "Pages builder must publish both atomic-core and runtime-fetched worker assets")
    require("on_demand_assets" in builder and "precache_assets" in builder, "Pages manifest must expose cache policy")
    require("FORBIDDEN_PREFIXES" in builder and '"data/"' in builder, "raw governed data must remain excluded from public Pages artifact")

    desktop_from = {x.get("from") for x in desktop_pkg["build"]["extraResources"] if isinstance(x, dict)}
    connected_assets = [
        "data-integration-runtime.js",
        "process-data-intelligence-ui.js",
        "process-data-semantic-registry.json",
        "current-data-manifest.json",
    ]
    for asset in connected_assets:
        require(f"../../{asset}" in desktop_from, f"desktop package missing connected data asset: {asset}")
        require(f"'{asset}'" in desktop_integrity, f"desktop integrity set missing connected data asset: {asset}")

    print(
        "Connected process-data QA passed: "
        f"{effective['inventoriedMeasuredSources']} inventoried sources, "
        f"{effective['fullyProfiledMeasuredFamilies']} profiled families, "
        f"{effective['acceptedInjectionProcessTimeSeriesValues']:,} accepted time-series values; "
        f"{len(core_assets)} atomic offline-core assets and {len(optional_assets)} runtime-fetched assets."
    )


if __name__ == "__main__":
    main()
