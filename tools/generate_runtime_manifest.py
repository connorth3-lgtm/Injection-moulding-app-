from __future__ import annotations

from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = ROOT / "src" / "domains"
OUTPUT = ROOT / "data" / "runtime-domain-manifest.json"


def build_manifest() -> dict:
    assets = []
    for path in sorted(DOMAINS.rglob("*.js")):
        if path.name == "domain-bootstrap.js":
            continue
        assets.append("./" + path.relative_to(ROOT).as_posix())
    data_assets = ["./data/materials/catalog-v1.json"]
    return {
        "schemaVersion": 1,
        "generatedBy": "tools/generate_runtime_manifest.py",
        "assets": assets,
        "dataAssets": data_assets,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the MouldMaster domain runtime asset manifest")
    parser.add_argument("--check", action="store_true", help="fail if the committed manifest is stale")
    args = parser.parse_args()
    expected = json.dumps(build_manifest(), indent=2, ensure_ascii=False) + "\n"
    if args.check:
        actual = OUTPUT.read_text(encoding="utf-8")
        if actual != expected:
            raise SystemExit("data/runtime-domain-manifest.json is stale; run tools/generate_runtime_manifest.py")
        print("Domain runtime manifest is current")
        return
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
