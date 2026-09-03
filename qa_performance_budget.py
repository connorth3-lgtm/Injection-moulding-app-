#!/usr/bin/env python3
"""Fail closed when the production Pages artifact exceeds web performance budgets."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / ".pages-dist"
BUDGET_PATH = ROOT / "qa" / "performance-budget-v1.json"


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def mib(value: int) -> str:
    return f"{value / (1024 * 1024):.2f} MiB"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reuse-artifact",
        action="store_true",
        help="Validate the existing .pages-dist instead of rebuilding it first.",
    )
    args = parser.parse_args()

    if not args.reuse_artifact:
        subprocess.run(["python", "tools/build_pages_artifact.py"], cwd=ROOT, check=True)

    manifest_path = DIST / "pages-manifest.json"
    need(manifest_path.exists(), "Pages manifest is missing; build the production artifact first")
    budget = json.loads(BUDGET_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    need(budget.get("schema") == 1, "Unsupported performance budget schema")
    assets = manifest.get("assets", {})
    need(isinstance(assets, dict) and assets, "Pages manifest has no asset inventory")

    sizes = {name: int(meta.get("bytes", 0)) for name, meta in assets.items()}
    need(all(value >= 0 for value in sizes.values()), "Pages manifest contains invalid asset sizes")

    public_bytes = sum(sizes.values())
    javascript_bytes = sum(size for name, size in sizes.items() if name.lower().endswith((".js", ".cjs", ".mjs")))
    css_bytes = sum(size for name, size in sizes.items() if name.lower().endswith(".css"))
    precache = manifest.get("precache_assets", [])
    need(isinstance(precache, list) and precache, "Pages manifest has no precache asset list")
    missing_precache = sorted(name for name in precache if name not in sizes)
    need(not missing_precache, "Precache assets missing from Pages size inventory: " + ", ".join(missing_precache))
    precache_bytes = sum(sizes[name] for name in precache)
    largest_name, largest_bytes = max(sizes.items(), key=lambda item: item[1])

    measured = {
        "public_asset_count": len(sizes),
        "public_bytes": public_bytes,
        "precache_bytes": precache_bytes,
        "javascript_bytes": javascript_bytes,
        "css_bytes": css_bytes,
        "largest_asset": largest_name,
        "largest_asset_bytes": largest_bytes,
    }
    print("MouldMaster production artifact performance baseline:")
    print(f"  assets: {measured['public_asset_count']} / {budget['max_public_asset_count']}")
    print(f"  public bytes: {mib(public_bytes)} / {mib(budget['max_public_bytes'])}")
    print(f"  precache bytes: {mib(precache_bytes)} / {mib(budget['max_precache_bytes'])}")
    print(f"  JavaScript bytes: {mib(javascript_bytes)} / {mib(budget['max_javascript_bytes'])}")
    print(f"  CSS bytes: {mib(css_bytes)} / {mib(budget['max_css_bytes'])}")
    print(f"  largest asset: {largest_name} ({mib(largest_bytes)}) / {mib(budget['max_single_asset_bytes'])}")

    need(len(sizes) <= budget["max_public_asset_count"], "Public asset count exceeds performance budget")
    need(public_bytes <= budget["max_public_bytes"], "Public artifact bytes exceed performance budget")
    need(precache_bytes <= budget["max_precache_bytes"], "Precache bytes exceed performance budget")
    need(javascript_bytes <= budget["max_javascript_bytes"], "JavaScript bytes exceed performance budget")
    need(css_bytes <= budget["max_css_bytes"], "CSS bytes exceed performance budget")
    need(largest_bytes <= budget["max_single_asset_bytes"], f"Single asset exceeds performance budget: {largest_name}")

    print("MouldMaster production artifact performance budget passed")


if __name__ == "__main__":
    main()
