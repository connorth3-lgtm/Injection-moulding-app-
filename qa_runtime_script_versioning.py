#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def need(ok, message):
    if not ok:
        raise AssertionError(message)

index = text("index.html")
compat = text("book-runtime.js")
reading = text("reading-patch.js")
bootstrap = text("src/domains/domain-bootstrap.js")
shell = text("src/domains/shell/app-shell-finalize.js")
a11y = text("src/domains/shell/accessibility-loader.js")
analytics = text("src/domains/learning/learning-analytics-loader.js")
learning_pack = text("src/domains/runtime-packs/learning-foundation-runtime-pack.js")
shell_pack = text("src/domains/runtime-packs/shell-finalization-runtime-pack.js")

for marker in (
    "function runtimeScriptUrl(value)",
    "window.MM_RUNTIME_SCRIPT_URL=runtimeScriptUrl",
    "url.origin!==location.origin",
    "url.pathname.endsWith('.js')",
    "url.searchParams.set('v',version)",
):
    need(marker in index, f"bootstrap runtime-script helper missing: {marker}")

need(
    index.index("window.MM_RUNTIME_SCRIPT_URL=runtimeScriptUrl")
    < index.index("await installDocument(html)"),
    "runtime-script helper must be installed before prepared runtime scripts execute",
)

for forbidden in (
    "__MM_RELEASE_SCRIPT_VERSIONER__",
    "HTMLScriptElement?.prototype",
    "Object.defineProperty(proto,'src'",
):
    need(forbidden not in compat, f"global script prototype interception returned: {forbidden}")

need(
    "runtimeScriptUrl('./src/domains/learning/book-runtime.js')" in compat,
    "Book canonical runtime loader is not explicitly release-versioned",
)
for marker in (
    "MM_RUNTIME_SCRIPT_URL?.('./read-aloud.js')",
    "MM_RUNTIME_SCRIPT_URL?.('./book-runtime.js')",
):
    need(marker in reading, f"learning foundation dynamic loader is not release-versioned: {marker}")

for marker in (
    "const runtimeScriptUrl=src=>typeof window.MM_RUNTIME_SCRIPT_URL",
    "s.src=runtimeScriptUrl(src)",
    "s.src=runtimeScriptUrl('./primary-learning-practice-hubs.js')",
    "s.src=runtimeScriptUrl('./learner-ux-repair.js')",
):
    need(marker in bootstrap, f"domain bootstrap dynamic loader is not release-versioned: {marker}")

for asset in (
    "./src/domains/governance/production-health.js",
    "./data-integration-runtime.js",
    "./process-data-intelligence-ui.js",
    "./measured-learning-library.js",
    "./lesson-simple-experience.js",
):
    need(
        f"runtimeScriptUrl('{asset}')" in shell,
        f"shell dynamic loader is not release-versioned: {asset}",
    )

need("MM_RUNTIME_SCRIPT_URL==='function'" in a11y, "accessibility loader must prefer shared runtime-script helper")
need("MM_RUNTIME_SCRIPT_URL==='function'" in analytics, "learning analytics loader must prefer shared runtime-script helper")
need("MM_RUNTIME_SCRIPT_URL?.('./book-runtime.js')" in learning_pack, "generated learning pack is stale")
need("runtimeScriptUrl('./data-integration-runtime.js')" in shell_pack, "generated shell finalization pack is stale")

print("PASS: dynamic same-origin scripts use explicit release-version URLs without global HTMLScriptElement interception.")
