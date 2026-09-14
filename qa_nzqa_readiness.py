from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
CERT = ROOT / "certification"
DATA = ROOT / "data" / "nzqa-education-readiness-v1.json"
RUNTIME_DATA = ROOT / "src" / "domains" / "learning" / "book-data" / "nzqa-education-readiness-v1.json"
REGISTER = ROOT / "sources" / "NZQA_READINESS_REGISTER.md"
MANIFEST = ROOT / "data" / "book-manifest-v1.json"


def read(path):
    return Path(path).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


roadmap = read(CERT / "README.md")
draft = read(CERT / "NZQA_MICROCREDENTIAL_DRAFT.md")
matrix = read(CERT / "NZQA_2026_EVIDENCE_MATRIX.md")
outreach = read(CERT / "PROVIDER_PARTNERSHIP_OUTREACH.md")
register = read(REGISTER)
contract_text = read(DATA)
runtime_text = read(RUNTIME_DATA)
contract = json.loads(contract_text)
manifest = json.loads(read(MANIFEST))

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
    require(
        "not nzqa approved" in lower
        or "not yet accredited by nzqa" in lower
        or "not evidence of nzqa approval" in lower
        or "do not state or imply that mouldmaster academy is nzqa approved" in lower,
        f"{name} is missing explicit NZQA non-approval status",
    )

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

# New governed readiness contract is byte-paired and remains technical-review only.
require(contract_text == runtime_text, "NZQA readiness source/runtime data pair must be byte-identical")
require(contract["schema"] == 1, "NZQA readiness schema mismatch")
require(contract["id"] == "mouldmaster-nzqa-education-readiness", "NZQA readiness identity mismatch")
require(contract["status"] == "technical-review", "NZQA readiness must remain technical-review")
require(contract["checked"] == "2026-09-15", "NZQA readiness source check date mismatch")
require(contract["bookId"] == "mouldmaster-book", "NZQA readiness Book identity mismatch")
require(contract["publicationEffect"] == "none", "NZQA readiness must not authorize Book publication")

# Current/expired standard handling must be explicit and fail closed.
current = {row["id"] for row in contract["currentInjectionMouldingStandards"]}
expired = set(contract["expiredStandardsNotForCurrentAssessmentMapping"])
require(current == {"252", "255", "27926", "29515", "260", "9713"}, f"unexpected current Injection Moulding standards: {sorted(current)}")
require(expired == {"253", "254", "256", "257", "258", "259", "27925", "9712"}, f"unexpected expired Injection Moulding set: {sorted(expired)}")
require(current.isdisjoint(expired), "current and expired Injection Moulding standards overlap")
for row in contract["currentInjectionMouldingStandards"]:
    require(row["cmr"] == "13", f"standard {row['id']} lost CMR 13 mapping")
    require(row["externalAssessmentGate"] == "provider-consent-to-assess-and-moderation-required", f"standard {row['id']} lost external assessment gate")

# All 46 Book chapters must be represented exactly once in the readiness map.
manifest_chapters = [chapter["id"] for part in manifest["parts"] for chapter in part["chapters"]]
map_chapters = [row["chapterId"] for row in contract["chapterMap"]]
require(len(manifest_chapters) == 46, f"expected 46 Book chapters, found {len(manifest_chapters)}")
require(len(map_chapters) == 46, f"expected 46 NZQA chapter mappings, found {len(map_chapters)}")
require(len(set(map_chapters)) == 46, "NZQA chapter map contains duplicate chapter IDs")
require(set(map_chapters) == set(manifest_chapters), "NZQA chapter map does not exactly cover the governed Book manifest")

outcomes = {row["id"] for row in contract["learningOutcomes"]}
require(outcomes == {f"LO{i}" for i in range(1, 11)}, "NZQA readiness learning outcomes must be LO1-LO10")
for row in contract["chapterMap"]:
    require(row["outcomes"], f"chapter {row['chapterId']} has no learning-outcome mapping")
    require(set(row["outcomes"]).issubset(outcomes), f"chapter {row['chapterId']} references an unknown learning outcome")
    require(row["standardRefs"], f"chapter {row['chapterId']} has no current-standard context")
    require(set(row["standardRefs"]).issubset(current), f"chapter {row['chapterId']} references a non-current standard")
    require(set(row["standardRefs"]).isdisjoint(expired), f"chapter {row['chapterId']} references an expired standard")

require("supporting knowledge or practice context only" in contract["mappingRule"], "standard mapping boundary weakened")
require("do not assert" in contract["mappingRule"].lower(), "standard-equivalence claim boundary weakened")

# App evidence must not be upgraded into recognised assessment or workplace competence.
boundaries = set(contract["assessmentEvidenceModel"]["boundaries"])
for marker in [
    "simulation is not workplace practical competence",
    "a quiz pass is not consent to assess",
    "MouldMaster completion is not an NZQA result",
    "provider assessment does not become national-standard assessment without consent and moderation where DASS standards are used",
]:
    require(marker in boundaries, f"assessment evidence boundary missing: {marker}")

moderation = contract["moderationModel"]
require("Provider-owned" in moderation["internalModeration"], "internal moderation ownership boundary missing")
require("national external moderation" in moderation["nationalExternalModeration"].lower(), "national external moderation gate missing")
require("CMR 13" in moderation["cmr"], "CMR 13 boundary missing")
require("cannot self-grant moderation acceptance" in moderation["repositoryRole"], "repository moderation boundary missing")

# External/provider gates must remain HOLD; internal preparation may only be partial.
gates = {row["id"]: row for row in contract["gates"]}
require(set(gates) == {f"G{i}-{name}" for i, name in [
    (1, "provider"), (2, "need"), (3, "design"), (4, "assessment"),
    (5, "consent"), (6, "national-moderation"), (7, "workplace"), (8, "review")
]}, "NZQA gate set changed unexpectedly")
for gate_id in ["G1-provider", "G2-need", "G4-assessment", "G5-consent", "G6-national-moderation", "G7-workplace"]:
    require(gates[gate_id]["status"] == "external-hold", f"{gate_id} must remain external-hold")
for gate_id in ["G3-design", "G8-review"]:
    require(gates[gate_id]["status"] == "partial", f"{gate_id} must remain partial until provider decisions exist")

# Claim boundary must explicitly block approval/credit/competence shortcuts.
for marker in [
    "NZQA approved",
    "NZQA accredited",
    "MouldMaster is a New Zealand qualification",
    "completion awards NZQA credits",
    "completion proves workplace competence",
    "completion authorises machine operation",
    "assessment in MouldMaster is nationally moderated",
]:
    require(marker in contract["claimBoundary"]["forbidden"], f"forbidden NZQA claim missing: {marker}")

# Source register must preserve official-source and qualification-context boundaries.
for marker in [
    "Micro-credential Approval and Accreditation Rules 2026",
    "Consent to Assess Against Standards on the Directory of Assessment and Skill Standards Rules 2026",
    "CMR 13",
    "27926",
    "29515",
    "9713",
    "not used as current assessment anchors",
    "Qualification context — not equivalence",
    "not evidence that NZQA has approved MouldMaster",
]:
    require(marker in register, f"NZQA source register missing: {marker}")

for source in contract["officialSources"]:
    require(source["url"].startswith("https://www.nzqa.govt.nz/") or source["url"].startswith("https://www2.nzqa.govt.nz/"), f"non-NZQA authoritative URL in NZQA readiness contract: {source['id']}")

print("MouldMaster NZQA 2026 readiness QA passed")
