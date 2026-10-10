#!/usr/bin/env python3
"""Ensure main promotion contract checks run on preview PRs without preview pushes."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKFLOWS = (
    ".github/workflows/pwa-physical-device-contract.yml",
    ".github/workflows/deep-audit-governance.yml",
    ".github/workflows/release-external-validation.yml",
)


def event_branches(text: str, event: str, path: str) -> str:
    marker = f"\n  {event}:\n"
    if marker not in text:
        raise AssertionError(f"{path}: missing {event} event")
    fragment = text.split(marker, 1)[1]
    for line in fragment.splitlines():
        # A sibling "on:" event begins at two spaces; its branches are below.
        if line.startswith("  ") and not line.startswith("    "):
            break
        if line.startswith("    branches:"):
            return line.strip()
    raise AssertionError(f"{path}: {event} requires explicit branch filtering")


def validate(text: str, path: str) -> None:
    pull = event_branches(text, "pull_request", path)
    if "main" not in pull or "preview" not in pull:
        raise AssertionError(f"{path}: PR preflight must include main and preview")
    push = event_branches(text, "push", path)
    if "main" not in push or "preview" in push:
        raise AssertionError(f"{path}: only protected main pushes may run this workflow")
    if "pull_request.head.sha || github.sha" not in text:
        raise AssertionError(f"{path}: must inspect the exact pull request head")


def main() -> None:
    for path in WORKFLOWS:
        data = (ROOT / path).read_text(encoding="utf-8")
        validate(data, path)
        # Test both YAML formatting variants without treating pull-request
        # branches as push branches (the original false positive).
        unsafe = data.replace("\n  push:\n    branches: [main]",
                              "\n  push:\n    branches: [main, preview]", 1)
        unsafe = unsafe.replace("\n  push:\n    branches: [ main ]",
                                "\n  push:\n    branches: [ main, preview ]", 1)
        if unsafe == data:
            raise AssertionError(f"{path}: could not inspect protected push trigger")
        try:
            validate(unsafe, path)
        except AssertionError:
            pass
        else:
            raise AssertionError(f"{path}: unsafe preview pushes passed")

        missing = data.replace("\n  pull_request:\n    branches: [main, preview]",
                               "\n  pull_request:\n    branches: [main]", 1)
        missing = missing.replace("\n  pull_request:\n    branches: [ main, preview ]",
                                  "\n  pull_request:\n    branches: [ main ]", 1)
        if missing == data:
            raise AssertionError(f"{path}: could not inspect preview PR trigger")
        try:
            validate(missing, path)
        except AssertionError:
            pass
        else:
            raise AssertionError(f"{path}: missing preview preflight passed")
    print("Three main-release readiness workflows preflight preview/main PRs with main-only pushes.")


if __name__ == "__main__":
    main()
