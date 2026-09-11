from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / ".github" / "workflows" / "pages.yml"
DESKTOP = ROOT / ".github" / "workflows" / "publish-open-desktop.yml"
STORE = ROOT / ".github" / "workflows" / "microsoft-store-msix.yml"
DEPENDABOT = ROOT / ".github" / "dependabot.yml"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def assert_pinned_actions(label, workflow, expected):
    for action, sha in expected.items():
        need(
            f"{action}@{sha}" in workflow,
            f"{label} action must be pinned to reviewed commit: {action}",
        )
    for match in re.finditer(r"uses:\s+([^\s#]+)", workflow):
        ref = match.group(1)
        if ref.startswith("actions/"):
            need(
                re.search(r"@[0-9a-f]{40}$", ref) is not None,
                f"mutable GitHub Action reference in {label} release workflow: {ref}",
            )


pages = PAGES.read_text(encoding="utf-8")
desktop = DESKTOP.read_text(encoding="utf-8")
store = STORE.read_text(encoding="utf-8")
dependabot = DEPENDABOT.read_text(encoding="utf-8")

assert_pinned_actions(
    "Pages",
    pages,
    {
        "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
        "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
        "actions/upload-pages-artifact": "fc324d3547104276b827a68afc52ff2a11cc49c9",
        "actions/configure-pages": "45bfe0192ca1faeb007ade9deae92b16b8254a0d",
        "actions/deploy-pages": "368f82528645a54fb793d4d04e342629a3f51346",
    },
)
assert_pinned_actions(
    "desktop",
    desktop,
    {
        "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
        "actions/setup-node": "820762786026740c76f36085b0efc47a31fe5020",
        "actions/setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
        "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    },
)
assert_pinned_actions(
    "Microsoft Store",
    store,
    {
        "actions/checkout": "1af3b93b681fe567477e1754c93a5784cc6ff5db",
        "actions/setup-node": "a2b2e8eeba5861535c53431499a2969c938313d2",
        "actions/setup-python": "e213ff1d62d7d1920be3ea5634c005ecc3c7e4a2",
        "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    },
)

for stale in (
    "actions/checkout@v7",
    "actions/upload-pages-artifact@v4",
    "actions/configure-pages@v5",
    "actions/deploy-pages@v4",
    "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
):
    need(stale not in pages, f"stale or mutable Pages action reference returned: {stale}")

need(
    "# Deny by default; only the actual publication job receives write authority.\npermissions: {}" in desktop,
    "desktop publisher must deny token capabilities by default",
)
source_guard = desktop.split("  production-source:", 1)[1].split("\n  detect-desktop-release-change:", 1)[0]
detector = desktop.split("  detect-desktop-release-change:", 1)[1].split("\n  publish-windows:", 1)[0]
publisher = desktop.split("  publish-windows:", 1)[1]
need("contents: read" in source_guard, "desktop production-source guard requires read-only contents access")
need("pull-requests: read" in source_guard, "desktop production-source guard requires PR provenance read access")
need("actions: read" in source_guard, "desktop production-source guard requires workflow evidence read access")
need("contents: write" not in source_guard, "desktop production-source guard must not receive publication authority")
need("tools/verify_production_source.py" in source_guard, "desktop publisher must verify exact merged-PR provenance")
need("--require-native-protection" in source_guard, "desktop publisher must require exact native main protection")
need("needs: production-source" in detector, "desktop release detector must wait for the production-source guard")
need("contents: read" in detector, "desktop release detector requires read-only contents access")
need("contents: write" not in detector, "desktop release detector must not inherit publication authority")
need("contents: write" in publisher, "desktop publication job must receive explicit contents write authority")
need("permissions:" in publisher.split("needs:", 1)[0], "desktop publication permission must be job-scoped")

need("\npermissions:\n  contents: read\n" in store, "Store workflow must default to read-only repository access")
store_source_guard = store.split("  production-source:", 1)[1].split("\n  store-package:", 1)[0]
store_package = store.split("\n  store-package:", 1)[1]
need("contents: read" in store_source_guard, "Store production-source guard requires read-only contents access")
need("pull-requests: read" in store_source_guard, "Store production-source guard requires PR provenance read access")
need("actions: read" in store_source_guard, "Store production-source guard requires workflow evidence read access")
need("contents: write" not in store_source_guard, "Store production-source guard must not receive publication authority")
need("tools/verify_production_source.py" in store_source_guard, "Store packaging must verify exact merged-PR provenance")
need("--require-native-protection" in store_source_guard, "Store packaging must require exact native main protection")
need("needs: production-source" in store_package.split("steps:", 1)[0], "Store packaging must wait for the production-source guard")
need("contents: write" not in store_package, "Store package workflow must not receive repository write authority")

for marker in (
    'package-ecosystem: "github-actions"',
    'directory: "/"',
    'package-ecosystem: "npm"',
    'directory: "/desktop/electron"',
    'interval: "weekly"',
):
    need(marker in dependabot, f"Dependabot maintenance coverage missing: {marker}")

print(
    "MouldMaster release supply-chain QA passed "
    "(critical Pages/desktop/Store Actions SHA-pinned; Node-24-capable Pages releases; "
    "desktop publication and Store packaging are gated by governed merged-main provenance; "
    "GitHub Actions and desktop npm updates governed by Dependabot)"
)
