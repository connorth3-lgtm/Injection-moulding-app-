#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_RELEASE = "2026.09.15.2"
NEW_RELEASE = "2026.09.15.3"
PACK = "src/domains/runtime-packs/assessment-foundation-runtime-pack.js"
PACK_URL = "./" + PACK
SOURCES = (
    "assessment-100-pass.js",
    "assessment-deep-dive.js",
    "assessment-answer-cue-fix.js",
    "assessment-storage-scope.js",
    "assessment-quality-suite.js",
    "assessment-stable-review-bridge.js",
    "assessment-analytics-ui.js",
    "assessment-final-hardening.js",
)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    if new in text and old not in text:
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement target, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


# Browser bootstrap: replace eight direct root script requests with one deterministic pack.
index_path = ROOT / "index.html"
index_lines = index_path.read_text(encoding="utf-8").splitlines(keepends=True)
if PACK_URL not in "".join(index_lines):
    out: list[str] = []
    inserted = False
    for line in index_lines:
        if any(f"['./{source}','<script" in line for source in SOURCES):
            if not inserted:
                indent = line[: len(line) - len(line.lstrip())]
                out.extend(f"{indent}// packed source './{source}'\n" for source in SOURCES)
                out.append(f"{indent}['{PACK_URL}','<script src=\"{PACK_URL}\">'],\n")
                inserted = True
            continue
        out.append(line)
    require(inserted, "index.html: assessment source bootstrap rows were not found")
    index_path.write_text("".join(out), encoding="utf-8")
index = read("index.html")
for source in SOURCES:
    require(f"['./{source}','<script" not in index, f"index.html still directly injects {source}")
    require(f"// packed source './{source}'" in index, f"index.html missing packed-source breadcrumb for {source}")
require(PACK_URL in index, "index.html missing assessment foundation pack")

# Offline contract: cache the pack, not eight redundant network assets.
sw_path = ROOT / "service-worker.js"
sw_lines = sw_path.read_text(encoding="utf-8").splitlines(keepends=True)
out = []
inserted = PACK_URL in "".join(sw_lines)
for line in sw_lines:
    if any(re.fullmatch(rf"\s*'\./{re.escape(source)}',?\s*\n?", line) for source in SOURCES):
        continue
    out.append(line)
    if not inserted and "'./src/domains/runtime-packs/learning-foundation-runtime-pack.js'" in line:
        indent = line[: len(line) - len(line.lstrip())]
        out.append(f"{indent}'{PACK_URL}',\n")
        inserted = True
require(inserted, "service-worker.js: could not register assessment foundation pack")
sw_path.write_text("".join(out), encoding="utf-8")
sw = read("service-worker.js")
for source in SOURCES:
    require(f"'./{source}'" not in sw, f"service-worker.js still caches retired direct assessment source {source}")
require(f"'{PACK_URL}'" in sw, "service-worker.js missing assessment foundation pack")

# Lower the architecture ceilings and retire the eight direct-root bootstrap permits.
baseline_path = ROOT / "qa/architecture-debt-baseline.json"
baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
baseline["runtimeBodyScriptCeiling"] = 30
baseline["rootRuntimeScriptCeiling"] = 25
retired = {f"./{source}" for source in SOURCES}
baseline["grandfatheredRootRuntimeScripts"] = [x for x in baseline["grandfatheredRootRuntimeScripts"] if x not in retired]
baseline_path.write_text(json.dumps(baseline, indent=2) + "\n", encoding="utf-8")

# App-wide audit owns exact pack/source parity and the lower bootstrap floor.
replace_once(
    "qa_app_wide_audit.py",
    'need(len(body_scripts) >= 37, f"runtime BODY_SCRIPTS extraction unexpectedly small: {len(body_scripts)}")',
    'need(len(body_scripts) >= 30, f"runtime BODY_SCRIPTS extraction unexpectedly small: {len(body_scripts)}")',
)
replace_once(
    "qa_app_wide_audit.py",
    '    "./src/domains/runtime-packs/learning-foundation-runtime-pack.js",\n    "./src/domains/runtime-packs/evidence-runtime-pack.js",',
    '    "./src/domains/runtime-packs/learning-foundation-runtime-pack.js",\n    "./src/domains/runtime-packs/assessment-foundation-runtime-pack.js",\n    "./src/domains/runtime-packs/evidence-runtime-pack.js",',
)
assessment_audit = '''assessment_sources = (\n    "assessment-100-pass.js",\n    "assessment-deep-dive.js",\n    "assessment-answer-cue-fix.js",\n    "assessment-storage-scope.js",\n    "assessment-quality-suite.js",\n    "assessment-stable-review-bridge.js",\n    "assessment-analytics-ui.js",\n    "assessment-final-hardening.js",\n)\nassessment_pack = text("src/domains/runtime-packs/assessment-foundation-runtime-pack.js")\nassessment_positions = []\nfor source in assessment_sources:\n    marker = f"/* >>> {source} */"\n    need(marker in assessment_pack, f"assessment foundation runtime pack missing source marker: {source}")\n    assessment_positions.append(assessment_pack.index(marker))\n    need(f"// packed source './{source}'" in index, f"browser bootstrap does not document packed assessment source: {source}")\n    need(f"['./{source}','<script" not in index, f"retired assessment source is still directly injected: {source}")\n    need(f'"{source}"' in pack_builder, f"runtime pack generator does not own assessment source: {source}")\nneed(assessment_positions == sorted(assessment_positions), "assessment foundation pack source order drifted")\nneed('"assessment-foundation-runtime-pack.js"' in pack_builder, "assessment foundation pack is missing from deterministic generator")\n'''
qa_app = read("qa_app_wide_audit.py")
anchor = 'need(\'"learning-foundation-runtime-pack.js"\' in pack_builder, "learning foundation pack is missing from deterministic generator")\n'
if assessment_audit not in qa_app:
    require(anchor in qa_app, "qa_app_wide_audit.py: learning-pack anchor missing")
    qa_app = qa_app.replace(anchor, anchor + assessment_audit, 1)
    write("qa_app_wide_audit.py", qa_app)

# 100-pass shipping checks now validate the pack boundary while source-level tests stay intact.
replace_once(
    "qa_100_pass.py",
    'learning_pack="src/domains/runtime-packs/learning-foundation-runtime-pack.js"\naudit(\'<script src="./assessment-100-pass.js">\' in idx and learning_pack in idx and idx.index(learning_pack)<idx.index("assessment-100-pass.js")<idx.index("source-library.js"),"shell audit load order")\naudit("\'./assessment-100-pass.js\'" in text("service-worker.js"),"offline audit asset")',
    'learning_pack="src/domains/runtime-packs/learning-foundation-runtime-pack.js"\nassessment_pack="src/domains/runtime-packs/assessment-foundation-runtime-pack.js"\naudit(assessment_pack in idx and learning_pack in idx and idx.index(learning_pack)<idx.index(assessment_pack)<idx.index("runtime-v2.js")<idx.index("source-library.js"),"shell audit pack load order")\naudit("\'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js\'" in text("service-worker.js"),"offline assessment pack")',
)

# Question deep-dive, assessment quality, storage and final-hardening QA continue to
# validate the source files directly, but browser/offline assertions move to the pack boundary.
replace_once(
    "qa_question_deep_dive.py",
    "need(idx.index('assessment-deep-dive.js')<idx.index('assessment-answer-cue-fix.js')<idx.index('assessment-quality-suite.js'),'assessment rewrite load order wrong')\nneed(\"'./assessment-deep-dive.js'\" in text('service-worker.js') and \"'./assessment-answer-cue-fix.js'\" in text('service-worker.js'),'assessment patches not cached offline')",
    "assessment_pack='src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\npack=text(assessment_pack)\nneed(pack.index('/* >>> assessment-deep-dive.js */')<pack.index('/* >>> assessment-answer-cue-fix.js */')<pack.index('/* >>> assessment-quality-suite.js */'),'assessment rewrite pack order wrong')\nneed(assessment_pack in idx and idx.index(assessment_pack)<idx.index('runtime-v2.js'),'assessment rewrite pack load order wrong')\nneed(\"'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\" in text('service-worker.js'),'assessment patches pack not cached offline')",
)
replace_once(
    "qa_assessment_quality.py",
    "for asset in ['assessment-storage-scope.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:need(f'<script src=\"./{asset}\">' in idx,f'{asset} not loaded by shell')\nneed(idx.index('assessment-deep-dive.js')<idx.index('assessment-answer-cue-fix.js')<idx.index('assessment-storage-scope.js')<idx.index('assessment-quality-suite.js')<idx.index('assessment-stable-review-bridge.js')<idx.index('assessment-analytics-ui.js')<idx.index('source-library.js'),'assessment quality stack load order wrong')\nsw=text('service-worker.js')\nfor asset in ['assessment-storage-scope.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:need(f\"'./{asset}'\" in sw,f'{asset} not cached offline')",
    "assessment_pack='src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\npack=text(assessment_pack)\nassessment_sources=['assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-storage-scope.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']\nneed(assessment_pack in idx and all(f'<script src=\"./{asset}\">' not in idx for asset in assessment_sources),'assessment quality stack must load through deterministic pack only')\npositions=[pack.index(f'/* >>> {asset} */') for asset in assessment_sources]\nneed(positions==sorted(positions),'assessment quality pack source order wrong')\nsw=text('service-worker.js')\nneed(\"'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\" in sw,'assessment quality pack not cached offline')",
)
replace_once(
    "qa_assessment_storage_scope.py",
    "idx=text('index.html');need('<script src=\"./assessment-storage-scope.js\">' in idx,'storage scope not loaded by shell')\nneed(idx.index('assessment-deep-dive.js')<idx.index('assessment-storage-scope.js')<idx.index('assessment-quality-suite.js'),'storage scope load order must precede analytics suite')\nneed(\"'./assessment-storage-scope.js'\" in text('service-worker.js'),'storage scope missing from offline cache')",
    "idx=text('index.html');assessment_pack='src/domains/runtime-packs/assessment-foundation-runtime-pack.js';pack=text(assessment_pack)\nneed(assessment_pack in idx and '<script src=\"./assessment-storage-scope.js\">' not in idx,'storage scope must load through assessment foundation pack')\nneed(pack.index('/* >>> assessment-deep-dive.js */')<pack.index('/* >>> assessment-storage-scope.js */')<pack.index('/* >>> assessment-quality-suite.js */'),'storage scope pack order must precede analytics suite')\nneed(\"'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\" in text('service-worker.js'),'assessment foundation pack missing from offline cache')",
)
replace_once(
    "qa_assessment_final_hardening.py",
    "idx=text('index.html')\nneed('<script src=\"./assessment-storage-scope.js\">' in idx,'learner-scoped assessment storage not loaded by shell')\nneed('<script src=\"./assessment-final-hardening.js\">' in idx,'final hardening not loaded by shell')\nneed(idx.index('assessment-storage-scope.js')<idx.index('assessment-analytics-ui.js')<idx.index('assessment-final-hardening.js')<idx.index('source-library.js'),'final hardening/scoped-storage load order wrong')\nneed(\"'./assessment-storage-scope.js'\" in text('service-worker.js'),'scoped assessment storage missing from offline cache')\nneed(\"'./assessment-final-hardening.js'\" in text('service-worker.js'),'final hardening missing from offline cache')",
    "idx=text('index.html');assessment_pack='src/domains/runtime-packs/assessment-foundation-runtime-pack.js';pack=text(assessment_pack)\nneed(assessment_pack in idx and '<script src=\"./assessment-storage-scope.js\">' not in idx and '<script src=\"./assessment-final-hardening.js\">' not in idx,'assessment storage/final hardening must load through deterministic pack')\nneed(pack.index('/* >>> assessment-storage-scope.js */')<pack.index('/* >>> assessment-analytics-ui.js */')<pack.index('/* >>> assessment-final-hardening.js */'),'final hardening/scoped-storage pack order wrong')\nneed(idx.index(assessment_pack)<idx.index('runtime-v2.js')<idx.index('source-library.js'),'assessment foundation pack boundary wrong')\nneed(\"'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\" in text('service-worker.js'),'assessment foundation pack missing from offline cache')",
)

# Runtime and release guards anchor execution ordering to the generated pack.
replace_once(
    "qa_runtime_hardening.py",
    "require(index.index(\"'./assessment-final-hardening.js'\") < index.index(\"'./runtime-v2.js'\") < index.index(\"'./assessment-runtime-v2.js'\") < index.index(\"'./assessment-ux.js'\"), \"runtime v2 must capture the audited assessment functions before the new selector owns getExamQuestions and before assessment UX decorates it\")",
    "require(index.index(\"'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'\") < index.index(\"'./runtime-v2.js'\") < index.index(\"'./assessment-runtime-v2.js'\") < index.index(\"'./assessment-ux.js'\"), \"runtime v2 must capture the packed audited assessment functions before the new selector owns getExamQuestions and before assessment UX decorates it\")",
)
release = read("qa_release.py")
release = release.replace(
    '    "src/domains/runtime-packs/learning-foundation-runtime-pack.js",\n    "learning-experience.js",',
    '    "src/domains/runtime-packs/learning-foundation-runtime-pack.js",\n    "src/domains/runtime-packs/assessment-foundation-runtime-pack.js",\n    "learning-experience.js",',
    1,
)
release = release.replace(
    '"src/domains/runtime-packs/learning-foundation-runtime-pack.js", "source-library.js"',
    '"src/domains/runtime-packs/learning-foundation-runtime-pack.js", "src/domains/runtime-packs/assessment-foundation-runtime-pack.js", "source-library.js"',
    1,
)
release = release.replace(
    'assert index.index("\'./assessment-final-hardening.js\'") < index.index("\'./runtime-v2.js\'") < index.index("\'./assessment-runtime-v2.js\'") < index.index("\'./assessment-ux.js\'"), "runtime-v2 assessment ownership load order is wrong"',
    'assert index.index("\'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js\'") < index.index("\'./runtime-v2.js\'") < index.index("\'./assessment-runtime-v2.js\'") < index.index("\'./assessment-ux.js\'"), "runtime-v2 assessment ownership load order is wrong"',
    1,
)
if 'assessment foundation direct source is still injected' not in release:
    marker = 'assert index.index("\'./specialist-curriculum.js\'") < index.index("\'./specialist-evidence-gap-extension.js\'") < index.index("\'./mould-master-workspace.js\'") < index.index("\'./app-shell-finalize.js\'"), "specialist evidence/runtime finalizer load order is wrong"\n'
    require(marker in release, "qa_release.py: order insertion anchor missing")
    release = release.replace(marker, marker + 'for retired in ["assessment-100-pass.js","assessment-deep-dive.js","assessment-answer-cue-fix.js","assessment-storage-scope.js","assessment-quality-suite.js","assessment-stable-review-bridge.js","assessment-analytics-ui.js","assessment-final-hardening.js"]:\n    assert f"\'./{retired}\'" not in index, f"assessment foundation direct source is still injected: {retired}"\n', 1)
write("qa_release.py", release)

# Desktop integrity hashes the generated runtime pack while retaining source parts as auditable inputs.
replace_once(
    "desktop/electron/scripts/generate-integrity.cjs",
    "'src/domains/domain-bootstrap.js',RUNTIME_MANIFEST,'src/domains/runtime-packs/learning-foundation-runtime-pack.js','src/domains/runtime-packs/evidence-runtime-pack.js'",
    "'src/domains/domain-bootstrap.js',RUNTIME_MANIFEST,'src/domains/runtime-packs/learning-foundation-runtime-pack.js','src/domains/runtime-packs/assessment-foundation-runtime-pack.js','src/domains/runtime-packs/evidence-runtime-pack.js'",
)

# Advance release generation and keep release-specific HOLD evidence truthful.
version_path = ROOT / "version.json"
version = json.loads(version_path.read_text(encoding="utf-8"))
require(version.get("web_release") in {OLD_RELEASE, NEW_RELEASE}, f"unexpected web release: {version.get('web_release')}")
version["web_release"] = NEW_RELEASE
version_path.write_text(json.dumps(version, indent=2) + "\n", encoding="utf-8")

for path in ["data/book-sme-review-v1.json", "src/domains/learning/book-data/book-sme-review-v1.json", "data/learner-pilot-v1.json"]:
    data = json.loads(read(path))
    require(data.get("release") in {OLD_RELEASE, NEW_RELEASE}, f"{path}: unexpected release {data.get('release')}")
    data["release"] = NEW_RELEASE
    write(path, json.dumps(data, indent=2) + "\n")

external_path = "data/release-external-validation-v1.json"
external = json.loads(read(external_path))
require(external.get("release") in {OLD_RELEASE, NEW_RELEASE}, f"{external_path}: unexpected release")
external["release"] = NEW_RELEASE
external["bookSme"]["reviewPacket"] = "qa/BOOK_SME_REVIEW_2026.09.15.3.md"
external["learnerOutcomes"]["pilotPacket"] = "qa/LEARNER_PILOT_2026.09.15.3.md"
write(external_path, json.dumps(external, indent=2) + "\n")

for stem in ["BOOK_SME_REVIEW", "LEARNER_PILOT"]:
    old_path = ROOT / f"qa/{stem}_2026.09.15.2.md"
    new_path = ROOT / f"qa/{stem}_2026.09.15.3.md"
    if not new_path.exists():
        require(old_path.is_file(), f"missing source packet: {old_path}")
        new_path.write_text(old_path.read_text(encoding="utf-8").replace(OLD_RELEASE, NEW_RELEASE), encoding="utf-8")

# Synchronise all machine/public release labels after runtime/offline edits.
subprocess.run(["python", "tools/sync_web_release.py"], cwd=ROOT, check=True)
subprocess.run(["python", "tools/build_runtime_packs.py", "--check"], cwd=ROOT, check=True)

print("Assessment foundation runtime migration staged for", NEW_RELEASE)
