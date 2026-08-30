from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
POLICY = ROOT / "sources" / "EVIDENCE_COVERAGE_POLICY.md"
REGISTRY = ROOT / "data" / "evidence-coverage-v1.json"
OVERLAY = ROOT / "data" / "evidence-promotion-overlay-v2.json"
REPORT = ROOT / "evidence-coverage-report.json"

EXPECTED_IDS = [
    "ejection-demoulding-physics",
    "residual-stress-birefringence",
    "weld-line-mechanical-strength",
    "fibre-breakage-retained-length",
    "runner-gate-multicavity-imbalance",
    "hot-runner-actual-behaviour",
    "liquid-silicone-rubber",
    "fluid-assisted-moulding",
    "moisture-drying-degradation",
    "recyclate-process-variability",
    "surface-replication-release",
    "injection-compression-precision-optics",
]
VALID_STATUS = {"gap", "provisional", "promoted"}
VALID_ROLES = {
    "open-measured-dataset",
    "primary-measured-study",
    "primary-measured-candidate",
    "validated-simulation",
    "validated-simulation-candidate",
    "simulation-only",
    "simulation-candidate",
    "review",
    "standard-official",
    "manufacturer-vendor",
    "discovery-candidate",
}
VALID_VERIFICATION = {
    "metadata-screened",
    "publisher-verified",
    "official-source-verified",
    "dataset-files-verified",
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def text(path):
    need(path.exists(), f"missing evidence coverage dependency: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


policy = text(POLICY)
registry = json.loads(text(REGISTRY))
overlay = json.loads(text(OVERLAY))

need(registry.get("schema") == 1, "unexpected evidence coverage schema")
need(registry.get("successMetric") == "mechanism-evidence-coverage", "paper count must not be the success metric")
need(registry.get("discoveryPoolIsEvidenceCount") is False, "discovery pool must never be represented as an evidence count")
need(isinstance(registry.get("discoveryPoolApproximate"), int) and registry["discoveryPoolApproximate"] >= 1000,
     "discovery pool metadata should remain explicitly approximate and separate")

rule = registry.get("promotionRule", {})
need(rule.get("minimumIndependentPublisherVerifiedPrimaryMeasured") >= 2, "promotion must require at least two independent measured studies")
need(rule.get("requiresMeasuredSignals") is True, "promotion must require measured signals")
need(rule.get("requiresPhysicalQualityOutcome") is True, "promotion must require a physical quality outcome")
need(rule.get("requiresExperimentalContext") is True, "promotion must retain experimental context")
need(rule.get("requiresExplicitLimitation") is True, "promotion must retain limitations")
need(rule.get("predictionIsNotCausation") is True, "prediction must remain distinct from causation")
need(rule.get("universalProcessRecipesAllowed") is False, "evidence coverage must not create universal recipes")

mechanisms = registry.get("mechanisms")
need(isinstance(mechanisms, list) and len(mechanisms) == 12, f"expected exactly 12 priority mechanisms, found {len(mechanisms or [])}")
ids = [m.get("id") for m in mechanisms]
need(ids == EXPECTED_IDS, f"priority mechanism IDs/order changed unexpectedly: {ids}")
need(len(ids) == len(set(ids)), "mechanism IDs must be unique")

need(overlay.get("schema") == 1, "unexpected promotion overlay schema")
need(overlay.get("baseRegistry") == "data/evidence-coverage-v1.json", "promotion overlay base registry drifted")
promotions = overlay.get("promotions")
need(isinstance(promotions, list) and len(promotions) == 9, f"expected nine overlay promotions, found {len(promotions or [])}")
overlay_by_id = {}
for item in promotions:
    mid = str(item.get("mechanismId", "")).strip()
    need(mid in ids, f"promotion overlay references unknown mechanism: {mid}")
    need(mid not in overlay_by_id, f"duplicate promotion overlay mechanism: {mid}")
    q = item.get("qualifyingSources")
    need(isinstance(q, list) and len(q) >= rule["minimumIndependentPublisherVerifiedPrimaryMeasured"], f"{mid}: overlay qualifying evidence too weak")
    for s in q:
        need(str(s.get("id", "")).lower().startswith("doi:"), f"{mid}: overlay qualifying source must be DOI keyed")
        need(s.get("role") == "primary-measured-study", f"{mid}: overlay qualifying source must be primary measured")
        need(s.get("verification") == "publisher-verified", f"{mid}: overlay qualifying source must be publisher verified")
        need(bool(str(s.get("title", "")).strip()), f"{mid}: overlay qualifying source title missing")
    overlay_by_id[mid] = item

summary = overlay.get("summary", {})
need(summary.get("basePromoted") == 3, "historical base promotion count drifted")
need(summary.get("overlayPromoted") == 9, "overlay promotion count drifted")
need(summary.get("resolvedPromoted") == 12, "resolved promotion count drifted")
need(summary.get("resolvedProvisional") == 0 and summary.get("resolvedGaps") == 0, "resolved overlay must leave no provisional/gap priority mechanisms")

all_source_refs = 0
base_promoted = 0
base_provisional = 0
base_gaps = 0
resolved_promoted = 0
resolved_provisional = 0
resolved_gaps = 0
resolved = {}
for m in mechanisms:
    mid = m["id"]
    status = m.get("status")
    need(status in VALID_STATUS, f"{mid}: invalid status {status}")
    need(bool(m.get("title")), f"{mid}: title missing")
    need(bool(m.get("whyItMatters")), f"{mid}: whyItMatters missing")
    desired = m.get("desiredEvidence")
    need(isinstance(desired, list) and len(desired) >= 3 and all(str(x).strip() for x in desired), f"{mid}: desiredEvidence too weak")
    need(bool(m.get("limitation")), f"{mid}: limitation missing")
    need(bool(m.get("nextValidation")), f"{mid}: nextValidation missing")

    verified_count = m.get("publisherVerifiedPrimaryMeasured")
    need(isinstance(verified_count, int) and verified_count >= 0, f"{mid}: invalid publisherVerifiedPrimaryMeasured")
    is_promoted = m.get("promoted")
    need(isinstance(is_promoted, bool), f"{mid}: promoted must be boolean")
    if is_promoted:
        base_promoted += 1
        need(status == "promoted", f"{mid}: promoted boolean/status disagree")
        need(verified_count >= rule["minimumIndependentPublisherVerifiedPrimaryMeasured"], f"{mid}: falsely promoted without enough verified primary measured evidence")
    else:
        need(status != "promoted", f"{mid}: status promoted while promoted=false")
        if status == "provisional": base_provisional += 1
        if status == "gap": base_gaps += 1

    sources = m.get("sources")
    need(isinstance(sources, list), f"{mid}: sources must be a list")
    source_ids = []
    publisher_primary = 0
    for s in sources:
        for key in ["id", "title", "role", "verification"]:
            need(str(s.get(key, "")).strip(), f"{mid}: source field {key} missing")
        need(s["role"] in VALID_ROLES, f"{mid}: invalid source role {s['role']}")
        need(s["verification"] in VALID_VERIFICATION, f"{mid}: invalid verification {s['verification']}")
        source_ids.append(s["id"])
        if s["role"] == "primary-measured-study" and s["verification"] == "publisher-verified":
            publisher_primary += 1
    need(len(source_ids) == len(set(source_ids)), f"{mid}: duplicate source ID inside mechanism")
    need(verified_count == publisher_primary, f"{mid}: publisher-verified primary measured count does not match source records")
    all_source_refs += len(sources)

    if mid in overlay_by_id:
        need(is_promoted is False and status != "promoted", f"{mid}: overlay is intended to preserve a pre-promotion historical base state")
        q = overlay_by_id[mid]["qualifyingSources"]
        q_ids = [x["id"].lower() for x in q]
        need(len(q_ids) == len(set(q_ids)), f"{mid}: duplicate overlay source DOI")
        resolved_status = "promoted"
        resolved_count = len(q)
        resolved_sources = list(sources) + q
    else:
        resolved_status = status
        resolved_count = verified_count
        resolved_sources = list(sources)

    if resolved_status == "promoted":
        resolved_promoted += 1
        need(resolved_count >= rule["minimumIndependentPublisherVerifiedPrimaryMeasured"], f"{mid}: resolved promotion lacks minimum measured evidence")
    elif resolved_status == "provisional":
        resolved_provisional += 1
    else:
        resolved_gaps += 1
    resolved[mid] = {"status": resolved_status, "publisherVerifiedPrimaryMeasured": resolved_count}
    all_source_refs += len(resolved_sources) - len(sources)

need(base_promoted == 3 and base_provisional == 9 and base_gaps == 0, "historical v1 base registry state drifted")
need(resolved_promoted == 12 and resolved_provisional == 0 and resolved_gaps == 0, "formal overlay did not resolve all priority mechanisms to promoted")
need(summary.get("resolvedPromoted") == resolved_promoted, "overlay/report resolved promotion count disagrees")

# Corpus/policy boundary assertions.
policy_lower = policy.lower()
for required in [
    "discovery count only",
    "mechanism evidence coverage",
    "primary measured study",
    "simulation-only study",
    "review",
    "at least two independent",
    "264 cases / 19,008 cycles",
    "synthetic",
    "prediction can identify quality risk without proving physical causation",
    "success metric",
]:
    need(required in policy_lower, f"evidence coverage policy marker missing: {required}")
for forbidden in [
    "1,100 verified peer-reviewed injection-moulding papers",
    "1100 verified peer-reviewed injection-moulding papers",
    "paper total is the success metric",
]:
    need(forbidden not in policy_lower, f"policy contains prohibited overclaim: {forbidden}")

atlas = text(ROOT / "sources" / "PROCESS_DATA_20_PASS_ATLAS.md")
measured = text(ROOT / "sources" / "MEASURED_EVIDENCE_50_PASS.md")
need("264" in atlas and "19,008" in atlas and "synthetic" in atlas.lower(), "synthetic corpus boundary changed")
need("primary measured study" in measured.lower() and "reusable raw dataset" in measured.lower(), "measured-study/dataset distinction missing")
need("association" in measured.lower() and "root cause" in measured.lower(), "measured evidence must retain causality boundary")

report = {
    "schema": 2,
    "registryVersion": registry.get("version"),
    "overlayVersion": overlay.get("version"),
    "mechanismCount": len(mechanisms),
    "basePromoted": base_promoted,
    "baseProvisional": base_provisional,
    "baseGaps": base_gaps,
    "overlayPromoted": len(overlay_by_id),
    "promoted": resolved_promoted,
    "provisional": resolved_provisional,
    "gaps": resolved_gaps,
    "resolved": resolved,
    "sourceReferences": all_source_refs,
    "discoveryPoolApproximate": registry.get("discoveryPoolApproximate"),
    "discoveryPoolIsEvidenceCount": False,
    "successMetric": registry.get("successMetric"),
    "result": "pass",
}
REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"MouldMaster evidence coverage QA passed ({len(mechanisms)} mechanisms; {base_promoted} historical + {len(overlay_by_id)} formal overlay = {resolved_promoted} promoted; {resolved_provisional} provisional; {resolved_gaps} gaps)")
