#!/usr/bin/env python3
"""Synchronise browser/PWA release identity from version.json."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_RE = re.compile(r"^\d{4}\.\d{2}\.\d{2}\.\d+$")

def replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    out, count = re.subn(pattern, replacement, text, count=1, flags=re.M)
    if count != 1:
        raise SystemExit(f"Could not synchronise {label}: expected exactly one match, found {count}")
    return out

def desired_files() -> dict[Path, str]:
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    web_release = str(version.get("web_release", ""))
    if not VERSION_RE.fullmatch(web_release):
        raise SystemExit("version.json web_release must use YYYY.MM.DD.N")

    worker_path = ROOT / "service-worker.js"
    worker = worker_path.read_text(encoding="utf-8")
    revision_match = re.search(r"^const CACHE_REVISION='([^']+)';$", worker, flags=re.M)
    if not revision_match:
        raise SystemExit("service-worker CACHE_REVISION is missing")
    cache_revision = revision_match.group(1)
    worker = replace_once(
        worker,
        r"^const CACHE_VERSION='[^']+';$",
        f"const CACHE_VERSION='{web_release}';",
        "service-worker CACHE_VERSION",
    )

    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = replace_once(
        index,
        r'^    const SHELL_RELEASE="[^"]+";$',
        f'    const SHELL_RELEASE="{web_release}";',
        "index SHELL_RELEASE",
    )
    index = replace_once(
        index,
        r'^    const RUNTIME_ASSET_VERSION=(?:"[^"]+"|SHELL_RELEASE);$',
        '    const RUNTIME_ASSET_VERSION=SHELL_RELEASE;',
        "index RUNTIME_ASSET_VERSION",
    )
    expected_cache = f"mouldmaster-static-{web_release}-{cache_revision}"
    index = replace_once(
        index,
        r'^    const EXPECTED_STATIC_CACHE="[^"]+";$',
        f'    const EXPECTED_STATIC_CACHE="{expected_cache}";',
        "index EXPECTED_STATIC_CACHE",
    )

    shell_path = ROOT / "pwa-shell.js"
    shell = shell_path.read_text(encoding="utf-8")
    shell = replace_once(
        shell,
        r"^const RELEASE='[^']+';$",
        f"const RELEASE='{web_release}';",
        "pwa-shell RELEASE",
    )
    return {worker_path: worker, index_path: index, shell_path: shell}

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = []
    for path, desired in desired_files().items():
        current = path.read_text(encoding="utf-8")
        if current == desired:
            continue
        changed.append(path.relative_to(ROOT).as_posix())
        if not args.check:
            path.write_text(desired, encoding="utf-8")
    if args.check and changed:
        raise SystemExit("Web release identity is out of sync: " + ", ".join(changed))
    if args.check:
        print("Web release identity is synchronised")
    elif changed:
        print("Synchronised web release identity: " + ", ".join(changed))
    else:
        print("Web release identity already synchronised")

if __name__ == "__main__":
    main()
