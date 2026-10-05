#!/usr/bin/env python3
"""Query MouldMaster's canonical source-to-runtime-to-QA dependency graph."""
from __future__ import annotations
import argparse, fnmatch, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GRAPH_PATH=ROOT/"data/dependency-ownership-v1.json"

def load_graph()->dict:
    data=json.loads(GRAPH_PATH.read_text(encoding="utf-8"))
    if data.get("id")!="mouldmaster-dependency-ownership-v1":
        raise ValueError("dependency graph identity mismatch")
    return data

def matches(path:str,pattern:str)->bool:
    if "**" in pattern:
        prefix=pattern.split("**",1)[0]
        return path.startswith(prefix)
    if "*" in pattern or "?" in pattern or "[" in pattern:
        return fnmatch.fnmatch(path,pattern)
    return path==pattern

def direct_areas(files:set[str],graph:dict)->set[str]:
    hit=set()
    for area,spec in graph["areas"].items():
        patterns=list(spec.get("sources") or [])+list(spec.get("generatedOutputs") or [])
        if any(matches(path,pat) for path in files for pat in patterns):
            hit.add(area)
    return hit

def expand_dependencies(areas:set[str],graph:dict)->set[str]:
    out=set(areas)
    changed=True
    while changed:
        changed=False
        for area in list(out):
            for dep in graph["areas"][area].get("dependsOn") or []:
                if dep not in out:
                    out.add(dep);changed=True
    return out

def expand_dependents(areas:set[str],graph:dict)->set[str]:
    out=set(areas)
    changed=True
    while changed:
        changed=False
        for area,spec in graph["areas"].items():
            if area in out:
                continue
            if any(dep in out for dep in spec.get("dependsOn") or []):
                out.add(area);changed=True
    return out

def impact(files:set[str])->dict:
    graph=load_graph()
    direct=direct_areas(files,graph)
    prerequisites=expand_dependencies(direct,graph)
    affected=expand_dependents(direct,graph)
    owners={}
    checks=set();workflows=set();surfaces=set();generated=set()
    for area in sorted(affected):
        spec=graph["areas"][area]
        owners[area]=spec.get("failureIdPrefix")
        checks.update(spec.get("checks") or [])
        workflows.update(spec.get("workflows") or [])
        surfaces.update(spec.get("runtimeSurfaces") or [])
        generated.update(spec.get("generatedOutputs") or [])
    return {
        "directAreas":sorted(direct),
        "prerequisites":sorted(prerequisites-direct),
        "affectedAreas":sorted(affected),
        "areas":sorted(affected),
        "owners":owners,
        "checks":sorted(checks),
        "workflows":sorted(workflows),
        "runtimeSurfaces":sorted(surfaces),
        "generatedOutputs":sorted(generated),
    }

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("files",nargs="*")
    ap.add_argument("--json",action="store_true")
    a=ap.parse_args()
    result=impact(set(a.files))
    if a.json:
        print(json.dumps(result,indent=2))
    else:
        print("Areas:",", ".join(result["areas"]) or "none")
        print("Checks:",", ".join(result["checks"]) or "none")
        print("Workflows:",", ".join(result["workflows"]) or "none")
        print("Surfaces:",", ".join(result["runtimeSurfaces"]) or "none")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
