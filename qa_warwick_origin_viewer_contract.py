#!/usr/bin/env python3
"""Fail-closed QA for the optional Warwick Origin Viewer extraction lane."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PATH = ROOT / "data" / "warwick-origin-viewer-extraction-contract-v1.json"
EXPECTED = [
    "data1_09.06.2023_Material_Jetting.opju",
    "data1_16.06.2023_b2b.opju",
    "data_visualisation.opju",
    "representative_curves_14.06.2023.opju",
    "surface_parameters_27.10.2023.opju",
]


def need(ok, message):
    if not ok:
        raise AssertionError(message)


x = json.loads(PATH.read_text(encoding="utf-8"))
need(x["schema"] == 1, "Viewer contract schema drifted")
need(x["datasetId"] == "warwick-demoulding", "Viewer contract dataset drifted")
need(x["datasetDoi"] == "10.17632/x9hc7hf6xd.2", "Viewer contract DOI drifted")
need(x["status"] == "available-noncounting-extraction-lane", "Viewer lane must remain explicitly non-counting")
need(x["sourceProjects"] == EXPECTED, "Viewer source-project list/order drifted")
contact = x["noContactBoundary"]
need(contact["emailSentForThisPass"] is False, "Viewer contract cannot claim email contact")
need(contact["registrationFormSubmittedForThisPass"] is False, "Viewer contract cannot claim form submission")
need(contact["downloadPerformedForThisPass"] is False, "Viewer contract cannot claim an unperformed download")
need(x["promotionPath"]["viewerAcceptedMeasuredValues"] == 0, "Viewer extraction must never add accepted measured values")
need(x["promotionPath"]["rawRowsCommittedToPublicRepository"] is False, "Viewer raw exports must remain outside public repository")
for marker in ("Origin/OriginPro", "validate_warwick_origin_export.py"):
    need(marker in x["promotionPath"]["fullPromotionStillRequires"], f"Full Warwick promotion boundary missing {marker}")
for text in x["forbiddenPromotion"]:
    need(isinstance(text, str) and text.strip(), "Viewer forbidden-promotion rules must be explicit")
need(any("cell formulas" in text for text in x["forbiddenPromotion"]), "Viewer formula limitation must block promotion")
need(any("accepted measured-value totals" in text for text in x["forbiddenPromotion"]), "Viewer counting prohibition missing")
print("Warwick Origin Viewer extraction contract QA passed (free extraction lane remains non-counting and no-contact).")
