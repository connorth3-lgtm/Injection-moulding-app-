#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_RELEASE = "2026.09.12.5"
NEW_RELEASE = "2026.09.12.6"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement target, found {count}")
    write(path, text.replace(old, new, 1))


# Canonical standalone import: preserve progress, never import credential evidence.
replace_once(
    "MouldMaster_Core_App.html",
    '    if(clean.id!==sid)throw new Error("Learner identifier mismatch");\n    users[sid]=clean;',
    '    if(clean.id!==sid)throw new Error("Learner identifier mismatch");\n'
    '    clean.certificates=[];\n'
    '    clean.certificateMeta={};\n'
    '    clean.examPassStatus={};\n'
    '    users[sid]=clean;',
)

# Regenerate active core-runtime slots deterministically from the canonical standalone bytes.
spec = importlib.util.spec_from_file_location("mm_externalize_core", ROOT / "tools/externalize_core_scripts.py")
if spec is None or spec.loader is None:
    raise SystemExit("Could not load deterministic core-runtime generator")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
core = read("MouldMaster_Core_App.html")
expected = mod.expected_assets(core)
for name, body in expected.items():
    write(f"src/core-runtime/{name}", body)

# Regression: pvBuildImportedUsers itself must strip standalone credential evidence.
replace_once(
    "qa_standalone_learner_ids.cjs",
    "const api=new Function('normaliseImportedUser',`${canonicalSource}\\n${requireSource}\\n${hasOwnSource}\\n${buildSource}\\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvHasOwnLearner,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));",
    "const api=new Function('normaliseImportedUser',`${canonicalSource}\\n${requireSource}\\n${hasOwnSource}\\n${buildSource}\\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvHasOwnLearner,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner',completed:[1],certificates:['Advanced-ALL'],certificateMeta:{'Advanced-ALL':{score:100}},examPassStatus:{'Advanced-ALL':true}}));",
)
replace_once(
    "qa_standalone_learner_ids.cjs",
    "assert.equal(registry.activeUser,'learner-1');assert.deepEqual(Object.keys(registry.users),['learner-1','legacy.ID-3']);",
    "assert.equal(registry.activeUser,'learner-1');assert.deepEqual(Object.keys(registry.users),['learner-1','legacy.ID-3']);\n"
    "assert.deepEqual(registry.users['learner-1'].completed,[1],'standalone import must preserve ordinary learning progress');\n"
    "assert.deepEqual(registry.users['learner-1'].certificates,[],'standalone import must strip imported certificates');\n"
    "assert.deepEqual(registry.users['learner-1'].certificateMeta,{},'standalone import must strip imported certificate metadata');\n"
    "assert.deepEqual(registry.users['learner-1'].examPassStatus,{},'standalone import must strip imported pass assertions');",
)
replace_once(
    "qa_standalone_learner_ids.cjs",
    "assert(strict.includes('pvHasOwnLearner(users,active)'),'strict import must require own learner membership for the active ID');",
    "assert(strict.includes('pvHasOwnLearner(users,active)'),'strict import must require own learner membership for the active ID');\n"
    "assert(strict.includes('clean.certificates=[];'),'standalone import must strip certificate assertions');\n"
    "assert(strict.includes('clean.certificateMeta={};'),'standalone import must strip certificate metadata assertions');\n"
    "assert(strict.includes('clean.examPassStatus={};'),'standalone import must strip pass-status assertions');",
)

# Governed current web release bump. Frozen recovery identity remains untouched.
version = json.loads(read("version.json"))
if version.get("web_release") != OLD_RELEASE:
    raise SystemExit(f"Unexpected current web release: {version.get('web_release')!r}")
version["web_release"] = NEW_RELEASE
write("version.json", json.dumps(version, indent=2) + "\n")

for path in ["README.md", "support.html"]:
    text = read(path)
    if OLD_RELEASE not in text:
        raise SystemExit(f"{path}: old web release marker missing")
    write(path, text.replace(OLD_RELEASE, NEW_RELEASE))

external = json.loads(read("data/release-external-validation-v1.json"))
if external.get("release") != OLD_RELEASE:
    raise SystemExit("External-validation boundary is not bound to the expected prior release")
external["release"] = NEW_RELEASE
write("data/release-external-validation-v1.json", json.dumps(external, indent=2) + "\n")

replace_once("qa_release.py", f'WEB_RELEASE = "{OLD_RELEASE}"', f'WEB_RELEASE = "{NEW_RELEASE}"')
replace_once("qa_release_docs.py", f" 'web_release':'{OLD_RELEASE}',", f" 'web_release':'{NEW_RELEASE}',")

new_core_sha = hashlib.sha256((ROOT / "MouldMaster_Core_App.html").read_bytes()).hexdigest()
qa_release = read("qa_release.py")
old_prefix = 'CURRENT_CORE_SHA256 = "'
start = qa_release.find(old_prefix)
if start < 0:
    raise SystemExit("qa_release.py current core hash lock missing")
end = qa_release.find('"', start + len(old_prefix))
if end < 0:
    raise SystemExit("qa_release.py current core hash lock malformed")
qa_release = qa_release[: start + len(old_prefix)] + new_core_sha + qa_release[end:]
marker = 'assert len(core) > 500000, "audited core unexpectedly small"\n'
assertion = 'assert "clean.certificates=[];" in core and "clean.certificateMeta={};" in core and "clean.examPassStatus={};" in core, "standalone backup import must strip credential evidence"\n'
if assertion not in qa_release:
    if marker not in qa_release:
        raise SystemExit("qa_release.py standalone-core assertion insertion point missing")
    qa_release = qa_release.replace(marker, marker + assertion, 1)
write("qa_release.py", qa_release)

print(f"Prepared standalone import evidence hardening for web release {NEW_RELEASE}; current core sha256={new_core_sha}")
