#!/usr/bin/env python3
"""Require main-release contract checks to execute on preview PRs before main promotion.

This intentionally does NOT enable main-only publishing or push deployments on
preview. It ensures that previously late main-protection failures are surfaced
while corrections can still be merged safely into preview.
"""
from pathlib import Path

ROOT=Path(__file__).resolve().parent
WORKFLOWS=(
    ".github/workflows/pwa-physical-device-contract.yml",
    ".github/workflows/deep-audit-governance.yml",
    ".github/workflows/release-external-validation.yml",
)

def validate(text, path):
    section=text.split("\npull_request:\n",1)
    if len(section)!=2:
        raise AssertionError(f"{path}: missing pull_request release-readiness trigger")
    head=section[1].split("\n",3)[:3]
    joined="\n".join(head)
    if "main" not in joined or "preview" not in joined:
        raise AssertionError(f"{path}: preflight must cover both preview and main PRs")
    # Never broaden main push/publish jobs to preview.
    push=text.split("\n  push:\n",1)
    if len(push)==2 and "preview" in push[1].split("\n  pull_request:\n",1)[0]:
        raise AssertionError(f"{path}: main-only push behavior broadened to preview")
    for marker in ("github.event.pull_request.head.sha || github.sha",):
        if marker not in text and "deep-audit-governance.yml" not in path:
            raise AssertionError(f"{path}: must inspect exact PR head")

def main():
    for path in WORKFLOWS:
        text=(ROOT/path).read_text(encoding="utf-8")
        # Trigger indentation is YAML's top-level on: pull_request: block.
        fixed=text.replace("\n  pull_request:\n","\npull_request:\n",1)
        validate(fixed,path)
    print("All three main-release preflight workflows validate PRs to preview and main, with main-only push scope intact.")

if __name__=="__main__":
    main()
