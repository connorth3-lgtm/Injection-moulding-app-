#!/usr/bin/env python3
"""Ensure main promotion contract checks run on preview PRs without preview pushes."""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
WORKFLOWS = (
    ".github/workflows/pwa-physical-device-contract.yml",
    ".github/workflows/deep-audit-governance.yml",
    ".github/workflows/release-external-validation.yml",
)


def event_branches(text: str, event: str, path: str) -> set[str]:
    """Read only the selected top-level on: event, not another event or comments."""
    marker = f"\n  {event}:\n"
    if text.count(marker) != 1:
        raise AssertionError(f"{path}: require exactly one {event} event")
    fragment = text.split(marker, 1)[1]
    branch_lines = []
    for line in fragment.splitlines():
        # A sibling on: event begins at two spaces; nested event keys use four.
        if line.startswith("  ") and not line.startswith("    "):
            break
        if line.lstrip().startswith("branches:") and not line.startswith("    branches:"):
            raise AssertionError(f"{path}: invalid {event} branch indentation")
        if line.startswith("    branches:"):
            branch_lines.append(line)
    if len(branch_lines) != 1:
        raise AssertionError(f"{path}: {event} requires exactly one branch allowlist")
    match = re.fullmatch(r"\s{4}branches:\s*\[([^\]]*)\]\s*(?:#.*)?", branch_lines[0])
    if not match:
        raise AssertionError(f"{path}: {event} branches must be an explicit inline list")
    values = [item.strip().strip("'\"") for item in match.group(1).split(",")]
    if any(not re.fullmatch(r"[a-z][a-z0-9-]*", value) for value in values):
        raise AssertionError(f"{path}: invalid {event} branch name")
    if len(values) != len(set(values)):
        raise AssertionError(f"{path}: duplicated {event} branch allowlist")
    return set(values)


def validate(text: str, path: str) -> None:
    pull = event_branches(text, "pull_request", path)
    if pull != {"main", "preview"}:
        raise AssertionError(f"{path}: PR preflight must target exactly main and preview")
    push = event_branches(text, "push", path)
    if push != {"main"}:
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
