from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent

def load(path):
    value=json.loads((ROOT/path).read_text(encoding="utf-8"))
    if not isinstance(value,dict):
        raise AssertionError(f"{path} must be an object")
    return value

binding=load("data/book-sme-release-binding-v1.json")
sme=load("data/book-sme-review-v1.json")
enrichment=load("data/book-evidence-enrichment-v2.json")
worked=load("data/book-worked-engineering-cases-v1.json")
version=load("version.json")
external=load("data/release-external-validation-v1.json")

assert binding.get("schemaVersion")==1 and binding.get("bookId")=="mouldmaster-book"
assert binding.get("legacyField")=="release"
assert "content release" in str(binding.get("legacyFieldMeaning","")).lower()
assert binding.get("contentRelease")==sme.get("release")==enrichment.get("release")==worked.get("release")
assert binding.get("boundWebRelease")==version.get("web_release")
assert binding.get("status")==sme.get("status")=="hold"
assert (external.get("bookSme") or {}).get("status")=="hold"
assert (external.get("bookSme") or {}).get("evidenceContract")=="data/book-sme-review-v1.json"
assert (external.get("bookSme") or {}).get("reviewPacket")==f"qa/BOOK_SME_REVIEW_{version['web_release']}.md"
print("Book SME release identity QA passed: legacy release is content identity; current web binding is explicit; human SME remains HOLD.")
