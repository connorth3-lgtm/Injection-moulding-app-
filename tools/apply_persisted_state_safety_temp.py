#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = "2026.09.12.13"
NEW = "2026.09.12.14"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    source = read(path)
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one target, found {count}")
    write(path, source.replace(old, new, 1))


# 1. Fail closed on persisted state that can change assessment safety or inflate progress.
replace_once(
    "MouldMaster_Core_App.html",
    '''  if(typeof record.name!=="string")return false;\n  if(!mmStartupUniqueLessonIdsAreSafe(record.completed)||!mmStartupUniqueLessonIdsAreSafe(record.bookmarks)||!mmStartupCertificatesAreSafe(record.certificates))return false;''',
    '''  if(typeof record.name!=="string")return false;\n  if(record.currentLesson!=null&&(!Number.isInteger(record.currentLesson)||record.currentLesson<1||record.currentLesson>D.lessons.length))return false;\n  if(record.region!=null&&record.region!==""&&!["ALL","UK","US","NZ"].includes(record.region))return false;\n  if(!mmStartupUniqueLessonIdsAreSafe(record.completed)||!mmStartupUniqueLessonIdsAreSafe(record.bookmarks)||!mmStartupCertificatesAreSafe(record.certificates))return false;''',
)
replace_once(
    "MouldMaster_Core_App.html",
    '''    if(m.completed!=null&&(!Array.isArray(m.completed)||m.completed.some(value=>!Number.isInteger(value)||value<1||value>36)))return false;''',
    '''    if(m.completed!=null&&(!Array.isArray(m.completed)||m.completed.length>36||new Set(m.completed).size!==m.completed.length||m.completed.some(value=>!Number.isInteger(value)||value<1||value>36)))return false;''',
)
replace_once(
    "MouldMaster_Core_App.html",
    '''if(user.onboardingDone === undefined) user.onboardingDone = false;\nif(!user.experience) user.experience = "Beginner";''',
    '''if(user.onboardingDone === undefined) user.onboardingDone = false;\nif(user.currentLesson == null) user.currentLesson = 1;\nif(!user.experience) user.experience = "Beginner";''',
)
replace_once(
    "MouldMaster_Core_App.html",
    '''/* Compare All assesses ALL 9 regional items, not one sample per jurisdiction. */\ngetExamQuestions=function(level,region){\n  const technical=shuffleCopy((D.exams[level]||[]).map(normaliseTechnicalQuestion10)).slice(0,7);''',
    '''/* Compare All assesses ALL 9 regional items, not one sample per jurisdiction. */\ngetExamQuestions=function(level,region){\n  if(!["Beginner","Intermediate","Advanced"].includes(level)||!["ALL","UK","US","NZ"].includes(region))throw new Error("Assessment selector rejected unknown level or region");\n  const technical=shuffleCopy((D.exams[level]||[]).map(normaliseTechnicalQuestion10)).slice(0,7);''',
)
replace_once(
    "MouldMaster_Core_App.html",
    '''  localStorage.setItem("mouldmasterProDB",serialized);\n  db=proposed;user=nextUser;\n  return proposed;\n}\nresetData=function(){''',
    '''  localStorage.setItem("mouldmasterProDB",serialized);\n  db=proposed;user=nextUser;\n  try{mmSetStorageDurability(true)}catch(_){}\n  return proposed;\n}\nresetData=function(){''',
)
replace_once(
    "MouldMaster_Core_App.html",
    '''function pvCommitImportedUsers(proposed){\n  const active=proposed&&proposed.activeUser;\n  if(!pvHasOwnLearner(proposed&&proposed.users,active))throw new Error("Missing active learner");\n  const nextUser=proposed.users[active];\n  nextUser.lastSeen=new Date().toISOString();\n  const serialized=JSON.stringify(proposed);\n  localStorage.setItem("mouldmasterProDB",serialized);\n  db=proposed;user=nextUser;\n}\n''',
    '''function pvCommitImportedUsers(proposed){\n  const active=proposed&&proposed.activeUser;\n  if(!pvHasOwnLearner(proposed&&proposed.users,active))throw new Error("Missing active learner");\n  const nextUser=proposed.users[active];\n  nextUser.lastSeen=new Date().toISOString();\n  const serialized=JSON.stringify(proposed);\n  localStorage.setItem("mouldmasterProDB",serialized);\n  db=proposed;user=nextUser;\n  try{mmSetStorageDurability(true)}catch(_){}\n}\n''',
)

# 2. The hosted assessment owner must never delegate an unknown region to the legacy selector.
replace_once(
    "assessment-runtime-v2.js",
    '''const legacySelector=window.getExamQuestions;\nfunction selector(level,region){if(!['Beginner','Intermediate','Advanced'].includes(level)||!['UK','US','NZ','ALL'].includes(region))return legacySelector.apply(this,arguments);return nextExam(level,region)}''',
    '''function selector(level,region){if(!['Beginner','Intermediate','Advanced'].includes(level)||!['UK','US','NZ','ALL'].includes(region))throw new Error('Assessment selector rejected unknown level or region');return nextExam(level,region)}''',
)

# 3. Successful hosted import/reset proves storage recovered, so remove any stale session-only warning.
replace_once(
    "training-qa-fix.js",
    '''   db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();''',
    '''   db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();try{window.mmSetStorageDurability?.(true)}catch(_){}''',
)
replace_once(
    "training-qa-fix.js",
    ''' const beforeDb=db;db=proposedReset;user=db.users[db.activeUser];if(db!==beforeDb)cancelActiveExam();''',
    ''' const beforeDb=db;db=proposedReset;user=db.users[db.activeUser];if(db!==beforeDb)cancelActiveExam();try{window.mmSetStorageDurability?.(true)}catch(_){}''',
)

# 4. Regenerate deterministic core-runtime slots from the authoritative standalone core.
spec = importlib.util.spec_from_file_location("mm_externalize_core", ROOT / "tools/externalize_core_scripts.py")
if spec is None or spec.loader is None:
    raise SystemExit("Could not load core runtime generator")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
core = read("MouldMaster_Core_App.html")
for name, body in module.expected_assets(core).items():
    write(f"src/core-runtime/{name}", body)

# 5. Extend behavioral regression coverage around the exact holes found in audit.
qa = read("qa_standalone_learner_ids.cjs")
marker = "assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-XX'),false);\n"
insert = r'''assert.equal(startupApi.mmStartupCertificateKeyIsSafe('Advanced-XX'),false);
{
  const bad=legacyRecord(); bad.region='ZZ';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'unknown persisted region must fail closed before assessment selection');
}
{
  const bad=legacyRecord(); bad.currentLesson='1';
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'non-integer persisted current lesson must fail closed before navigation');
}
{
  const bad=legacyRecord(); bad.currentLesson=121;
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'out-of-range persisted current lesson must fail closed before navigation');
}
{
  const bad=legacyRecord(); bad.materialScience={completed:[1,1],bestQuiz:80,quizAttempts:1,currentLesson:1};
  assert.equal(startupApi.mmSelectStartupDb({activeUser:'learner-1',users:{'learner-1':bad}},pristine).rejected,true,'duplicate material lesson IDs must not inflate material progress or achievements');
}
'''
if qa.count(marker) != 1:
    raise SystemExit("qa_standalone_learner_ids.cjs: certificate marker missing")
qa = qa.replace(marker, insert, 1)
marker = '''assert.equal((source.match(/m\\.bestQuiz==null\\?"—":esc\\(m\\.bestQuiz\\)\\+"%"/g)||[]).length,2,'both material best-quiz HTML sinks must escape persisted values');\n'''
insert = marker + '''assert(source.includes('Assessment selector rejected unknown level or region'),'standalone assessment selection must fail closed on unknown level or region');\nassert(commitSource.includes('mmSetStorageDurability(true)')&&resetCommitSource.includes('mmSetStorageDurability(true)'),'successful storage-first import/reset must clear a stale session-only warning');\nconst assessmentV2Source=fs.readFileSync('assessment-runtime-v2.js','utf8');\nassert(assessmentV2Source.includes("throw new Error('Assessment selector rejected unknown level or region')"),'hosted assessment selector must fail closed on unknown region/level');\nassert(!assessmentV2Source.includes('return legacySelector.apply'),'hosted assessment selector must not delegate unknown region/level to the legacy selector');\n'''
if qa.count(marker) != 1:
    raise SystemExit("qa_standalone_learner_ids.cjs: material sink marker missing")
qa = qa.replace(marker, insert, 1)
marker = '''const bridgeSource=fs.readFileSync('training-qa-fix.js','utf8');\n'''
insert = marker + '''assert.equal(bridgeSource.split('mmSetStorageDurability?.(true)').length-1,2,'hosted import/reset must clear stale session-only storage warnings after successful writes');\n'''
if qa.count(marker) != 1:
    raise SystemExit("qa_standalone_learner_ids.cjs: bridge source marker missing")
qa = qa.replace(marker, insert, 1)
write("qa_standalone_learner_ids.cjs", qa)

# 6. Bind release QA to the stronger startup/assessment/persistence contracts.
release = read("qa_release.py")
old_line = 'assert "function mmStartupUniqueLessonIdsAreSafe(values)" in core and "function mmStartupCertificatesAreSafe(values)" in core and "mmStartupCertificatesAreSafe(record.certificates)" in core, "persisted learner registry must validate unique in-range progress/bookmark IDs and recognized certificate keys before rendering"\n'
new_lines = old_line + 'assert "record.currentLesson!=null" in core and "record.region!=null" in core and "m.completed.length>36" in core and "new Set(m.completed).size!==m.completed.length" in core, "persisted learner registry must fail closed on unsafe lesson pointers, regions and duplicate material progress"\n' + 'assert "Assessment selector rejected unknown level or region" in core and core.count("mmSetStorageDurability(true)") >= 2, "standalone assessment/storage recovery hardening missing"\n'
if release.count(old_line) != 1:
    raise SystemExit("qa_release.py: startup integrity marker missing")
release = release.replace(old_line, new_lines, 1)
old = '''for marker in ["technicalPerExam:7", "technicalBankPerLevel:10", "least-exposed blueprint-preserving stable IDs", "R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2')"]:\n'''
new = '''for marker in ["technicalPerExam:7", "technicalBankPerLevel:10", "least-exposed blueprint-preserving stable IDs", "R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2')", "Assessment selector rejected unknown level or region"]:\n'''
if release.count(old) != 1:
    raise SystemExit("qa_release.py: assessment runtime marker list missing")
release = release.replace(old, new, 1)
marker = 'bridge = text("training-qa-fix.js")\n'
insert = marker + 'assert bridge.count("mmSetStorageDurability?.(true)") == 2, "hosted import/reset must clear stale session-only storage warnings after successful writes"\n'
if release.count(marker) != 1:
    raise SystemExit("qa_release.py: bridge marker missing")
release = release.replace(marker, insert, 1)
release = release.replace(f'WEB_RELEASE = "{OLD}"', f'WEB_RELEASE = "{NEW}"', 1)
write("qa_release.py", release)

# 7. Advance only the governed web release and bind release-specific external evidence.
version = json.loads(read("version.json"))
if version.get("web_release") != OLD:
    raise SystemExit(f"Unexpected web release {version.get('web_release')!r}")
version["web_release"] = NEW
write("version.json", json.dumps(version, indent=2) + "\n")
for path in ["README.md", "support.html"]:
    source = read(path)
    if OLD not in source:
        raise SystemExit(f"{path}: old web release missing")
    write(path, source.replace(OLD, NEW))
external = json.loads(read("data/release-external-validation-v1.json"))
if external.get("release") != OLD:
    raise SystemExit("External validation release mismatch")
external["release"] = NEW
write("data/release-external-validation-v1.json", json.dumps(external, indent=2) + "\n")
replace_once("qa_release_docs.py", f" 'web_release':'{OLD}',", f" 'web_release':'{NEW}',")

# Update the standalone audited-byte lock after all core edits.
core_sha = hashlib.sha256((ROOT / "MouldMaster_Core_App.html").read_bytes()).hexdigest()
release = read("qa_release.py")
prefix = 'CURRENT_CORE_SHA256 = "'
start = release.find(prefix)
end = release.find('"', start + len(prefix))
if start < 0 or end < 0:
    raise SystemExit("Core hash lock missing")
release = release[: start + len(prefix)] + core_sha + release[end:]
write("qa_release.py", release)

print(f"Prepared persisted-state assessment safety hardening for {NEW}; core sha256={core_sha}")
