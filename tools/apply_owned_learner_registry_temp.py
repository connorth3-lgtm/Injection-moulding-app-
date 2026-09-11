#!/usr/bin/env python3
"""Temporary deterministic helper for the PR #293 own-property learner registry hardening."""
from pathlib import Path
import hashlib
import importlib.util
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


core_path = Path("MouldMaster_Core_App.html")
core = core_path.read_text(encoding="utf-8")
core = replace_once(
    core,
    "function pvBuildImportedUsers(x){\n",
    "function pvHasOwnLearner(users,id){\n  return !!users&&Object.prototype.hasOwnProperty.call(users,id);\n}\nfunction pvBuildImportedUsers(x){\n",
    "own-property helper insertion",
)
core = replace_once(
    core,
    '    if(Object.prototype.hasOwnProperty.call(users,sid))throw new Error("Duplicate learner identifier");\n',
    '    if(pvHasOwnLearner(users,sid))throw new Error("Duplicate learner identifier");\n',
    "duplicate own-property guard",
)
core = replace_once(
    core,
    '  if(!users[active])throw new Error("Missing active learner");\n',
    '  if(!pvHasOwnLearner(users,active))throw new Error("Missing active learner");\n',
    "active learner own-property guard",
)
core = replace_once(
    core,
    'function switchUser(id){const sid=pvCanonicalLearnerId(id);if(!sid||!db.users[sid]){toast("Learner profile unavailable");return}persist();db.activeUser=sid;user=db.users[sid];persist();updateGlobalProgress();renderInstructor();toast("Switched learner")}\n',
    'function switchUser(id){const sid=pvCanonicalLearnerId(id);if(!sid||!pvHasOwnLearner(db.users,sid)){toast("Learner profile unavailable");return}persist();db.activeUser=sid;user=db.users[sid];persist();updateGlobalProgress();renderInstructor();toast("Switched learner")}\n',
    "switch learner own-property guard",
)
core = replace_once(
    core,
    '    if(!x||typeof x!=="object"||Array.isArray(x)||!x.users||typeof x.users!=="object"||Array.isArray(x.users)||!x.activeUser||!x.users[x.activeUser])throw new Error("Invalid backup structure");\n',
    '    if(!x||typeof x!=="object"||Array.isArray(x)||!x.users||typeof x.users!=="object"||Array.isArray(x.users)||!x.activeUser)throw new Error("Invalid backup structure");\n',
    "strict import inherited lookup removal",
)
core_path.write_text(core, encoding="utf-8")

qa_path = Path("qa_standalone_learner_ids.cjs")
qa = qa_path.read_text(encoding="utf-8")
qa = replace_once(
    qa,
    "const buildSource=extractFunction('pvBuildImportedUsers');\nconst api=new Function('normaliseImportedUser',`${canonicalSource}\\n${requireSource}\\n${buildSource}\\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));\n",
    "const hasOwnSource=extractFunction('pvHasOwnLearner');\nconst buildSource=extractFunction('pvBuildImportedUsers');\nconst api=new Function('normaliseImportedUser',`${canonicalSource}\\n${requireSource}\\n${hasOwnSource}\\n${buildSource}\\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvHasOwnLearner,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));\n",
    "QA API extraction",
)
qa = replace_once(
    qa,
    "assert.throws(()=>api.pvBuildImportedUsers({activeUser:'missing',users:{'learner-1':{}}}),/Missing active learner/);\n\n",
    "assert.throws(()=>api.pvBuildImportedUsers({activeUser:'missing',users:{'learner-1':{}}}),/Missing active learner/);\nassert.throws(()=>api.pvBuildImportedUsers({activeUser:'constructor',users:{'learner-1':{}}}),/Missing active learner/,'prototype property names must not satisfy learner membership');\nconst prototypeNamed=api.pvBuildImportedUsers({activeUser:'constructor',users:{constructor:{name:'Legacy'}}});\nassert.equal(prototypeNamed.activeUser,'constructor','an explicitly owned safe legacy prototype-name ID remains supported');\nassert.equal(Object.prototype.hasOwnProperty.call(prototypeNamed.users,'constructor'),true);\n\n",
    "prototype membership QA insertion",
)
qa = replace_once(
    qa,
    "const strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);\n",
    "const switchSource=extractFunction('switchUser');\nlet switchState={db:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1'}}},persistCalls:0,toasts:[]};\nconst guardedSwitch=new Function(`${canonicalSource}\\n${hasOwnSource}\\nlet db=arguments[0].db,user=db.users[db.activeUser];const persist=()=>arguments[0].persistCalls++;const updateGlobalProgress=()=>{};const renderInstructor=()=>{};const toast=m=>arguments[0].toasts.push(m);${switchSource}\\nreturn switchUser;`)(switchState);\nguardedSwitch('constructor');\nassert.equal(switchState.db.activeUser,'learner-1','prototype property names must not switch without an owned learner record');\nassert.equal(switchState.persistCalls,0,'rejected prototype-name switch must not persist');\nassert.equal(switchState.toasts.at(-1),'Learner profile unavailable');\n\nconst strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);\n",
    "switch own-property QA insertion",
)
qa = replace_once(
    qa,
    "assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');\n",
    "assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');\nassert(strict.includes('pvHasOwnLearner(users,active)'),'strict import must require own learner membership for the active ID');\nassert(!strict.includes('!x.users[x.activeUser]'),'strict structural gate must not use inherited learner lookup');\n",
    "strict own-property QA markers",
)
qa_path.write_text(qa, encoding="utf-8")

spec = importlib.util.spec_from_file_location("externalize_core_scripts", "tools/externalize_core_scripts.py")
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(mod)
expected = mod.expected_assets(core)
for name, body in expected.items():
    (Path("src/core-runtime") / name).write_text(body, encoding="utf-8")
mod.check_state()

release_path = Path("qa_release.py")
release = release_path.read_text(encoding="utf-8")
digest = hashlib.sha256(core_path.read_bytes()).hexdigest()
release, count = re.subn(
    r'CURRENT_CORE_SHA256 = "[0-9a-f]{64}"',
    f'CURRENT_CORE_SHA256 = "{digest}"',
    release,
    count=1,
)
if count != 1:
    raise SystemExit("CURRENT_CORE_SHA256 lock not found exactly once")
release_path.write_text(release, encoding="utf-8")
print(f"Applied owned learner registry hardening; current core SHA-256={digest}")
