from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / ".github" / "workflows" / "pages.yml"
DEPENDABOT = ROOT / ".github" / "dependabot.yml"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


pages = PAGES.read_text(encoding="utf-8")
dependabot = DEPENDABOT.read_text(encoding="utf-8")

expected = {
    "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    "actions/upload-pages-artifact": "fc324d3547104276b827a68afc52ff2a11cc49c9",
    "actions/configure-pages": "45bfe0192ca1faeb007ade9deae92b16b8254a0d",
    "actions/deploy-pages": "368f82528645a54fb793d4d04e342629a3f51346",
}
for action, sha in expected.items():
    need(f"{action}@{sha}" in pages, f"critical Pages action must be pinned to reviewed commit: {action}")

for match in re.finditer(r"uses:\s+([^\s#]+)", pages):
    ref = match.group(1)
    if ref.startswith("actions/"):
        need(re.search(r"@[0-9a-f]{40}$", ref) is not None, f"mutable GitHub Action reference in Pages release workflow: {ref}")

for stale in (
    "actions/checkout@v7",
    "actions/upload-pages-artifact@v4",
    "actions/configure-pages@v5",
    "actions/deploy-pages@v4",
    "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
):
    need(stale not in pages, f"stale or mutable Pages action reference returned: {stale}")

for marker in (
    'package-ecosystem: "github-actions"',
    'directory: "/"',
    'package-ecosystem: "npm"',
    'directory: "/desktop/electron"',
    'interval: "weekly"',
):
    need(marker in dependabot, f"Dependabot maintenance coverage missing: {marker}")

print("MouldMaster release supply-chain QA passed (critical Pages Actions SHA-pinned on Node-24-capable releases; GitHub Actions and desktop npm updates governed by Dependabot)")
