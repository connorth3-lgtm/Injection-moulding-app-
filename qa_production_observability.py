#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster local production observability."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = "2026.09.01.1"


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def js_const(source: str, name: str) -> str:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]", source)
    require(match is not None, f"Missing JavaScript constant: {name}")
    return match.group(1)


health = text("production-health.js")
index = text("index.html")
support = text("support.html")
privacy = text("privacy.html")
finalize = text("app-shell-finalize.js")
worker = text("service-worker.js")
package = text("desktop/electron/package.json")
integrity = text("desktop/electron/scripts/generate-integrity.cjs")
issue_template = text(".github/ISSUE_TEMPLATE/learner-problem.yml")
priority = text(".github/LEARNER_PROBLEM_PRIORITY.md")
versions = json.loads(text("version.json"))

require(f"const VERSION='{VERSION}'" in health, "Production-health version mismatch")
require("mm_production_health_v1" in health, "Local production-health storage key missing")
require("MAX_EVENTS=120" in health, "Production-health event bound missing")
require("deployment.json" in health and "pages-manifest.json" in health and "service-worker.js" in health,
        "Deployment coherence probes are incomplete")
require("window.addEventListener('error'" in health, "Runtime error capture missing")
require("unhandledrejection" in health, "Unhandled-promise capture missing")
require("resource_error" in health, "Resource-load failure capture missing")
require("sw_update_found" in health and "sw_controller_change" in health, "Service-worker update signals missing")
require("copySafeSnapshot" in health and "recent_signals" in health, "Safe diagnostic snapshot API missing")
require("No learner identity" in health and "raw process data" in health and "query strings" in health,
        "Safe snapshot privacy boundary is not explicit")

for forbidden in ("sendBeacon", "XMLHttpRequest", "WebSocket", "EventSource"):
    require(forbidden not in health, f"Forbidden central telemetry API present: {forbidden}")
require(not re.search(r"fetch\s*\(\s*['\"]https?://", health), "Production health must not fetch third-party origins")
require(not re.search(r"method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)['\"]", health, re.I),
        "Production health must not upload diagnostics")

runtime_token = js_const(index, "RUNTIME_ASSET_VERSION")
cache_version = js_const(worker, "CACHE_VERSION")
cache_revision = js_const(worker, "CACHE_REVISION")
expected_static_cache = js_const(index, "EXPECTED_STATIC_CACHE")
require(re.fullmatch(r"\d{8}\.\d+-[a-z0-9-]+", runtime_token) is not None,
        "Browser runtime token must retain dated feature-family format")
runtime_date, runtime_family = runtime_token.split('.', 1)[0], runtime_token.split('-', 1)[1]
require(cache_revision.startswith(runtime_family + "-"),
        "Service-worker cache revision must retain the active runtime feature family")
require(re.search(r"-\d{8}$", cache_revision) is not None,
        "Service-worker cache revision must end with a dated revision token")
require(runtime_date == cache_revision.rsplit("-", 1)[-1],
        "Browser runtime token and service-worker cache revision dates must advance together")
require(expected_static_cache == f"mouldmaster-static-{cache_version}-{cache_revision}",
        "Bootstrap expected cache does not exactly match the service-worker cache identity")
require("['./production-health.js','<script src=\"./production-health.js\">']" in index,
        "Browser runtime does not load production health before learner modules")
require(index.index("'./production-health.js'") < index.index("'./reading-patch.js'"),
        "Production health must load before learner runtime modules")
require("Promise.allSettled" in worker and "await caches.delete(STATIC_CACHE)" in worker,
        "Observability must coexist with fail-closed service-worker install rather than a partially active core cache")
require("production-health.js" in finalize, "App-shell observability fallback loader missing")
require("./production-health.js" in worker, "Production health is missing from the offline/public core")
require("production-health.js" in package, "Desktop package does not include production health diagnostics")
require("production-health.js" in integrity, "Desktop integrity manifest does not hash production health diagnostics")
require(versions.get("production_observability_version") == VERSION, "version.json observability version mismatch")

for marker in ("mmHealthStatus", "mmHealthRun", "mmHealthCopy", "mmHealthClear", "learner-problem.yml", "production-health.js"):
    require(marker in support, f"Support diagnostic/reporting control missing: {marker}")
require("Production health diagnostics" in privacy, "Privacy notice lacks production-health section")
require("does not automatically upload" in privacy, "Privacy notice must state diagnostics are not automatically uploaded")
require("learner names" in privacy.lower() and "raw process-data" in privacy.lower(),
        "Privacy notice does not preserve learner/process-data exclusions")

require("Real learner problem priority" in priority, "Learner problem priority policy missing")
for marker in ("Safety or technical correctness", "Blocked learner journey", "Repeated learner friction", "Feature request"):
    require(marker in priority, f"Learner problem priority tier missing: {marker}")
require("Learner problem" in issue_template and "Safe diagnostics" in issue_template,
        "Learner issue template is incomplete")
require("Do not include" in issue_template, "Learner issue template lacks privacy warning")

print(
    "Production observability QA passed: "
    f"local-only diagnostics {VERSION}, safe learner issue loop, coherent runtime {runtime_token} / "
    f"cache {cache_version}-{cache_revision}, deployment/update/error probes, desktop/PWA coverage."
)
