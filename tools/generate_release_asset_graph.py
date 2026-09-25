from __future__ import annotations
from pathlib import Path
import argparse, json, re

ROOT=Path(__file__).resolve().parents[1]
GRAPH=ROOT/"release-asset-graph.json"

def worker_assets(source,name):
    m=re.search(rf"const\\s+{name}\\s*=\\s*\\[(.*?)\\]\\s*;",source,re.S)
    if not m: raise SystemExit(f"service-worker asset array missing: {name}")
    return set(re.findall(r"['\"](\\./[^'\"]+)['\"]",m.group(1)))

def validate():
    graph=json.loads(GRAPH.read_text(encoding="utf-8"))
    if graph.get("schemaVersion")!=1: raise SystemExit("release asset graph schema drift")
    manifest=json.loads((ROOT/graph["domainManifest"]).read_text(encoding="utf-8"))
    worker=(ROOT/graph["serviceWorker"]).read_text(encoding="utf-8")
    governed=worker_assets(worker,"CORE")|worker_assets(worker,"OPTIONAL")
    required=set(manifest.get("assets",[]))|set(manifest.get("dataAssets",[]))|{"./runtime-domain-manifest.json"}
    missing=sorted(required-governed)
    if missing: raise SystemExit("domain runtime assets missing from offline release graph: "+", ".join(missing))
    overlap=worker_assets(worker,"CORE")&worker_assets(worker,"OPTIONAL")
    if overlap: raise SystemExit("release assets duplicated across CORE/OPTIONAL: "+", ".join(sorted(overlap)))
    absent=sorted(a for a in governed if not (ROOT/a.removeprefix("./")).is_file())
    if absent: raise SystemExit("release graph references missing files: "+", ".join(absent))
    print(f"Release asset graph valid: {len(governed)} governed assets; {len(required)} manifest-derived requirements.")

def main():
    argparse.ArgumentParser(description="Validate the canonical release asset graph").parse_args()
    validate()
if __name__=="__main__": main()
