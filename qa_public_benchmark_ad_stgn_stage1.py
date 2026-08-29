from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/ad-stgn-injection-moulding-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_ad_stgn_stage1.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported AD-STGN contract schema")
need(x.get("datasetId") == "ad-stgn-injection-moulding-v1", "AD-STGN dataset id drifted")
need(x.get("status") == "metadata-profile-candidate", "AD-STGN stage-one status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/6f9x8yg8nj.1", "AD-STGN DOI drifted")
need(s["version"] == 1, "AD-STGN version drifted")
need(s["license"] == "CC BY 4.0", "AD-STGN licence drifted")
ctx = x["experimentContext"]
need(ctx["continuousSensorMeasurements"] == 66, "AD-STGN reported sensor count drifted")
need(ctx["discreteControlActions"] == 7, "AD-STGN reported control count drifted")
need(ctx["reportedTrainingSamples"] == 88000, "AD-STGN training count drifted")
need(ctx["reportedValidationSamples"] == 22614, "AD-STGN validation count drifted")
rules = x["stage1Rules"]
need(rules["publisherApiMetadataOnly"] is True, "AD-STGN stage one must be metadata only")
need(rules["downloadDatasetPayloads"] is False, "AD-STGN stage one cannot download payloads")
need(rules["doNotCountTEPOrSWaTAsInjectionMouldingEvidence"] is True, "non-injection benchmark exclusion missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "AD-STGN cannot claim measured samples before stage two")
need(rules["countsAsFullyProfiledMeasuredDataset"] is False, "AD-STGN cannot be accepted before stage two")

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "data.mendeley.com/public-api/datasets",
    "page_file_links",
    "likelyInjectionFilesByName",
    "explicitNonInjectionFilesByName",
    "rawPayloadDownloaded\": False",
    "rawPayloadsDownloaded\": False",
    "acceptedMeasuredTimeSeriesSamples\": 0",
]:
    need(marker in text, f"AD-STGN runner guard missing: {marker}")

# The HTML parser may recognize `file_downloaded` URLs solely to obtain stable
# publisher file IDs. Stage 1 must not request any of those discovered links.
need("api.data.mendeley.com" not in text, "stage one must not depend on OAuth-only Mendeley API")
need("request_bytes(item['url']" not in text and 'request_bytes(item["url"]' not in text,
     "stage one must not retrieve discovered file payloads")
need("request_bytes(link" not in text and "urlopen(link" not in text,
     "stage one must not retrieve publisher file links")
need("rawPayloadDownloaded\": True" not in text and "rawPayloadsDownloaded\": True" not in text,
     "stage one must never mark payload retrieval true")

print("MouldMaster AD-STGN metadata-only stage-one QA passed")
