#!/usr/bin/env python3
"""Inventory atomic PWA installation assets without claiming physical-network testing."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def inventory() -> tuple[list[tuple[str, int]], list[tuple[str, int]]]:
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    result = []
    for group in ("CORE", "OPTIONAL"):
        match = re.search(r"const " + group + r"=\[(.*?)\];", worker, re.S)
        if not match:
            raise AssertionError(f"missing atomic PWA asset group: {group}")
        names = re.findall(r"'(\./[^']+)'", match.group(1))
        if any(not name.startswith("./") for name in names):
            raise AssertionError(f"invalid path in {group}")
        paths = []
        for name in names:
            path = ROOT / name.removeprefix("./")
            if not path.is_file():
                raise AssertionError(f"{group} first-install file missing: {name}")
            paths.append((name, path.stat().st_size))
        result.append(paths)
    core, optional = result
    all_names = [name for name, _ in core + optional]
    if len(set(all_names)) != len(all_names):
        raise AssertionError("precache duplicates silently masked by Set")
    if "Promise.allSettled(RELEASE_ASSETS.map(url=>cacheAsset(cache,url)))" not in worker:
        raise AssertionError("atomic PWA precache contract was removed")
    if "await caches.delete(STATIC_CACHE)" not in worker or "if(failed.length)" not in worker:
        raise AssertionError("failed precache must delete incomplete candidate")
    if "skipWaiting()" in worker.replace("// Deliberately do not call skipWaiting().", ""):
        # The worker may describe skipWaiting in comments; require no callable form.
        calls = [line for line in worker.splitlines()
                 if "skipWaiting()" in line and not line.lstrip().startswith("//")]
        if calls:
            raise AssertionError("worker must not force activate over old controlled clients")
    return core, optional


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    core, optional = inventory()
    all_files = core + optional
    if args.check and (len(core), len(optional)) != (133, 23):
        raise AssertionError("PWA first-install asset count changed; re-evaluate physical-device intake")
    print(f"Atomic PWA: {len(core)} CORE + {len(optional)} OPTIONAL = {len(all_files)} assets; "
          f"{sum(size for _, size in all_files):,} repository bytes, NOT network transfer/storage quota.")
    print("Largest assets: " + ", ".join(f"{name} ({size:,} B)" for name, size in
                                      sorted(all_files, key=lambda item: item[1], reverse=True)[:5]))
    print("Slow-network/low-storage/real iOS-iPadOS-Android install and offline reboot: HOLD.")


if __name__ == "__main__":
    main()
