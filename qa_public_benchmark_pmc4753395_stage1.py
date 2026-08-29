from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_pmc4753395_stage1.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported PMC4753395 contract schema")
need(x.get("datasetId") == "pmc4753395-hdpe-cenosphere-v1", "dataset id drifted")
need(x.get("status") == "stage1-profile-candidate", "stage-one status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.1016/j.dib.2016.01.058", "DOI drifted")
need(s["pmcid"] == "PMC4753395", "PMCID drifted")
need(s["license"] == "CC BY 4.0", "licence drifted")
need(s["expectedMeasuredWorkbook"] == "Tensile-Data.xlsx", "measured workbook identity drifted")
need("Porfiri" in s["expectedTheoreticalWorkbook"], "theoretical workbook identity drifted")
r = x["stage1Rules"]
need(r["measuredWorkbookMustBeSeparatedFromTheoreticalWorkbook"] is True, "measured/theoretical separation missing")
need(r["rawNumericValuesMustNotBeEmitted"] is True, "raw value boundary missing")
need(r["rawThirdPartyFilesMustNotBeCommitted"] is True, "raw file boundary missing")
need(r["countsAsFullyProfiledMeasuredDataset"] is False, "stage one cannot accept dataset")
need(r["acceptedMeasuredTimeSeriesSamples"] == 0, "stage one cannot accept samples")
text = RUNNER.read_text(encoding="utf-8")
for marker in ["zipfile.is_zipfile", "tensile-data.xlsx", "porfiri", "rawNumericValuesEmitted", "formulaCells", "sha256", "acceptedMeasuredTimeSeriesSamples\": 0"]:
    need(marker in text, f"runner guard missing: {marker}")
need("to_numpy().ravel" in text, "aggregate-only numeric-cell scan missing")
need("rawMembersUploadedAsArtifact\": False" in text, "raw member upload guard missing")
print("MouldMaster PMC4753395 HDPE cenosphere stage-one QA passed")
