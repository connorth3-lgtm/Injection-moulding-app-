from __future__ import annotations
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
GRAPH = ROOT / "release-asset-graph.json"


def worker_assets(source: str, name: str) -> set[str]:
    prefix = "const " + name + "=["
    start = source.find(prefix)
    if start < 0:
        raise SystemExit(f"service-worker asset array missing: {name}")
    start += len(prefix)
    end = source.find("];", start)
    if end < 0:
        raise SystemExit(f"service-worker asset array is unterminated: {name}")
    body = source[start:end]
    assets = set()
    for line in body.splitlines():
        value = line.strip().rstrip(",")
        if len(value) >= 4 and value[0] in ("'", '"') and value[-1] == value[0]:
            asset = value[1:-1]
            if asset.startswith("./"):
                assets.add(asset)
    if not assets:
        raise SystemExit(f"service-worker asset array is empty: {name}")
    return assets


def validate() -> None:
    graph = json.loads(GRAPH.read_text(encoding="utf-8"))
    if graph.get("schemaVersion") != 1:
        raise SystemExit("release asset graph schema drift")
    manifest = json.loads((ROOT / graph["domainManifest"]).read_text(encoding="utf-8"))
    worker = (ROOT / graph["serviceWorker"]).read_text(encoding="utf-8")
    core = worker_assets(worker, "CORE")
    optional = worker_assets(worker, "OPTIONAL")
    governed = core | optional
    required = set(manifest.get("assets", [])) | set(manifest.get("dataAssets", [])) | {"./runtime-domain-manifest.json"}
    missing = sorted(required - governed)
    if missing:
        raise SystemExit("domain runtime assets missing from offline release graph: " + ", ".join(missing))
    overlap = core & optional
    if overlap:
        raise SystemExit("release assets duplicated across CORE/OPTIONAL: " + ", ".join(sorted(overlap)))
    absent = sorted(asset for asset in governed if not (ROOT / asset.removeprefix("./")).is_file())
    if absent:
        raise SystemExit("release graph references missing files: " + ", ".join(absent))
    print(f"Release asset graph valid: {len(governed)} governed assets; {len(required)} manifest-derived requirements.")


if __name__ == "__main__":
    validate()
