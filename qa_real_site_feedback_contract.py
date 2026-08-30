from pathlib import Path
import csv
import json

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "data/real-site-pilot-feedback-template.csv"
DOC = ROOT / "sources/REAL_SITE_PILOT_FEEDBACK.md"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

required = [
    "pilot_session_alias", "session_date", "user_role", "scenario_id", "device_class",
    "evidence_seen", "evidence_relevance_rating_1_5", "evidence_noise_rating_1_5",
    "why_relevant_clear", "boundary_clear", "decision_helped", "decision_changed",
    "operator_override_used", "unsafe_or_overconfident_claim_seen",
    "mobile_or_desktop_issue", "outcome_category", "notes_redacted",
]
with TEMPLATE.open(newline="", encoding="utf-8") as fh:
    rows = list(csv.reader(fh))
need(len(rows) == 1, "feedback template must contain header only; do not fabricate pilot observations")
need(rows[0] == required, "real-site feedback template schema drifted")

for forbidden in [
    "name", "email", "customer", "company", "machine_serial", "mould_id", "mold_id",
    "tool_id", "material_lot", "order_number", "raw_value", "setpoint", "raw_timestamp",
]:
    need(forbidden not in rows[0], f"privacy-sensitive feedback column forbidden: {forbidden}")

doc = DOC.read_text(encoding="utf-8")
for marker in [
    "not evidence that a pilot has occurred",
    "Do not enter names",
    "raw process values",
    "proprietary setpoints",
    "does **not** create, simulate, infer, or claim real-site feedback",
    "authorised human reviewers",
]:
    need(marker in doc, f"real-site feedback boundary missing: {marker}")

report = {
    "schema": 1,
    "result": "pass",
    "feedbackColumns": len(required),
    "templateRows": 0,
    "containsFabricatedFeedback": False,
    "rawProcessValuesAllowed": False,
    "personalOrSiteIdentifiersAllowed": False,
    "completionBoundary": "Real-site feedback requires authorised human review; repository QA only validates the feedback contract.",
}
(ROOT / "real-site-feedback-contract-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster real-site feedback contract QA passed (privacy-safe schema; no fabricated pilot feedback)")
