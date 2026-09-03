from __future__ import annotations

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
BASELINE_PATH = ROOT / "qa/architecture-debt-baseline.json"
CORE_RUNTIME_DIR = ROOT / "src/core-runtime"


def need(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def read(path: Path | str) -> str:
    return (ROOT / path if isinstance(path, str) else path).read_text(encoding="utf-8")


def parse_csp(raw: str) -> dict[str, list[str]]:
    directives: dict[str, list[str]] = {}
    for chunk in raw.split(";"):
        parts = chunk.strip().split()
        if not parts:
            continue
        directives[parts[0]] = parts[1:]
    return directives


def local_script_token(token: str) -> bool:
    return token in {"'self'", "'unsafe-hashes'", "'strict-dynamic'"} or token.startswith("'nonce-") or token.startswith("'sha256-") or token.startswith("'sha384-") or token.startswith("'sha512-")


def local_style_token(token: str) -> bool:
    return token in {"'self'", "'unsafe-inline'", "'unsafe-hashes'"} or token.startswith("'nonce-") or token.startswith("'sha256-") or token.startswith("'sha384-") or token.startswith("'sha512-")


baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
need(baseline.get("schemaVersion") == 1, "architecture debt baseline schema drift")

index = read("index.html")
core = read("MouldMaster_Core_App.html")

body_scripts = re.findall(r"\['(\./[^']+\.js)'\s*,\s*'<script", index)
need(body_scripts, "runtime BODY_SCRIPTS could not be extracted")
need(len(body_scripts) == len(set(body_scripts)), "runtime BODY_SCRIPTS contains duplicate entries")
need(
    len(body_scripts) <= int(baseline["runtimeBodyScriptCeiling"]),
    f"runtime bootstrap debt grew: {len(body_scripts)} scripts > ceiling {baseline['runtimeBodyScriptCeiling']}",
)

root_runtime_scripts = [src for src in body_scripts if "/" not in src.removeprefix("./")]
grandfathered_root = set(baseline["grandfatheredRootRuntimeScripts"])
unknown_root = sorted(set(root_runtime_scripts) - grandfathered_root)
need(not unknown_root, f"new root-level runtime scripts are forbidden; use src/domains/<domain>/: {unknown_root}")
need(
    len(root_runtime_scripts) <= int(baseline["rootRuntimeScriptCeiling"]),
    f"root runtime-script debt grew: {len(root_runtime_scripts)} > ceiling {baseline['rootRuntimeScriptCeiling']}",
)

compat_pattern = re.compile(r"-(?:fix|hardening|finalize|extension)\.js$")
actual_compat = {path.name for path in ROOT.glob("*.js") if compat_pattern.search(path.name)}
grandfathered_compat = set(baseline["grandfatheredCompatibilityLayers"])
unknown_compat = sorted(actual_compat - grandfathered_compat)
need(not unknown_compat, f"new root compatibility layers are frozen; consolidate under src/domains/: {unknown_compat}")

# document.write has been retired. The zero ceiling prevents it from returning.
write_count = index.count("document.write(")
need(write_count <= int(baseline["documentWriteCeiling"]), f"document.write bootstrap debt grew: {write_count}")
need("document.writeln(" not in index, "document.writeln is not permitted in the runtime bootstrap")

# The frozen recovery core retains its historical inline script bytes. Browser/PWA
# runtime assembly must replace each block with an exact same-origin generated copy
# before the stricter CSP is installed.
inline_core_script_re = re.compile(r"<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script\s*>", re.I | re.S)
inline_core_scripts = inline_core_script_re.findall(core)
core_runtime_scripts = sorted(CORE_RUNTIME_DIR.glob("core-inline-*.js"))
need(inline_core_scripts, "frozen recovery core unexpectedly has no inline scripts")
need(len(inline_core_scripts) == len(core_runtime_scripts), f"core runtime externalization count drifted: {len(inline_core_scripts)} source / {len(core_runtime_scripts)} generated")
for number, (source, path) in enumerate(zip(inline_core_scripts, core_runtime_scripts), start=1):
    need(path.name == f"core-inline-{number:03d}.js", f"core runtime ordering drifted at slot {number}: {path.name}")
    need(path.read_text(encoding="utf-8") == source, f"externalized core runtime is stale at slot {number}: {path.name}")
need("const CORE_INLINE_SCRIPTS=[" in index, "runtime core script externalization registry missing")
need("function externalizeCoreScripts(out)" in index, "runtime core script externalization function missing")
need("out=externalizeCoreScripts(out)" in index, "runtime assembly does not externalize frozen core scripts")
for path in core_runtime_scripts:
    need(f"'./src/core-runtime/{path.name}'" in index, f"runtime core script missing from bootstrap registry: {path.name}")

# CSP may become stricter, but it may not add unsafe-eval, remote script origins,
# or external runtime connections.
csp_match = re.search(r'const\s+CSP="([^"]+)"', index)
need(csp_match is not None, "runtime CSP constant missing from index bootstrap")
csp_raw = csp_match.group(1)
csp = parse_csp(csp_raw)
need("'unsafe-eval'" not in csp_raw, "CSP must never permit unsafe-eval")
need(csp.get("base-uri") == ["'none'"], "CSP base-uri must remain none")
need(csp.get("object-src") == ["'none'"], "CSP object-src must remain none")
need(csp.get("frame-src") == ["'none'"], "CSP frame-src must remain none")
script_src = csp.get("script-src") or []
script_src_attr = csp.get("script-src-attr") or []
style_src = csp.get("style-src") or []
connect_src = csp.get("connect-src") or []
need(script_src == ["'self'"], f"CSP executable script-src must remain self-only: {script_src}")
need("'unsafe-inline'" not in script_src, "CSP script-src must not restore unsafe-inline executable blocks")
need(script_src_attr == ["'unsafe-inline'"], f"legacy handler debt must remain isolated to script-src-attr: {script_src_attr}")
need(all(local_script_token(token) for token in script_src), f"CSP script-src added a non-local source: {script_src}")
need(style_src and all(local_style_token(token) for token in style_src), f"CSP style-src added a non-local source: {style_src}")
need(set(connect_src).issubset({"'self'", "'none'"}) and connect_src, f"CSP connect-src added an external source: {connect_src}")

remote_script_tag = re.compile(r"<script\b[^>]*\bsrc\s*=\s*['\"]\s*(?:https?:)?//", re.I)
need(remote_script_tag.search(index) is None, "index.html contains a remote runtime script tag")
need(remote_script_tag.search(core) is None, "MouldMaster_Core_App.html contains a remote runtime script tag")

# Active application JavaScript must not gain string-to-code execution. Scan all
# directly injected scripts, exact externalized core runtime copies, and every domain module.
scan_paths: set[Path] = set(core_runtime_scripts)
for src in body_scripts:
    path = ROOT / src.removeprefix("./")
    need(path.is_file(), f"runtime script missing while checking architecture debt: {src}")
    scan_paths.add(path)
scan_paths.update((ROOT / "src/domains").rglob("*.js"))
for path in sorted(scan_paths):
    source = path.read_text(encoding="utf-8")
    need(re.search(r"\beval\s*\(", source) is None, f"eval() is forbidden in active runtime code: {path.relative_to(ROOT)}")
    need(re.search(r"\bnew\s+Function\s*\(", source) is None, f"new Function() is forbidden in active runtime code: {path.relative_to(ROOT)}")
    need("document.write(" not in source and "document.writeln(" not in source, f"document.write is forbidden in active runtime code: {path.relative_to(ROOT)}")

need(re.search(r"\beval\s*\(", core) is None, "eval() is forbidden in the active core HTML")
need(re.search(r"\bnew\s+Function\s*\(", core) is None, "new Function() is forbidden in the active core HTML")

print(
    "MouldMaster architecture debt guard passed: "
    f"{len(body_scripts)}/{baseline['runtimeBodyScriptCeiling']} bootstrap scripts; "
    f"{len(root_runtime_scripts)}/{baseline['rootRuntimeScriptCeiling']} grandfathered root scripts; "
    f"{len(actual_compat)}/{len(grandfathered_compat)} compatibility layers; "
    f"document.write {write_count}/{baseline['documentWriteCeiling']}; "
    f"{len(core_runtime_scripts)} exact runtime-externalized frozen core scripts; script-src self-only; "
    "legacy handler attributes isolated; no remote scripts, unsafe-eval, eval(), or new Function()"
)
