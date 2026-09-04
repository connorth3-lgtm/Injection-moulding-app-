#!/usr/bin/env python3
"""Require coherent runtime governance and a web/cache generation bump for learner runtime changes."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit((result.stderr or result.stdout).strip() or f"git {' '.join(args)} failed")
    return result.stdout


def release_tuple(value: object) -> tuple[int, int, int, int]:
    raw = str(value or "")
    if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+", raw):
        raise SystemExit(f"Invalid web_release: {raw!r}")
    return tuple(int(x) for x in raw.split("."))  # type: ignore[return-value]


def explicit_same_origin_assets(source: str) -> set[str]:
    return {m.group(1).split("?", 1)[0] for m in re.finditer(r"['\"]\./([^'\"?]+)(?:\?[^'\"]*)?['\"]", source)}


# The mandatory integrity workflow checks out two commits. Fail clearly if that
# invariant is weakened, because silently skipping this comparison would reopen
# the mixed-version PWA failure mode.
git("rev-parse", "HEAD^")
parent = "HEAD^"
changed = {x.strip() for x in git("diff", "--name-only", parent, "HEAD").splitlines() if x.strip()}

worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")
pwa_shell = (ROOT / "pwa-shell.js").read_text(encoding="utf-8")
current = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
current_web_raw = current.get("web_release")
current_web = release_tuple(current_web_raw)

# CORE and OPTIONAL are the deployment/offline runtime contract. Pull every
# explicit same-origin asset path from the worker so new governed assets inherit
# this release-bump requirement without maintaining a second hand-written list.
governed = explicit_same_origin_assets(worker)
governed.update({"service-worker.js", "manifest.webmanifest"})

# Independently derive what the browser shell and generated domain manifest can
# load. This prevents a future feature from being added to index/domain loading
# while being accidentally omitted from the service-worker/release-governance set.
shell_runtime = explicit_same_origin_assets(index)
domain_manifest = json.loads((ROOT / "runtime-domain-manifest.json").read_text(encoding="utf-8"))
for field in ("assets", "dataAssets"):
    values = domain_manifest.get(field, [])
    if not isinstance(values, list):
        raise SystemExit(f"runtime-domain-manifest.json {field} must be an array")
    for value in values:
        if not isinstance(value, str) or not value.startswith("./"):
            raise SystemExit(f"runtime-domain-manifest.json contains invalid runtime asset: {value!r}")
        shell_runtime.add(value[2:].split("?", 1)[0])
shell_runtime.update({"index.html", "MouldMaster_Core_App.html", "runtime-domain-manifest.json", "manifest.webmanifest"})
missing_governance = sorted(shell_runtime - governed)
if missing_governance:
    sample = ", ".join(missing_governance[:12])
    suffix = " …" if len(missing_governance) > 12 else ""
    raise SystemExit(f"Shell/domain runtime asset is not governed by service-worker release identity: {sample}{suffix}")

# Release identity must remain coherent even on commits that do not happen to
# change governed runtime bytes.
cache = re.search(r"^const CACHE_VERSION='([^']+)';$", worker, re.M)
revision = re.search(r"^const CACHE_REVISION='([^']+)';$", worker, re.M)
shell_release = re.search(r'^\s*const SHELL_RELEASE="([^"]+)";$', index, re.M)
pwa_release = re.search(r"^const RELEASE='([^']+)';$", pwa_shell, re.M)
if not cache or cache.group(1) != current_web_raw or not revision or not revision.group(1).strip():
    raise SystemExit("Service-worker cache identity is not bound to web_release + non-empty cache revision")
if not shell_release or shell_release.group(1) != current_web_raw:
    raise SystemExit("index.html SHELL_RELEASE is not bound to version.json web_release")
if not pwa_release or pwa_release.group(1) != current_web_raw:
    raise SystemExit("pwa-shell.js RELEASE is not bound to version.json web_release")

runtime_changed = sorted(changed & governed)
if not runtime_changed:
    print(f"Learner-runtime governance QA passed ({len(shell_runtime)} shell/domain assets covered; no governed runtime assets changed).")
    raise SystemExit(0)

previous = json.loads(git("show", f"{parent}:version.json"))
previous_web = release_tuple(previous.get("web_release"))
if current_web <= previous_web:
    sample = ", ".join(runtime_changed[:12])
    suffix = " …" if len(runtime_changed) > 12 else ""
    raise SystemExit(
        "Governed learner runtime changed without a strictly newer web_release. "
        f"previous={previous.get('web_release')!r}, current={current_web_raw!r}; "
        f"changed: {sample}{suffix}"
    )

print(
    "Learner-runtime release/governance QA passed "
    f"({previous.get('web_release')} -> {current_web_raw}; {len(runtime_changed)} governed runtime asset(s) changed; "
    f"{len(shell_runtime)} shell/domain asset(s) covered)."
)
