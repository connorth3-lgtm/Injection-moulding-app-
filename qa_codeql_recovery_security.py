#!/usr/bin/env python3
"""Regression guard for the two historical CodeQL recovery-core findings."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
recovery = (ROOT / "MouldMaster_Core_App.html").read_text(encoding="utf-8")
generator = (ROOT / "tools/externalize_core_scripts.py").read_text(encoding="utf-8")
defect = recovery.split("function openDefect(i){", 1)[1].split("\nfunction renderScenarios(){", 1)[0]
update = recovery.split("  function mmUpdateCard(){", 1)[1].split("  function attachUpdateCard(){", 1)[0]

assert 'data-mm-coach-link="1"' in defect
assert "coachLink.addEventListener('click'" in defect
assert "setCoachPrompt(d.name)" in defect
assert "onclick=" not in defect, "defect modal must not interpolate an executable handler"
assert "replace(/'/g" not in defect, "do not use partial JS-string escaping"
assert "${esc(s.version)}</b>" in update
assert "${s.version}</b>" not in update
assert "versionValue.textContent=String(s.version||MM_APP_VERSION)" in generator
assert 'legacy_update_card = ' in generator
print("PASS: recovery source eliminates inline coach injection and unescaped update version")
