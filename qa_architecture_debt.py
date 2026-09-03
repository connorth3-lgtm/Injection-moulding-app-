from __future__ import annotations

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
BASELINE_PATH = ROOT / "qa/architecture-debt-baseline.json"


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
    return token in {"'self'", "'unsafe-inline'", "'unsafe-hashes'", "'strict-dynamic'"} or token.startswith("'nonce-") or token.startswith("'sha256-") or token.startswith("'sha384-") or token.startswith("'sha512-")


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

# The legacy shell still rewrites the fetched core document once. That is a migration
# debt ceiling, not permission to introduce document.write elsewhere or more often.
write_count = index.count("document.write(")
need(write_count <= int(baseline["documentWriteCeiling"]), f"document.write bootstrap debt grew: {write_count}")
need("document.writeln(" not in index, "document.writeln is not permitted in the runtime bootstrap")

# CSP may become stricter (for example by replacing unsafe-inline with nonces/hashes),
# but it may not add unsafe-eval, remote script origins, or external runtime connections.
csp_match = re.search(r'const\s+CSP="([^"]+)"', index)
need(csp_match is not None, "runtime CSP constant missing from index bootstrap")
csp_raw = csp_match.group(1)
csp = parse_csp(csp_raw)
need("'unsafe-eval'" not in csp_raw, "CSP must never permit unsafe-eval")
need(csp.get("base-uri") == ["'none'"], "CSP base-uri must remain none")
need(csp.get("object-src") == ["'none'"], "CSP object-src must remain none")
need(csp.get("frame-src") == ["'none'"], "CSP frame-src must remain none")
script_src = csp.get("script-src") or []
style_src = csp.get("style-src") or []
connect_src = csp.get("connect-src") or []
need(script_src and all(local_script_token(token) for token in script_src), f"CSP script-src added a non-local source: {script_src}")
need(style_src and all(local_style_token(token) for token in style_src), f"CSP style-src added a non-local source: {style_src}")
need(set(connect_src).issubset({"'self'", "'none'"}) and connect_src, f"CSP connect-src added an external source: {connect_src}")

remote_script_tag = re.compile(r"<script\b[^>]*\bsrc\s*=\s*['\"]\s*(?:https?:)?//", re.I)
need(remote_script_tag.search(index) is None, "index.html contains a remote runtime script tag")
need(remote_script_tag.search(core) is None, "MouldMaster_Core_App.html contains a remote runtime script tag")

# Active application JavaScript must not gain string-to-code execution. Scan all
# directly injected scripts plus every domain module because the domain bootstrap
# loads those from the generated manifest.
scan_paths: set[Path] = set()
for src in body_scripts:
    path = ROOT / src.removeprefix("./")
    need(path.is_file(), f"runtime script missing while checking architecture debt: {src}")
    scan_paths.add(path)
scan_paths.update((ROOT / "src/domains").rglob("*.js"))
for path in sorted(scan_paths):
    source = path.read_text(encoding="utf-8")
    need(re.search(r"\beval\s*\(", source) is None, f"eval() is forbidden in active runtime code: {path.relative_to(ROOT)}")
    need(re.search(r"\bnew\s+Function\s*\(", source) is None, f"new Function() is forbidden in active runtime code: {path.relative_to(ROOT)}")
    if path.name != "index.html":
        need("document.write(" not in source and "document.writeln(" not in source, f"document.write is confined to the grandfathered bootstrap: {path.relative_to(ROOT)}")

need(re.search(r"\beval\s*\(", core) is None, "eval() is forbidden in the active core HTML")
need(re.search(r"\bnew\s+Function\s*\(", core) is None, "new Function() is forbidden in the active core HTML")

print(
    "MouldMaster architecture debt guard passed: "
    f"{len(body_scripts)}/{baseline['runtimeBodyScriptCeiling']} bootstrap scripts; "
    f"{len(root_runtime_scripts)}/{baseline['rootRuntimeScriptCeiling']} grandfathered root scripts; "
    f"{len(actual_compat)}/{len(grandfathered_compat)} compatibility layers; "
    f"document.write {write_count}/{baseline['documentWriteCeiling']}; no remote scripts, unsafe-eval, eval(), or new Function()"
)
