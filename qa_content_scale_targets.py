from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
RESULTS = DATA / "public-benchmark-results"

TARGETS = DATA / "content-scale-targets.json"
INVENTORY = DATA / "measured-dataset-inventory-v1.json"
PROFILED = DATA / "profiled-measured-dataset-registry-v1.json"
PRIMARY = DATA / "primary-measured-evidence-registry-v1.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


target_obj = load(TARGETS)
need(target_obj.get("schema") == 1, "content-scale target schema drifted")
need("synthetic" in target_obj.get("scope", "").lower(), "scope must explicitly exclude synthetic evidence from measured counts")
targets = target_obj.get("targets") or {}
expected_targets = {
    "fully_profiled_measured_datasets": (30, 50),
    "measured_time_series_samples": (1_000_000, 5_000_000),
    "material_profiles": (250, 300),
    "defect_mechanisms": (300, 400),
    "sensor_machine_health_concepts": (200, 250),
    "assessment_education_items": (1000, 1500),
    "peer_reviewed_research_records": (1500, 2000),
    "primary_measured_studies": (800, 1000),
}
need(set(targets) == set(expected_targets), "content-scale target areas drifted")
for key, (minimum, preferred) in expected_targets.items():
    rec = targets[key]
    need(rec.get("minimum") == minimum and rec.get("preferred") == preferred, f"{key} target drifted")
    need(isinstance(rec.get("acceptance"), str) and len(rec["acceptance"]) >= 120, f"{key} acceptance definition too weak")
    need(isinstance(rec.get("currentAccepted"), int) and rec["currentAccepted"] >= 0, f"{key} currentAccepted invalid")

inventory = load(INVENTORY)
need(inventory.get("schema") == 1, "measured inventory schema drifted")
need((inventory.get("rules") or {}).get("rawRowsCommittedToRepository") is False, "raw third-party rows must not be committed")
datasets = inventory.get("datasets") or []
summary = inventory.get("summary") or {}
ids = [x.get("datasetId") for x in datasets]
need(all(ids) and len(ids) == len(set(ids)), "measured dataset IDs must be unique and non-empty")
need(summary.get("datasets") == len(datasets), "measured inventory summary must equal physical record count")
computed_automated = sum(1 for x in datasets if x.get("automatedIngestionAllowed") is True)
need(summary.get("automatedIngestionAllowed") == computed_automated, "automated-ingestion summary drifted")
need(targets["fully_profiled_measured_datasets"].get("currentDiscovered") == len(datasets), "discovered dataset target must match inventory")
need(len(datasets) >= 21, "measured dataset inventory unexpectedly rolled back below 21")
need(computed_automated >= 13, "automated ingestion inventory unexpectedly rolled back below 13")

inv = {x["datasetId"]: x for x in datasets}
required_inventory = {
    "mendeley-gtnb4j7bfx-v1",
    "scatimdata-avaps",
    "su13148102-supplement",
    "openmms-t4g",
    "probayes-main-v2",
    "probayes-doptimal-v1",
    "skz-loki-v1",
    "iguzzini-road-lenses",
    "impure-pascoe-2022",
    "forinfpro-himd-v1",
    "cross-process-chain-17240390",
    "hdpe-gnp-v3",
    "warwick-demoulding",
    "pet-preform-v2",
}
need(required_inventory.issubset(inv), f"required measured source missing from inventory: {sorted(required_inventory-set(inv))}")
need(inv["cross-process-chain-17240390"].get("accessState") == "executed-open-ccby", "cross-process archive must remain executed CC BY")
need((inv["cross-process-chain-17240390"].get("count") or {}).get("injectionCycles") == 15686, "cross-process injection recording count drifted")
need((inv["cross-process-chain-17240390"].get("count") or {}).get("screwDrivingFilesExcluded") == 14882, "cross-process downstream exclusion drifted")
need(inv["hdpe-gnp-v3"].get("accessState") == "executed-open-ccby", "HDPE/GNP source state drifted")
need((inv["hdpe-gnp-v3"].get("count") or {}).get("experiments") == 35, "HDPE/GNP experiment count drifted")
need(inv["warwick-demoulding"].get("accessState") == "public-open", "Warwick source state drifted")
need((inv["warwick-demoulding"].get("count") or {}).get("acceptedTrials") == 0, "Warwick OPJU data must remain non-counting until extracted")
need(inv["pet-preform-v2"].get("accessState") == "profiled-rejected-measured", "PET preform measured-evidence rejection drifted")

profiled = load(PROFILED)
need(profiled.get("schema") == 1, "profiled measured registry schema drifted")
profiled_summary = profiled.get("summary") or {}
profiled_rows = profiled.get("datasets") or []
profiled_ids = [x.get("datasetId") for x in profiled_rows]
need(all(profiled_ids) and len(profiled_ids) == len(set(profiled_ids)), "profiled dataset IDs must be unique")
need(profiled_summary.get("fullyProfiledDatasetPackages") == len(profiled_rows), "profiled registry package summary drifted")
need(set(profiled_ids).issubset(inv), "every accepted profiled package must exist in the measured inventory")
accepted_packages = profiled_summary.get("fullyProfiledDatasetPackages")
accepted_samples = profiled_summary.get("acceptedMeasuredTimeSeriesSamples")
need(accepted_packages == targets["fully_profiled_measured_datasets"].get("currentAccepted"), "accepted dataset target must equal profiled registry")
need(accepted_samples == targets["measured_time_series_samples"].get("currentAccepted"), "accepted measured-sample target must equal profiled registry")
need(accepted_packages >= 12, "fully profiled dataset count unexpectedly rolled back below 12")
need(accepted_samples >= 52_526_432, "accepted measured sample count unexpectedly rolled back")

required_profiled = {
    "mendeley-gtnb4j7bfx-v1",
    "scatimdata-avaps",
    "su13148102-supplement",
    "openmms-t4g",
    "probayes-main-v2",
    "probayes-doptimal-v1",
    "skz-loki-v1",
    "iguzzini-road-lenses",
    "impure-pascoe-2022",
    "forinfpro-himd-v1",
    "cross-process-chain-17240390",
    "hdpe-gnp-v3",
}
need(required_profiled.issubset(set(profiled_ids)), f"accepted dataset package missing: {sorted(required_profiled-set(profiled_ids))}")
prof = {x["datasetId"]: x for x in profiled_rows}
need(prof["scatimdata-avaps"].get("acceptedMeasuredTimeSeriesSamples") == 16_228_352, "scatimdata sample ledger drifted")
need(prof["openmms-t4g"].get("acceptedMeasuredTimeSeriesSamples") == 298_080, "OpenMMS sample ledger drifted")
need(prof["skz-loki-v1"].get("acceptedMeasuredTimeSeriesSamples") == 36_000_000, "SKZ sample ledger drifted")
need(prof["cross-process-chain-17240390"].get("acceptedMeasuredTimeSeriesSamples") == 0, "cross-process scalars must remain non-counting without explicit raw units")
need(prof["hdpe-gnp-v3"].get("recordsProfiled") == 35, "HDPE/GNP profiled record count drifted")

primary = load(PRIMARY)
need(primary.get("schema") == 1, "primary measured registry schema drifted")
ps = primary.get("summary") or {}
verified_primary = ps.get("publisherVerifiedPeerReviewedPrimaryMeasured")
need(verified_primary == ps.get("uniqueDois"), "primary measured DOI deduplication drifted")
need(verified_primary >= 60, "publisher-verified primary measured study count rolled back")
need(targets["primary_measured_studies"].get("currentAccepted") == verified_primary, "primary measured target must match audited registry")
need(targets["peer_reviewed_research_records"].get("currentAccepted") >= verified_primary, "peer-reviewed count must not be below audited primary measured subset")

report = {
    "schema": 1,
    "version": target_obj.get("version"),
    "measuredInventory": {
        "discoveredDatasetRecords": len(datasets),
        "automatedIngestionAllowed": computed_automated,
        "fullyProfiledDatasetPackages": accepted_packages,
        "acceptedMeasuredTimeSeriesSamples": accepted_samples,
        "crossProcessInjectionRecordings": 15686,
        "hdpeGnpExperiments": 35,
    },
    "verifiedResearch": {
        "publisherVerifiedPeerReviewedPrimaryMeasured": verified_primary,
        "uniqueDois": ps.get("uniqueDois"),
        "tierA": ps.get("tierA"),
        "tierB": ps.get("tierB"),
    },
    "areas": {
        key: {
            "accepted": targets[key]["currentAccepted"],
            "minimum": targets[key]["minimum"],
            "preferred": targets[key]["preferred"],
            "remainingToMinimum": max(0, targets[key]["minimum"] - targets[key]["currentAccepted"]),
            "remainingToPreferred": max(0, targets[key]["preferred"] - targets[key]["currentAccepted"]),
        }
        for key in expected_targets
    },
    "boundary": "Synthetic/generated content, metadata-only sources, rejected simulation/prediction datasets and unextracted containers do not count as accepted measured evidence. Counts are reconciled from canonical registries rather than frozen QA constants.",
}
(ROOT / "content-scale-targets-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    "MouldMaster content-scale target integrity QA passed "
    f"({len(datasets)} measured sources inventoried; {computed_automated} automated-ingestion sources; "
    f"{accepted_packages} fully profiled dataset packages; {accepted_samples:,} accepted measured scalar samples; "
    f"{verified_primary} publisher-verified primary measured studies)"
)
