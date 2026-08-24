from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
CERT = ROOT / "certification"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


matrix_path = CERT / "IACET_READINESS_MATRIX.md"
handoff_path = CERT / "IACET_2026_HANDOFF.md"
roadmap_path = CERT / "README.md"

for path in [matrix_path, handoff_path, roadmap_path]:
    require(path.exists(), f"IACET readiness file missing: {path.relative_to(ROOT)}")

matrix = text(matrix_path)
handoff = text(handoff_path)
roadmap = text(roadmap_path)

# Current public IACET accreditation baseline verified 2026-08-24.
for marker in [
    "ANSI/IACET 1-2018",
    "one year in business",
    "three months",
    "USD 495",
    "USD 4,845",
    "USD 1,245",
    "one year",
    "3–4 months",
    "five-year",
]:
    require(marker in matrix or marker in handoff or marker in roadmap, f"IACET 2026 baseline marker missing: {marker}")

# Public nine-category structure must remain explicit.
for category in [
    "Organization, Responsibility and Control",
    "Learning Environment and Support Systems",
    "Planning and Instructional Personnel",
    "Needs Analysis",
    "Learning Outcomes",
    "Content and Instructional Requirements",
    "Assessment of Learning Outcomes",
    "Awarding the IACET CEU and Maintaining Learner Records",
    "Evaluation of Learning Events",
]:
    require(category in matrix, f"IACET public standard category missing: {category}")

# Organisational accreditation boundary.
for marker in [
    "organisational accreditation",
    "does not approve a single course independently",
    "legal-entity eligibility",
    "operating history",
    "defined organisational unit",
]:
    require(marker.lower() in matrix.lower(), f"IACET organisational boundary missing: {marker}")

# CEU integrity boundary: time arithmetic cannot create an IACET CEU.
require("1 CEU = 10 contact hours" in matrix, "IACET CEU public definition missing")
require("must not calculate or market **IACET CEUs**" in handoff, "IACET CEU pre-accreditation gate missing")
require("not itself a professional credential" in matrix, "CEU credential distinction missing")
require("does not issue IACET CEUs" in matrix and "does not issue IACET CEUs" in handoff, "non-accredited status marker missing")

# The repository must not treat drafts/templates as proof of operating conformity.
for marker in [
    "real adult-learning pilot/operating cycle",
    "Draft templates without operating evidence",
    "management review",
    "corrective actions",
]:
    require(marker.lower() in handoff.lower() or marker.lower() in matrix.lower(), f"IACET operating-evidence safeguard missing: {marker}")

# Purchase gate: do not encourage paying before legal/operating readiness.
require("before spending money" in handoff.lower(), "IACET pre-purchase eligibility gate missing")
require("recheck fees" in handoff.lower(), "IACET fee freshness safeguard missing")
require("free Accreditation Readiness Calculator" in handoff, "IACET no-cost readiness step missing")

# Roadmap must link the current IACET handoff and retain the external-approval claim gate.
require("IACET_2026_HANDOFF.md" in roadmap, "certification roadmap missing IACET 2026 handoff")
require("IACET_READINESS_MATRIX.md" in roadmap, "certification roadmap missing IACET readiness matrix")
require("Only after IACET grants Accredited Provider status" in roadmap, "IACET claim gate missing from roadmap")

# Prevent unqualified affirmative approval language in IACET readiness documents.
for body, name in [(matrix, "matrix"), (handoff, "handoff")]:
    for claim in [r"\bMouldMaster Academy is an IACET Accredited Provider\b", r"\bMouldMaster issues IACET CEUs\b"]:
        require(not re.search(claim, body, flags=re.I), f"premature IACET approval claim in {name}")

print("MouldMaster IACET 2026 readiness QA passed")
