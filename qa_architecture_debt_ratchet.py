from __future__ import annotations
from pathlib import Path
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parent
REL = "qa/architecture-debt-baseline.json"
NUMERIC = ("runtimeBodyScriptCeiling", "rootRuntimeScriptCeiling", "documentWriteCeiling", "compatibilityLayerCeiling")
SETS = ("grandfatheredRootRuntimeScripts", "grandfatheredCompatibilityLayers")


def load_text(text: str) -> dict:
    value = json.loads(text)
    if not isinstance(value, dict):
        raise AssertionError("architecture baseline must be an object")
    return value


def git_show(spec: str) -> str | None:
    result = subprocess.run(["git", "show", spec], cwd=ROOT, capture_output=True, text=True)
    return result.stdout if result.returncode == 0 else None


current = load_text((ROOT / REL).read_text(encoding="utf-8"))
assert current.get("targetRootRuntimeScripts") == 0, "root runtime target must stay zero"
assert current.get("targetCompatibilityLayers") == 0, "compatibility-layer target must stay zero"

base_ref = os.environ.get("GITHUB_BASE_REF", "").strip()
previous_text = git_show(f"origin/{base_ref}:{REL}") if base_ref else None
if previous_text is None and os.environ.get("GITHUB_EVENT_NAME") == "pull_request":
    raise AssertionError("architecture debt ratchet could not read the pull-request base baseline")
if previous_text is None:
    print("Architecture debt ratchet: no PR base supplied; absolute debt ceilings remain enforced.")
    raise SystemExit(0)

previous = load_text(previous_text)
for key in NUMERIC:
    if int(current[key]) > int(previous.get(key, current[key])):
        raise AssertionError(f"architecture debt ceiling increased: {key} {previous.get(key)} -> {current[key]}")
for key in SETS:
    cur = set(current.get(key) or [])
    prev = set(previous.get(key) or [])
    added = sorted(cur - prev)
    if added:
        raise AssertionError(f"architecture debt grandfathering expanded in {key}: {added}")

print("Architecture debt merge-base ratchet passed: ceilings and grandfathered sets did not increase.")
