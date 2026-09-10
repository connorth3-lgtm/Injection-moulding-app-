#!/usr/bin/env python3
"""Static regression checks for the learner-guided Practice hub.

These checks deliberately cover wiring and usability contracts only. They do not
claim human accessibility validation or instructional/SME validation.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
hub = (ROOT / "primary-learning-practice-hubs.js").read_text(encoding="utf-8")
css = (ROOT / "mobile-lesson-fix.css").read_text(encoding="utf-8")

required_hub = {
    "learner model recommendations": "MM_LEARNER_MODEL",
    "recommendation API": "recommendations(3)",
    "learner summary API": "model.summary()",
    "recommended practice region": 'aria-label="Recommended practice"',
    "task-led chooser": "Choose by the job you want to practise",
    "assessment separation": "Practice is for learning; assessments stay separate.",
    "scenario rotation": "nextScenarioIndex",
    "process-data practice": 'data-mm-hub-action="process-data"',
    "troubleshooting practice": 'data-mm-hub-action="troubleshooting"',
    "labs practice": 'data-mm-hub-action="labs"',
    "personalisation refresh": "mm:domains-ready",
}
required_css = {
    "mobile practice scope": ".mm-practice-hub",
    "mobile explanation visible": ".mm-practice-hub .mm-hub-tile small",
    "mobile CTA visible": ".mm-practice-hub .mm-hub-tile-action",
    "single-column phone layout": ".mm-practice-hub .mm-hub-grid{grid-template-columns:1fr!important}",
    "reduced motion": "@media(prefers-reduced-motion:reduce)",
}

failures = []
for label, needle in required_hub.items():
    if needle not in hub:
        failures.append(f"Practice hub missing: {label}")
for label, needle in required_css.items():
    if needle not in css:
        failures.append(f"Practice CSS missing: {label}")

# Guard against accidentally turning Practice into an authority or assessment lane.
for banned in ("validated production recipe", "automatic machine setting", "machine-control authority"):
    if banned.lower() in hub.lower():
        failures.append(f"Practice hub contains authority wording that needs review: {banned}")

if failures:
    print("PRACTICE HUB QA: FAIL")
    for failure in failures:
        print(f" - {failure}")
    raise SystemExit(1)

print("PRACTICE HUB QA: PASS")
print(" - learner-guided recommendation wiring present")
print(" - task/time-oriented Practice choices present")
print(" - mobile explanations and CTAs remain visible")
print(" - assessments remain a separate lane")
print("NOTE: this is automated regression evidence, not human accessibility or SME instructional validation.")
