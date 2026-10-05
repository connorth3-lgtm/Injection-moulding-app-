from pathlib import Path
import re
import shlex

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / ".github" / "workflows" / "pages.yml"
PREVIEW = ROOT / ".github" / "workflows" / "preview-pages.yml"
DESKTOP = ROOT / ".github" / "workflows" / "publish-open-desktop.yml"
DEPENDABOT = ROOT / ".github" / "dependabot.yml"
QUEUED_PROFILE = ROOT / ".github" / "workflows" / "profile-queued-zenodo-data.yml"
LOWER_PROFILE = ROOT / ".github" / "workflows" / "profile-cross-process-lower-workpiece.yml"

WORKFLOW_DIR = ROOT / ".github" / "workflows"


def assert_pinned_workflow_python_dependencies() -> None:
    """Reject bare PyPI package installs in workflow shell commands.

    Exact versions keep benchmark/profile reruns reproducible. Options, local
    paths, requirement/constraint files and explicit URL/VCS references are
    handled separately and are not mistaken for package names.
    """
    value_options = {
        "-r", "--requirement", "-c", "--constraint",
        "--index-url", "--extra-index-url", "--find-links",
    }
    package_re = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*(?:\[[A-Za-z0-9_,.-]+\])?$")
    for path in sorted(WORKFLOW_DIR.glob("*.y*ml")):
        rel = path.relative_to(ROOT).as_posix()
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if "pip install" not in line:
                continue
            tail = line.split("pip install", 1)[1]
            try:
                tokens = shlex.split(tail)
            except ValueError as exc:
                raise AssertionError(f"cannot parse workflow pip install in {rel}:{lineno}: {exc}") from exc
            skip_next = False
            for token in tokens:
                if skip_next:
                    skip_next = False
                    continue
                if token in value_options:
                    skip_next = True
                    continue
                if not token or token == "\\" or token.startswith("-"):
                    continue
                if (
                    "://" in token
                    or token.startswith((".", "/", "$", "git+"))
                    or token.endswith((".txt", ".in", ".lock"))
                ):
                    continue
                if package_re.fullmatch(token):
                    need(
                        "==" in token,
                        f"unpinned workflow Python dependency in {rel}:{lineno}: {token}",
                    )




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
preview = PREVIEW.read_text(encoding="utf-8")
desktop = DESKTOP.read_text(encoding="utf-8")
dependabot = DEPENDABOT.read_text(encoding="utf-8")
queued_profile = QUEUED_PROFILE.read_text(encoding="utf-8")
lower_profile = LOWER_PROFILE.read_text(encoding="utf-8")

assert_pinned_workflow_python_dependencies()

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
    "preview candidate",
    preview,
    {
        "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
        "actions/setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
        "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    },
)
for forbidden in ("actions/deploy-pages@", "actions/upload-pages-artifact@", "pages: write", "id-token: write"):
    need(forbidden not in preview, f"preview candidate must not have live Pages publication authority: {forbidden}")
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
    "queued Zenodo profiler",
    queued_profile,
    {
        "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
        "actions/setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
        "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    },
)
assert_pinned_actions(
    "cross-process lower profiler",
    lower_profile,
    {
        "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
        "actions/setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
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
detector = desktop.split("  detect-desktop-release-change:", 1)[1].split("\n  build-windows-release:", 1)[0]
builder = desktop.split("  build-windows-release:", 1)[1].split("\n  publish-release:", 1)[0]
publisher = desktop.split("  publish-release:", 1)[1]
need("contents: read" in source_guard, "desktop production-source guard requires read-only contents access")
need("pull-requests: read" in source_guard, "desktop production-source guard requires PR provenance read access")
need("actions: read" in source_guard, "desktop production-source guard requires workflow evidence read access")
need("contents: write" not in source_guard, "desktop production-source guard must not receive publication authority")
need("tools/verify_production_source.py" in source_guard, "desktop publisher must verify exact merged-PR provenance")
need("--require-native-protection" in source_guard, "desktop publisher must require exact native main protection")
need("needs: production-source" in detector, "desktop release detector must wait for the production-source guard")
need("contents: read" in detector and "contents: write" not in detector, "desktop release detector must remain read-only")
need("contents: read" in builder and "contents: write" not in builder, "desktop build/package job must remain read-only")
need("npm ci --no-audit --fund=false" in builder and "npm run dist:portable" in builder, "desktop read-only build job must perform dependency install and package build")
need("Retain exact staged desktop release handoff" in builder, "desktop read-only build must retain an exact staged handoff artifact")
need("contents: write" in publisher, "desktop publication job must receive explicit contents write authority")
need("pull-requests: read" in publisher and "actions: read" in publisher, "desktop publication job needs read-only provenance evidence access")
need("persist-credentials: false" in publisher, "desktop write-authority checkout must not persist Git credentials")
need("actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c" in publisher, "desktop publisher artifact downloader is not pinned")
need("Verify staged release handoff identity and hashes" in publisher, "desktop publisher must verify staged artifact identity and hashes before mutation")
need("SOURCE_COMMIT.txt" in publisher and "SHA256SUMS.txt" in publisher, "desktop publication handoff lacks exact source/hash verification")
need(
    "Recheck governed current-main source before release write" in publisher,
    "desktop publisher must recheck exact current-main provenance immediately before release mutation",
)
need(
    publisher.index("Verify staged release handoff identity and hashes")
    < publisher.index("Recheck governed current-main source before release write")
    < publisher.index("Publish one-shot release without asset replacement"),
    "desktop handoff verification and current-main recheck must precede release publication",
)
need(
    publisher.count("tools/verify_production_source.py") >= 1 and "--require-native-protection" in publisher,
    "desktop write-authority job must independently enforce native protected-main provenance",
)

for marker in (
    'package-ecosystem: "github-actions"',
    'package-ecosystem: "npm"',
    'directory: "/desktop/electron"',
    'directory: "/desktop/electron/msix-toolchain"',
    'interval: "weekly"',
):
    need(marker in dependabot, f"Dependabot maintenance coverage missing: {marker}")
need(
    'package-ecosystem: "npm"\n    directory: "/"' in dependabot,
    "Dependabot must cover the root browser-QA npm lock",
)
need(
    dependabot.count('package-ecosystem: "npm"') >= 3,
    "Dependabot must cover root browser QA, desktop runtime and isolated MSIX npm packages",
)

print(
    "MouldMaster release supply-chain QA passed "
    "(critical main Pages/preview-candidate/desktop Actions SHA-pinned; preview candidate is non-publishing; Node-24-capable Pages releases; "
    "desktop build/package is read-only and publication uses an exact verified artifact handoff plus governed current-main provenance; "
    "workflow Python benchmark dependencies exact-version pinned; GitHub Actions plus root browser-QA, desktop runtime and isolated MSIX npm updates governed by Dependabot)"
)
