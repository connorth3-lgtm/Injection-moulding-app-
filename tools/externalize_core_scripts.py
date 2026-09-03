#!/usr/bin/env python3
"""Externalize legacy inline core <script> blocks for a stricter CSP.

The migration is intentionally narrow: inline event-handler attributes remain a
separate debt class and are temporarily isolated under script-src-attr.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "MouldMaster_Core_App.html"
INDEX = ROOT / "index.html"
OUT_DIR = ROOT / "src/core-runtime"
SERVICE_WORKER = ROOT / "service-worker.js"
DESKTOP_PACKAGE = ROOT / "desktop/electron/package.json"
DESKTOP_INTEGRITY = ROOT / "desktop/electron/scripts/generate-integrity.cjs"

INLINE_SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)
SRC_ATTR_RE = re.compile(r"\bsrc\s*=", re.I)
GENERATED_REF_RE = re.compile(r"\./src/core-runtime/(core-inline-\d{3}\.js)")


def fail(message: str) -> None:
    raise SystemExit(message)


def generated_refs(core: str) -> list[str]:
    return list(dict.fromkeys(GENERATED_REF_RE.findall(core)))


def externalize_core(core: str) -> tuple[str, dict[str, str]]:
    generated: dict[str, str] = {}
    index = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal index
        attrs = match.group("attrs") or ""
        if SRC_ATTR_RE.search(attrs):
            return match.group(0)
        index += 1
        name = f"core-inline-{index:03d}.js"
        generated[name] = match.group("body")
        clean_attrs = attrs.rstrip()
        return f'<script{clean_attrs} src="./src/core-runtime/{name}"></script>'

    return INLINE_SCRIPT_RE.sub(repl, core), generated


def tighten_script_csp(index: str) -> str:
    old = "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    new = "script-src 'self'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    if old in index:
        return index.replace(old, new, 1)
    if new in index:
        return index
    fail("index.html CSP shape was not recognised")


def bump_cache(index: str, worker: str) -> tuple[str, str]:
    old_revision = "maturity-hardening-v2-r3-20260903"
    new_revision = "maturity-hardening-v2-r4-20260903"
    old_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r3-20260903"
    new_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r4-20260903"
    if old_revision in worker:
        worker = worker.replace(old_revision, new_revision, 1)
    elif new_revision not in worker:
        fail("service-worker cache revision was not recognised")
    if old_cache in index:
        index = index.replace(old_cache, new_cache, 1)
    elif new_cache not in index:
        fail("index expected static cache was not recognised")
    return index, worker


def insert_worker_assets(worker: str, refs: list[str]) -> str:
    assets = ["./src/core-runtime/" + name for name in refs]
    for asset in assets:
        if f"'{asset}'" in worker:
            continue
        marker = "  './MouldMaster_Core_App.html',\n"
        if marker not in worker:
            fail("service-worker CORE insertion point missing")
        worker = worker.replace(marker, marker + f"  '{asset}',\n", 1)
    return worker


def insert_desktop_resources(package: str) -> str:
    entry = '      {"from": "../../src/core-runtime", "to": "mouldmaster/src/core-runtime"},\n'
    if entry in package:
        return package
    marker = '      {"from": "../../src/domains", "to": "mouldmaster/src/domains"},\n'
    if marker not in package:
        fail("desktop core-runtime resource insertion point missing")
    return package.replace(marker, entry + marker, 1)


def enable_integrity_directory(integrity: str) -> str:
    if "STATIC_RUNTIME_DIRS" not in integrity:
        marker = "const REQUIRED_MANIFEST_FILES=[\n"
        if marker not in integrity:
            fail("desktop integrity constant insertion point missing")
        integrity = integrity.replace(marker, "const STATIC_RUNTIME_DIRS=['src/core-runtime'];\n" + marker, 1)
    if "const staticRuntimeFiles=" not in integrity:
        marker = "const manifestFiles=[...runtimeManifest.assets,...runtimeManifest.dataAssets].map(runtimeAssetPath);\n"
        addition = (
            marker
            + "const staticRuntimeFiles=STATIC_RUNTIME_DIRS.flatMap(rel=>fs.readdirSync(path.join(ROOT,rel),{withFileTypes:true})"
            + ".filter(x=>x.isFile()).map(x=>`${rel}/${x.name}`));\n"
        )
        if marker not in integrity:
            fail("desktop integrity manifest-files insertion point missing")
        integrity = integrity.replace(marker, addition, 1)
    old = "const FILES=[...new Set([...BASE_FILES,...manifestFiles])];"
    new = "const FILES=[...new Set([...BASE_FILES,...staticRuntimeFiles,...manifestFiles])];"
    if old in integrity:
        integrity = integrity.replace(old, new, 1)
    elif new not in integrity:
        fail("desktop integrity FILES expression was not recognised")
    return integrity


def check_state() -> None:
    core = CORE.read_text(encoding="utf-8")
    index = INDEX.read_text(encoding="utf-8")
    inline = [m for m in INLINE_SCRIPT_RE.finditer(core) if not SRC_ATTR_RE.search(m.group("attrs") or "")]
    if inline:
        fail(f"core still contains {len(inline)} inline script block(s)")
    refs = generated_refs(core)
    if not refs:
        fail("core has no generated core-runtime script references")
    missing = [name for name in refs if not (OUT_DIR / name).is_file()]
    if missing:
        fail("missing generated core runtime assets: " + ", ".join(missing))
    if "script-src 'self'; script-src-attr 'unsafe-inline';" not in index:
        fail("script CSP has not been narrowed to self + legacy handler attribute isolation")
    if "script-src 'self' 'unsafe-inline'" in index:
        fail("script-src still permits unsafe-inline executable blocks")
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    for name in refs:
        if f"'./src/core-runtime/{name}'" not in worker:
            fail(f"service-worker CORE missing generated script: {name}")
    package = DESKTOP_PACKAGE.read_text(encoding="utf-8")
    if '"../../src/core-runtime"' not in package:
        fail("desktop package does not include src/core-runtime")
    integrity = DESKTOP_INTEGRITY.read_text(encoding="utf-8")
    if "STATIC_RUNTIME_DIRS=['src/core-runtime']" not in integrity or "...staticRuntimeFiles" not in integrity:
        fail("desktop integrity does not derive generated core runtime files")
    print(f"Core CSP script migration check passed: {len(refs)} inline blocks externalized; script-src self-only; handler attributes isolated.")


def apply() -> None:
    core = CORE.read_text(encoding="utf-8")
    transformed, generated = externalize_core(core)
    if generated:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        for old in OUT_DIR.glob("core-inline-*.js"):
            old.unlink()
        for name, body in generated.items():
            (OUT_DIR / name).write_text(body, encoding="utf-8")
        CORE.write_text(transformed, encoding="utf-8")
        refs = list(generated)
    else:
        refs = generated_refs(core)
        if not refs:
            fail("no inline core scripts found and no generated core-runtime references exist")

    index = tighten_script_csp(INDEX.read_text(encoding="utf-8"))
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    index, worker = bump_cache(index, worker)
    worker = insert_worker_assets(worker, refs)
    INDEX.write_text(index, encoding="utf-8")
    SERVICE_WORKER.write_text(worker, encoding="utf-8")

    package = insert_desktop_resources(DESKTOP_PACKAGE.read_text(encoding="utf-8"))
    DESKTOP_PACKAGE.write_text(package, encoding="utf-8")
    integrity = enable_integrity_directory(DESKTOP_INTEGRITY.read_text(encoding="utf-8"))
    DESKTOP_INTEGRITY.write_text(integrity, encoding="utf-8")
    check_state()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check_state()
    else:
        apply()


if __name__ == "__main__":
    main()
