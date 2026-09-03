#!/usr/bin/env python3
"""Generate hardened runtime copies of the frozen core's inline script blocks.

`MouldMaster_Core_App.html` is also the immutable legacy Windows recovery payload,
so its bytes are intentionally not rewritten. The browser bootstrap replaces those
inline blocks with same-origin generated assets during runtime assembly.

Runtime-only transforms remove the recovery core's historical certificate-print
`document.write` call and rewrite generated inline event-handler markup to inert
`data-mm-on*` attributes. A strict delegated bridge is concatenated into the final
generated core slot so this hardening does not increase BODY_SCRIPTS above 39.
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
HANDLER_BRIDGE_PATH = OUT_DIR / "inline-handler-bridge.js"

INLINE_SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)
SRC_ATTR_RE = re.compile(r"\bsrc\s*=", re.I)
INDEX_RUNTIME_REF_RE = re.compile(r"['\"]\./src/core-runtime/(core-inline-\d{3}\.js)['\"]")
HANDLER_ATTR_RE = re.compile(r"(?P<prefix>[\s<])on(?P<event>click|change|input|keydown)\s*=", re.I)
PRINT_CERTIFICATE_RE = re.compile(
    r"function printCertificate\(level,region\)\{.*?\n\}\n\n/\* Instructor dashboard understands regional score keys\. \*/",
    re.S,
)

HARDENED_PRINT_CERTIFICATE = r'''function printCertificate(level,region){
  const key=level+"-"+region,date=certificateDateText(key);
  const w=window.open("","_blank","width=900,height=650"); if(!w){toast("Allow pop-ups to print a single certificate");return}
  w.opener=null;
  const d=w.document;
  d.title="MouldMaster Certificate";
  const meta=d.createElement("meta");meta.setAttribute("charset","utf-8");d.head.appendChild(meta);
  const style=d.createElement("style");style.textContent="body{font-family:system-ui;padding:45px;text-align:center}.box{border:10px double #24364d;padding:50px;max-width:760px;margin:auto}.seal{font-size:48px}.muted{color:#555}";d.head.appendChild(style);
  const box=d.createElement("div");box.className="box";
  box.innerHTML=`<div class="seal">MM</div><h1>${esc(level)} ${region==="US"?"Injection Molding":"Injection Moulding"}</h1><p>This records that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${esc(level)} assessment in <b>${esc(regionName(region))}</b> standards mode.</p><p class="muted">Local learning record · Not an accredited compliance qualification<br>${esc(date)}</p>`;
  d.body.appendChild(box);
  setTimeout(()=>{w.focus();w.print()},0);
}

/* Instructor dashboard understands regional score keys. */'''


def fail(message: str) -> None:
    raise SystemExit(message)


def inline_blocks(core: str) -> list[str]:
    return [
        match.group("body")
        for match in INLINE_SCRIPT_RE.finditer(core)
        if not SRC_ATTR_RE.search(match.group("attrs") or "")
    ]


def retire_handler_attrs(source: str) -> str:
    return HANDLER_ATTR_RE.sub(
        lambda match: f"{match.group('prefix')}data-mm-on{match.group('event').lower()}=",
        source,
    )


def runtime_transform(name: str, source: str) -> str:
    transformed = source
    if name == "core-inline-004.js":
        if source.count("document.write(") != 1 or "function printCertificate(level,region)" not in source:
            fail("frozen certificate print source drifted; review the runtime hardening transform")
        transformed, count = PRINT_CERTIFICATE_RE.subn(HARDENED_PRINT_CERTIFICATE, source, count=1)
        if count != 1:
            fail("certificate print runtime transform did not match exactly once")
        if "document.write(" in transformed or "document.writeln(" in transformed:
            fail("certificate print runtime transform left document.write active")
    return retire_handler_attrs(transformed)


def expected_assets(core: str) -> dict[str, str]:
    blocks = inline_blocks(core)
    if not blocks:
        fail("frozen core has no inline script blocks to externalize at runtime")
    if not HANDLER_BRIDGE_PATH.is_file():
        fail("strict handler bridge source is missing")
    bridge = HANDLER_BRIDGE_PATH.read_text(encoding="utf-8").rstrip() + "\n"
    result: dict[str, str] = {}
    for index, source in enumerate(blocks, start=1):
        name = f"core-inline-{index:03d}.js"
        transformed = runtime_transform(name, source)
        if index == len(blocks):
            transformed = transformed.rstrip() + "\n\n/* ===== strict delegated handler bridge ===== */\n" + bridge
        result[name] = transformed
    return result


def tighten_script_csp(index: str) -> str:
    old = "script-src 'self'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    new = "script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline';"
    if old in index:
        return index.replace(old, new, 1)
    if new in index:
        return index
    fail("index.html CSP shape was not recognised")


def bump_cache(index: str, worker: str) -> tuple[str, str]:
    old_revision = "maturity-hardening-v2-r4-20260903"
    new_revision = "maturity-hardening-v2-r5-20260903"
    old_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r4-20260903"
    new_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r5-20260903"
    if old_revision in worker:
        worker = worker.replace(old_revision, new_revision, 1)
    elif new_revision not in worker:
        fail("service-worker cache revision was not recognised")
    if old_cache in index:
        index = index.replace(old_cache, new_cache, 1)
    elif new_cache not in index:
        fail("index expected static cache was not recognised")
    return index, worker


def ensure_static_handler_retirement(index: str) -> str:
    if "function retireInlineHandlerAttrs(parsed)" in index:
        return index
    old = '    function prepareDocument(html){const parsed=new DOMParser().parseFromString(html,"text/html");if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");const scripts=[];'
    new = '    function retireInlineHandlerAttrs(parsed){for(const eventName of ["click","change","input","keydown"]){const attr="on"+eventName;for(const element of Array.from(parsed.querySelectorAll(`[${attr}]`))){element.setAttribute(`data-mm-on${eventName}`,element.getAttribute(attr)||"");element.removeAttribute(attr)}}return parsed}\n    function prepareDocument(html){const parsed=new DOMParser().parseFromString(html,"text/html");if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");retireInlineHandlerAttrs(parsed);const scripts=[];'
    if old not in index:
        fail("index prepareDocument insertion point drifted")
    return index.replace(old, new, 1)


def insert_worker_assets(worker: str, names: list[str]) -> str:
    marker = "  './MouldMaster_Core_App.html',\n"
    if marker not in worker:
        fail("service-worker CORE insertion point missing")
    assets = [f"./src/core-runtime/{name}" for name in names]
    missing = [asset for asset in assets if f"'{asset}'" not in worker]
    if not missing:
        return worker
    block = "".join(f"  '{asset}',\n" for asset in missing)
    return worker.replace(marker, marker + block, 1)


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
    expected = expected_assets(core)
    refs = list(dict.fromkeys(INDEX_RUNTIME_REF_RE.findall(index)))
    expected_names = list(expected)
    if refs != expected_names:
        fail(f"index CORE_INLINE_SCRIPTS drifted: {refs} != {expected_names}")
    if "function externalizeCoreScripts(out)" not in index or "out=externalizeCoreScripts(out)" not in index:
        fail("browser bootstrap does not externalize frozen core scripts during assembly")
    if "function retireInlineHandlerAttrs(parsed)" not in index or "retireInlineHandlerAttrs(parsed);const scripts=[]" not in index:
        fail("browser bootstrap does not retire static frozen-core handler attributes before installation")
    body_scripts = re.findall(r"\['(\./[^']+\.js)'\s*,\s*'<script", index)
    if len(body_scripts) > 39:
        fail(f"handler bridge increased bootstrap debt: {len(body_scripts)} BODY_SCRIPTS > 39")
    for name, body in expected.items():
        path = OUT_DIR / name
        if not path.is_file():
            fail(f"missing generated core runtime asset: {name}")
        if path.read_text(encoding="utf-8") != body:
            fail(f"generated core runtime asset is stale: {name}")
        if HANDLER_ATTR_RE.search(body):
            fail(f"generated core runtime still emits inline handler attributes: {name}")
    extras = sorted(path.name for path in OUT_DIR.glob("core-inline-*.js") if path.name not in expected)
    if extras:
        fail("stale generated core runtime assets remain: " + ", ".join(extras))
    active_source = "\n".join(expected.values())
    if "document.write(" in active_source or "document.writeln(" in active_source:
        fail("active generated core runtime still contains document.write")
    hardened = expected.get("core-inline-004.js", "")
    for marker in ("w.opener=null", "d.createElement(\"style\")", "d.body.appendChild(box)", "w.print()"):
        if marker not in hardened:
            fail(f"certificate print runtime hardening marker missing: {marker}")
    final_slot = expected[expected_names[-1]]
    for marker in ("MM_INLINE_HANDLER_BRIDGE", "ALLOWED_CALLS", "executeHandler"):
        if marker not in final_slot:
            fail(f"strict handler bridge missing from final generated core slot: {marker}")
    if "script-src 'self'; script-src-attr 'none';" not in index:
        fail("script-src-attr has not been tightened to none")
    if "script-src-attr 'unsafe-inline'" in index or "script-src 'self' 'unsafe-inline'" in index:
        fail("runtime CSP still permits inline script execution")
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    for name in expected_names:
        if f"'./src/core-runtime/{name}'" not in worker:
            fail(f"service-worker CORE missing generated runtime asset: {name}")
    package = DESKTOP_PACKAGE.read_text(encoding="utf-8")
    if '"../../src/core-runtime"' not in package:
        fail("desktop package does not include src/core-runtime")
    integrity = DESKTOP_INTEGRITY.read_text(encoding="utf-8")
    if "STATIC_RUNTIME_DIRS=['src/core-runtime']" not in integrity or "...staticRuntimeFiles" not in integrity:
        fail("desktop integrity does not derive generated core runtime files")
    print(
        f"Core CSP migration check passed: {len(expected_names)} deterministic core runtime slots; bridge folded into final slot; "
        "document.write and generated handler attributes transformed out; 39 BODY_SCRIPTS; script-src-attr none."
    )


def apply() -> None:
    core = CORE.read_text(encoding="utf-8")
    expected = expected_assets(core)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("core-inline-*.js"):
        if old.name not in expected:
            old.unlink()
    for name, body in expected.items():
        (OUT_DIR / name).write_text(body, encoding="utf-8")

    index = tighten_script_csp(INDEX.read_text(encoding="utf-8"))
    index = ensure_static_handler_retirement(index)
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    index, worker = bump_cache(index, worker)
    worker = insert_worker_assets(worker, list(expected))
    INDEX.write_text(index, encoding="utf-8")
    SERVICE_WORKER.write_text(worker, encoding="utf-8")

    DESKTOP_PACKAGE.write_text(insert_desktop_resources(DESKTOP_PACKAGE.read_text(encoding="utf-8")), encoding="utf-8")
    DESKTOP_INTEGRITY.write_text(enable_integrity_directory(DESKTOP_INTEGRITY.read_text(encoding="utf-8")), encoding="utf-8")
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
