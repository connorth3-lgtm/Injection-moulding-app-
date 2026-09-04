#!/usr/bin/env python3
"""Require a web/cache generation bump whenever governed learner runtime bytes change."""
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


# The mandatory integrity workflow checks out two commits. Fail clearly if that
# invariant is weakened, because silently skipping this comparison would reopen
# the mixed-version PWA failure mode.
git("rev-parse", "HEAD^")
parent = "HEAD^"
changed = {x.strip() for x in git("diff", "--name-only", parent, "HEAD").splitlines() if x.strip()}

worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
# CORE and OPTIONAL are the deployment/offline runtime contract. Pull every
# explicit same-origin asset path from the worker so new governed assets inherit
# this release-bump requirement without maintaining a second hand-written list.
governed = {m.group(1) for m in re.finditer(r"['\"]\./([^'\"]+)['\"]", worker)}
governed.update({"service-worker.js", "manifest.webmanifest"})
runtime_changed = sorted(changed & governed)

if not runtime_changed:
    print("Learner-runtime release bump QA passed (no governed learner runtime assets changed).")
    raise SystemExit(0)

current = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
previous = json.loads(git("show", f"{parent}:version.json"))
current_web = release_tuple(current.get("web_release"))
previous_web = release_tuple(previous.get("web_release"))
if current_web <= previous_web:
    sample = ", ".join(runtime_changed[:12])
    suffix = " …" if len(runtime_changed) > 12 else ""
    raise SystemExit(
        "Governed learner runtime changed without a strictly newer web_release. "
        f"previous={previous.get('web_release')!r}, current={current.get('web_release')!r}; "
        f"changed: {sample}{suffix}"
    )

cache = re.search(r"^const CACHE_VERSION='([^']+)';$", worker, re.M)
revision = re.search(r"^const CACHE_REVISION='([^']+)';$", worker, re.M)
if not cache or cache.group(1) != current.get("web_release") or not revision or not revision.group(1).strip():
    raise SystemExit("Service-worker cache identity is not bound to the new web_release + non-empty cache revision")

print(
    "Learner-runtime release bump QA passed "
    f"({previous.get('web_release')} -> {current.get('web_release')}; {len(runtime_changed)} governed runtime asset(s) changed)."
)
