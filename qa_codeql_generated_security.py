"""Regression checks for runtime mitigations of immutable recovery source alerts.

CodeQL warnings on the frozen Windows recovery HTML remain open until an
explicit recovery-source migration is approved. This guard protects the
hardened, distributed web/desktop generated runtime in the meantime.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
defect = (ROOT / "src/core-runtime/core-inline-004.js").read_text(encoding="utf-8")
updates = (ROOT / "src/core-runtime/core-inline-010.js").read_text(encoding="utf-8")
generator = (ROOT / "tools/externalize_core_scripts.py").read_text(encoding="utf-8")
assert "function askCoachForDefect(i)" in defect
assert 'setCoachPrompt(String(d.name||""))' in defect
assert "setCoachPrompt('${esc(d.name).replace(" not in defect
assert "function mmUpdateCard()" in updates
assert "versionValue.textContent=String(s.version||MM_APP_VERSION)" in updates
assert "wrap.innerHTML=mmUpdateCard()" not in updates
assert "frozen defect-coach handler source drifted" in generator
assert "frozen update-card source drifted" in generator
print("PASS: generated runtime retains both frozen-source security mitigations")
