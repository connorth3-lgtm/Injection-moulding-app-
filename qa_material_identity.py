from copy import deepcopy
from pathlib import Path
import runpy
import subprocess

from tools.material_catalog import identity_payload, material_identity_key


def need(condition, message):
    if not condition:
        raise AssertionError(message)


MID = "mfr-lg-chem"
BASE = {
    "brand": "LUPOY",
    "grade": "TEST-1000",
    "identity": {},
    "production": {},
    "composition": {},
    "lifecycle": {"regions": ["Korea", "Global"]},
    "sources": [
        {
            "kind": "manufacturer-datasheet",
            "revision": "Rev A",
            "documentDate": "2026-01-15",
            "retrievedAt": "2026-09-03",
            "url": "https://example.invalid/rev-a.pdf",
        }
    ],
}


def key(grade):
    return material_identity_key(MID, grade)


base_key = key(BASE)

# Cosmetic/source-retrieval changes must not invent a new exact material identity.
same = deepcopy(BASE)
same["brand"] = "  lupoy  "
same["grade"] = " test-1000 "
same["lifecycle"]["regions"] = ["global", " korea "]
same["sources"][0]["retrievedAt"] = "2026-09-04"
same["sources"][0]["url"] = "https://example.invalid/mirror/rev-a.pdf"
need(key(same) == base_key, "identity key drifted on cosmetic/retrieval-only changes")

# A true duplicate same-name grade must still collide.
duplicate = deepcopy(BASE)
need(key(duplicate) == base_key, "identical exact-grade records must share one identity key")

# Legitimate same-name commercial variants must be able to coexist when the
# distinguishing engineering identity is explicit.
variants = []
for field, value in (
    ("variantId", "KR-OEM"),
    ("regionalVariant", "Korea"),
    ("formulationRevision", "2026-B"),
):
    grade = deepcopy(BASE)
    grade["identity"][field] = value
    variants.append((f"identity.{field}", grade))

for field, value in (
    ("country", "South Korea"),
    ("plant", "Yeosu"),
    ("region", "APAC"),
):
    grade = deepcopy(BASE)
    grade["production"][field] = value
    variants.append((f"production.{field}", grade))

grade = deepcopy(BASE)
grade["composition"]["glassFibrePct"] = 20
variants.append(("composition", grade))

grade = deepcopy(BASE)
grade["sources"][0]["revision"] = "Rev B"
variants.append(("source revision", grade))

grade = deepcopy(BASE)
grade["sources"][0]["revision"] = None
grade["sources"][0]["documentDate"] = "2026-06-01"
variants.append(("source document date fallback", grade))

grade = deepcopy(BASE)
grade["lifecycle"]["regions"] = ["Europe"]
variants.append(("lifecycle region", grade))

for label, variant in variants:
    need(key(variant) != base_key, f"same-name material variant collapsed despite distinct {label}")

# Manufacturer headquarters metadata is not production-origin identity. The
# manufacturer stable ID is the identity anchor; plant/country belongs in the
# explicit production object instead.
manufacturer_metadata_only = deepcopy(BASE)
manufacturer_metadata_only["manufacturer"] = {"id": MID, "name": "LG Chem", "country": "South Korea"}
need(key(manufacturer_metadata_only) == base_key, "manufacturer display/HQ metadata must not masquerade as production identity")

payload = identity_payload(BASE)
need(payload["sourceRevisions"] == ["rev a"], "source revision normalization drift")
need(payload["regions"] == ["global", "korea"], "lifecycle region normalization drift")

print(
    "MouldMaster material identity QA passed "
    f"({len(variants)} legitimate same-name variant dimensions remain distinct; cosmetic/retrieval changes remain stable)"
)

# Keep the stronger v2 contract and search-scale regression in the existing
# required material-identity QA job so these files cannot become unexercised specs.
ROOT = Path(__file__).resolve().parent
runpy.run_path(str(ROOT / "qa_material_schema_v2.py"), run_name="__main__")
subprocess.run(["node", str(ROOT / "qa_material_search_index.cjs")], cwd=ROOT, check=True)
