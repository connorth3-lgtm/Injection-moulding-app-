#!/usr/bin/env python3
"""Guard mobile Mission Control against covering learner and Book content."""
from pathlib import Path

css = (Path(__file__).resolve().parent / "src/domains/shell/mission-control.css").read_text(encoding="utf-8")
start = css.index("@media(max-width:700px)")
end = css.index("@media(max-width:480px)", start)
mobile = css[start:end]
start = mobile.index("body.mm-mission-active #mmMissionControl .mm-mc-timeline{")
end = mobile.index("}", start)
rule = mobile[start:end]
assert "position:relative" in rule, "mobile mission steps must stay in document flow"
assert "bottom:auto" in rule and "left:auto" in rule and "right:auto" in rule
assert "position:fixed" not in rule, "fixed bar overlaps the Book and bottom navigation"
assert "overflow:auto" in mobile and ".mm-mc-stage-track" in mobile
assert "env(safe-area-inset-bottom,0px)" in mobile
print("PASS: mobile mission steps remain in flow and respect navigation safe area")
