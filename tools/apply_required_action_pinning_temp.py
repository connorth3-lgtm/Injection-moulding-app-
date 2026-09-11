#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PINS = {
    "checkout": ("3d3c42e5aac5ba805825da76410c181273ba90b1", "v7.0.1"),
    "setup-node": ("820762786026740c76f36085b0efc47a31fe5020", "v7.0.0"),
    "setup-python": ("5fda3b95a4ea91299a34e894583c3862153e4b97", "v7"),
    "upload-artifact": ("043fb46d1a93c77aae656e7c1c64a875d1fc6a0a", "v7.0.1"),
}

WORKFLOW_ACTIONS = {
    ".github/workflows/qa.yml": tuple(PINS),
    ".github/workflows/mobile-browser-qa.yml": tuple(PINS),
    ".github/workflows/question-quality-50-pass.yml": tuple(PINS),
    ".github/workflows/open-desktop-build.yml": tuple(PINS),
}

for rel, actions in WORKFLOW_ACTIONS.items():
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    for action in actions:
        sha, annotation = PINS[action]
        old = f"uses: actions/{action}@v7"
        new = f"uses: actions/{action}@{sha} # {annotation}"
        count = text.count(old)
        if count < 1:
            raise SystemExit(f"{rel}: expected at least one mutable {old}, found {count}")
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")

policy = ROOT / "qa_critical_actions_versions.py"
text = policy.read_text(encoding="utf-8")
old = '    ".github/workflows/mobile-browser-qa.yml",\n    ".github/workflows/open-desktop-build.yml",\n'
new = '    ".github/workflows/mobile-browser-qa.yml",\n    ".github/workflows/question-quality-50-pass.yml",\n    ".github/workflows/open-desktop-build.yml",\n'
if text.count(old) != 1:
    raise SystemExit("critical workflow inventory insertion point changed")
text = text.replace(old, new, 1)

old = 'CORE = {"checkout", "setup-python", "setup-node", "upload-artifact"}\nREQUIRED_MAJOR = 7\n'
new = '''CORE = {"checkout", "setup-python", "setup-node", "upload-artifact"}\nREQUIRED_MAJOR = 7\nREQUIRED_SHA_WORKFLOWS = {\n    ".github/workflows/qa.yml",\n    ".github/workflows/mobile-browser-qa.yml",\n    ".github/workflows/question-quality-50-pass.yml",\n    ".github/workflows/open-desktop-build.yml",\n}\nREVIEWED_SHA = {\n    "checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",\n    "setup-node": "820762786026740c76f36085b0efc47a31fe5020",\n    "setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",\n    "upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",\n}\n'''
if text.count(old) != 1:
    raise SystemExit("critical action constants insertion point changed")
text = text.replace(old, new, 1)

old = '        refs.append((name, major, kind))\n'
new = '        refs.append((name, ref, major, kind))\n'
if text.count(old) != 1:
    raise SystemExit("governed ref tuple shape changed")
text = text.replace(old, new, 1)

old = '    bad = [(name, major) for name, major, _ in refs if name in CORE and major != REQUIRED_MAJOR]\n    need(not bad, f"critical workflow uses stale core Action major(s) {bad}: {rel}")\n'
new = '''    bad = [(name, major) for name, _, major, _ in refs if name in CORE and major != REQUIRED_MAJOR]\n    need(not bad, f"critical workflow uses stale core Action major(s) {bad}: {rel}")\n    if rel in REQUIRED_SHA_WORKFLOWS:\n        for name, ref, major, kind in refs:\n            if name not in CORE:\n                continue\n            need(kind == "commit-sha", f"required status-check workflow must SHA-pin actions/{name}: {rel}")\n            need(ref == REVIEWED_SHA[name], f"required status-check workflow uses unreviewed SHA for actions/{name}: {rel}")\n'''
if text.count(old) != 1:
    raise SystemExit("critical action enforcement block changed")
text = text.replace(old, new, 1)

old = '        "majors": sorted({major for _, major, _ in refs}),\n        "shaPinnedRefs": sum(1 for _, _, kind in refs if kind == "commit-sha"),\n'
new = '        "majors": sorted({major for _, _, major, _ in refs}),\n        "shaPinnedRefs": sum(1 for _, _, _, kind in refs if kind == "commit-sha"),\n'
if text.count(old) != 1:
    raise SystemExit("critical action report tuple shape changed")
text = text.replace(old, new, 1)

old = '    f"({len(WORKFLOWS)} active workflows use core Action major v{REQUIRED_MAJOR}; reviewed SHA pins accepted with explicit major annotations)"\n'
new = '    f"({len(WORKFLOWS)} active workflows use core Action major v{REQUIRED_MAJOR}; required status checks use exact reviewed SHA pins)"\n'
if text.count(old) != 1:
    raise SystemExit("critical action success message changed")
text = text.replace(old, new, 1)
policy.write_text(text, encoding="utf-8")

print("Pinned all core Actions in required status-check workflows to exact reviewed v7 commits.")
