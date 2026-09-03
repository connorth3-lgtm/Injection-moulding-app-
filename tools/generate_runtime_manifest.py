from __future__ import annotations

from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = ROOT / "src" / "domains"
OUTPUT = ROOT / "runtime-domain-manifest.json"
PRIORITY_ASSETS = [
    "./src/domains/shared/learner-scope.js",
]
# Generated classic-script packs are injected synchronously by index.html at
# specific legacy ordering boundaries. Loading them again through the async
# domain manifest would execute their source parts twice.
EXCLUDED_DIRS = {"runtime-packs"}


def build_manifest() -> dict:
    discovered = []
    for path in sorted(DOMAINS.rglob("*.js")):
        if path.name == "domain-bootstrap.js":
            continue
        relative = path.relative_to(DOMAINS)
        if any(part in EXCLUDED_DIRS for part in relative.parts[:-1]):
            continue
        discovered.append("./" + path.relative_to(ROOT).as_posix())
    priority = [asset for asset in PRIORITY_ASSETS if asset in discovered]
    assets = priority + [asset for asset in discovered if asset not in priority]
    return {
        "schemaVersion": 1,
        "generatedBy": "tools/generate_runtime_manifest.py",
        "assets": assets,
        "dataAssets": ["./material-catalog-v1.json"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the MouldMaster public domain runtime asset manifest")
    parser.add_argument("--check", action="store_true", help="fail if the committed manifest is stale")
    args = parser.parse_args()
    expected = json.dumps(build_manifest(), indent=2, ensure_ascii=False) + "\n"
    if args.check:
        actual = OUTPUT.read_text(encoding="utf-8")
        if actual != expected:
            raise SystemExit("runtime-domain-manifest.json is stale; run tools/generate_runtime_manifest.py")
        print("Domain runtime manifest is current")
        return
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
