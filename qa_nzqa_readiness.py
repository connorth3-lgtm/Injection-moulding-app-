from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
CERT = ROOT / "certification"


def read(path):
    return Path(path).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


roadmap = read(CERT / "README.md")
draft = read(CERT / "NZQA_MICROCREDENTIAL_DRAFT.md")
matrix = read(CERT / "NZQA_2026_EVIDENCE_MATRIX.md")
outreach = read(CERT / "PROVIDER_PARTNERSHIP_OUTREACH.md")

# Current 2026 rule baseline must be explicit and internally coherent.
for body, name in [(roadmap, "roadmap"), (draft, "draft"), (matrix, "matrix")]:
    require("2026" in body, f"{name} does not identify current NZQA rule baseline")
    require("1–40 credits" in body, f"{name} is missing current micro-credential credit range")
    require("10 notional learning hours" in body, f"{name} is missing the NZQCF credit-hour definition")

require("19 January 2026" in roadmap, "roadmap is missing the current rule commencement date")
require("Industry Skills Board" in roadmap and "ISB" in roadmap, "roadmap is missing 2026 ISB terminology")
require("ISBs may apply for listing/approval but not provider accreditation" in matrix, "matrix does not preserve provider/ISB role boundary")
require("MyNZQA" in roadmap and "MyNZQA" in draft, "eligible provider application route is not explicit")

# MouldMaster must not invent level, credit or approval status before provider work.
for body, name in [(roadmap, "roadmap"), (draft, "draft"), (matrix, "matrix"), (outreach, "outreach")]:
    lower = body.lower()
    require("not nzqa approved" in lower or "not yet accredited by nzqa" in lower or "not evidence of nzqa approval" in lower or "do not state or imply that mouldmaster academy is nzqa approved" in lower,
            f"{name} is missing explicit NZQA non-approval status")

require("No claim is made here about NZQCF level" in draft, "draft must not invent an NZQCF level")
require("Do **not** reverse-engineer credits from app screen time" in matrix, "credit workload safeguard missing")
require("final title, level and credits are agreed" in matrix, "provider decision gate missing")

# Provider-owned capability must remain clearly separated from repository evidence.
for marker in [
    "assessment instruments and marking schedules",
    "assessor/moderator capability",
    "learner support",
    "RPL/credit/completion rules",
    "official record/achievement reporting route",
]:
    require(marker in matrix, f"NZQA provider-owned evidence gap missing: {marker}")

for marker in [
    "Who would own the MyNZQA application",
    "assessor/moderator competence",
    "learner identity, enrolment, privacy, support, complaints and appeals",
    "official achievement reporting",
]:
    require(marker in outreach, f"provider qualification question missing: {marker}")

# Prevent stale pre-2026 terminology/assumptions from returning.
for body, name in [(roadmap, "roadmap"), (draft, "draft"), (matrix, "matrix"), (outreach, "outreach")]:
    require(not re.search(r"\bWDCs?\b", body), f"stale WDC terminology returned in {name}")
    require("120 lessons" not in body, f"unverified exact lesson-count marketing claim returned in {name}")

require("Do not assume an annual review" in draft, "draft still risks hard-coded annual review assumption")

print("MouldMaster NZQA 2026 readiness QA passed")
