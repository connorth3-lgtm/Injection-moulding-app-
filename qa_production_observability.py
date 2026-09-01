#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster local production observability."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = "2026.09.01.1"
RUNTIME_TOKEN = "20260901.17-maturity-hardening-v2"
CACHE_REVISION = "maturity-hardening-v2-20260901"


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


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

require(f'RUNTIME_ASSET_VERSION="{RUNTIME_TOKEN}"' in index, "Browser runtime token was not advanced for maturity hardening")
require("['./production-health.js','<script src=\"./production-health.js\">']" in index,
        "Browser runtime does not load production health before learner modules")
require(index.index("'./production-health.js'") < index.index("'./reading-patch.js'"),
        "Production health must load before learner runtime modules")
require(f"CACHE_REVISION='{CACHE_REVISION}'" in worker, "Service-worker maturity cache revision mismatch")
require(f'EXPECTED_STATIC_CACHE="mouldmaster-static-2026.08.26.2-{CACHE_REVISION}"' in index,
        "Bootstrap expected cache does not match maturity service-worker cache")
require("Promise.allSettled" in worker and "await caches.delete(STATIC_CACHE)" in worker,
        "Observability must coexist with fail-closed service-worker install rather than a partially active cache")
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

print(f"Production observability QA passed: local-only diagnostics {VERSION}, safe learner issue loop, coherent maturity browser/PWA cache identity, deployment/update/error probes, desktop/PWA coverage.")