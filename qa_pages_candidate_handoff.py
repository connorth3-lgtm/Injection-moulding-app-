from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKFLOW = ROOT / ".github" / "workflows" / "pages.yml"
workflow = WORKFLOW.read_text(encoding="utf-8")


def need(ok, message):
    if not ok:
        raise AssertionError(message)


stage_name = "      - name: Stage protected-main physical-device test candidate"
upload_name = "      - name: Retain protected-main physical-device test candidate"
hold_name = "      - name: Build release-hold Pages artifact"
need(stage_name in workflow, "protected-main physical candidate staging step is missing")
need(upload_name in workflow, "protected-main physical candidate retention step is missing")
need(hold_name in workflow, "release-hold build step is missing")
need(workflow.index(stage_name) < workflow.index(upload_name) < workflow.index(hold_name), "candidate staging/upload must complete before the release-hold artifact is built")

block = workflow.split(stage_name, 1)[1].split(hold_name, 1)[0]
for marker in (
    "cp -a .pages-dist/. physical-pwa-candidate/",
    "source_fp=",
    "staged_fp=",
    'test "$source_fp" = "$staged_fp"',
    "uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
    "name: physical-pwa-candidate-${{ github.sha }}",
    "path: physical-pwa-candidate",
    "retention-days: 30",
    "if-no-files-found: error",
    "include-hidden-files: false",
):
    need(marker in block, f"physical candidate handoff safeguard missing: {marker}")

need("path: .pages-dist\n          retention-days: 30" not in block, "generic artifact uploader must not target dot-prefixed .pages-dist directly")
need("actions/upload-pages-artifact" not in block, "retained physical candidate must remain a generic non-deployable Actions artifact")

print("MouldMaster physical PWA candidate handoff QA passed")
