#!/usr/bin/env python3
"""Bump the canonical browser/PWA release without changing unrelated evidence claims."""
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

from sync_web_release import desired_files

ROOT = Path(__file__).resolve().parents[1]
RELEASE_RE = re.compile(r"^(\d{4})\.(\d{2})\.(\d{2})\.(\d+)$")


def release_key(value: str) -> tuple[int, int, int, int]:
    match = RELEASE_RE.fullmatch(value)
    if not match:
        raise SystemExit(f"invalid web release {value!r}; expected YYYY.MM.DD.N")
    return tuple(int(part) for part in match.groups())


def replace_once(path: Path, pattern: str, replacement: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.M)
    if count != 1:
        raise SystemExit(f"could not bump {label}: expected exactly one match, found {count}")
    path.write_text(updated, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", required=True, help="New YYYY.MM.DD.N web release")
    parser.add_argument("--published", help="Publication date YYYY-MM-DD; defaults to release date")
    args = parser.parse_args()

    new_release = args.release
    new_key = release_key(new_release)
    inferred_published = f"{new_key[0]:04d}-{new_key[1]:02d}-{new_key[2]:02d}"
    published = args.published or inferred_published
    try:
        date.fromisoformat(published)
    except ValueError as exc:
        raise SystemExit(f"invalid publication date {published!r}: {exc}") from exc
    if published != inferred_published:
        raise SystemExit(
            f"publication date {published!r} must match release date {inferred_published!r}"
        )

    version_path = ROOT / "version.json"
    version = json.loads(version_path.read_text(encoding="utf-8"))
    old_release = str(version.get("web_release", ""))
    old_key = release_key(old_release)
    if new_key <= old_key:
        raise SystemExit(
            f"new web release must be strictly newer: current={old_release!r}, requested={new_release!r}"
        )

    # Only the browser release identity and publication date move here. Subsystem
    # versions (content, assessment storage, desktop, etc.) remain independently governed.
    version["web_release"] = new_release
    version["published"] = published
    version_path.write_text(json.dumps(version, indent=2) + "\n", encoding="utf-8")

    # Synchronise the three runtime surfaces that own browser/PWA cache identity.
    for path, desired in desired_files().items():
        path.write_text(desired, encoding="utf-8")

    replace_once(
        ROOT / "README.md",
        r"^- PWA / browser shell: `[^`]+`$",
        f"- PWA / browser shell: `{new_release}`",
        "README PWA release lane",
    )
    replace_once(
        ROOT / "support.html",
        r'PWA shell: <span id="mmPwa">[^<]+</span>',
        f'PWA shell: <span id="mmPwa">{new_release}</span>',
        "support fallback PWA release",
    )
    replace_once(
        ROOT / "qa_release.py",
        r'^WEB_RELEASE = "[^"]+"$',
        f'WEB_RELEASE = "{new_release}"',
        "release QA web release",
    )
    replace_once(
        ROOT / "qa_release_docs.py",
        r"^ 'web_release':'[^']+',$",
        f" 'web_release':'{new_release}',",
        "release documentation QA web release",
    )

    boundary_path = ROOT / "data" / "release-external-validation-v1.json"
    boundary = json.loads(boundary_path.read_text(encoding="utf-8"))
    old_boundary_release = str(boundary.get("release", ""))
    if old_boundary_release != old_release:
        raise SystemExit(
            "external-validation boundary was not bound to the current release before bump: "
            f"boundary={old_boundary_release!r}, current={old_release!r}"
        )

    # Rebinding a HOLD boundary is release identity maintenance, not validation.
    # Guard the non-promotion semantics explicitly before writing it back.
    for area in ("accessibility", "pwaPhysicalDevices", "windowsDistribution", "curriculumSme", "learnerOutcomes"):
        if boundary.get(area, {}).get("status") != "hold":
            raise SystemExit(f"refusing to rebind promoted/non-HOLD external evidence area: {area}")
    claims = boundary.get("claims", {})
    promoted_claims = [name for name, value in claims.items() if value is not False]
    if promoted_claims:
        raise SystemExit(
            "refusing to rebind boundary with promoted external-validation claims: "
            + ", ".join(sorted(promoted_claims))
        )
    boundary["release"] = new_release
    boundary_path.write_text(json.dumps(boundary, indent=2) + "\n", encoding="utf-8")

    print(f"Bumped canonical web release {old_release} -> {new_release} ({published})")
    print("Preserved independent subsystem versions and all external-validation HOLD/false claims.")


if __name__ == "__main__":
    main()
