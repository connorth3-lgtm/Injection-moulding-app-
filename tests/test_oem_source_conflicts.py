"""Synthetic tampering regressions for the OEM source conflict HOLD."""
from copy import deepcopy
import json
from pathlib import Path
import unittest

from qa_oem_source_conflicts import ROOT, CONFLICT_PATH, MACHINE_LIBRARY, RESEARCH_NOTE, SOURCE_INDEX, verify


class OEMSourceConflictTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.real = [
            json.loads((ROOT / CONFLICT_PATH).read_text(encoding="utf-8")),
            json.loads((ROOT / MACHINE_LIBRARY).read_text(encoding="utf-8")),
            (ROOT / RESEARCH_NOTE).read_text(encoding="utf-8"),
            (ROOT / SOURCE_INDEX).read_text(encoding="utf-8"),
        ]

    def validate(self, parts):
        verify(*parts)

    def test_current_quarantine_passes(self):
        self.validate(deepcopy(self.real))

    def test_conflicting_region_and_revision_must_remain_distinct(self):
        modifications = {
            "premature resolution": lambda x: x[0].update(status="resolved"),
            "selected EU platen": lambda x: x[0]["conflicts"][0].update(
                acceptedMachinePlatenSize=[440, 420]),
            "selected US platen": lambda x: x[0]["conflicts"][0].update(
                acceptedMachinePlatenSize=[440, 240]),
            "fabricated approval": lambda x: x[0]["conflicts"][0].update(
                resolutionEvidence="reviewer says approved"),
            "manufacturing readiness": lambda x: x[0]["conflicts"][0].update(
                machineSuitability="pass"),
            "missing US": lambda x: x[0]["conflicts"][0]["observations"].pop(1),
            "duplicate sources": lambda x: x[0]["conflicts"][0]["observations"][
                1].update(sourceId="fanuc-europe-model"),
            "suppress US discrepancy": lambda x: x[0]["conflicts"][0][
                "observations"][1].update(vMm=420),
            "swap EU specification": lambda x: x[0]["conflicts"][0][
                "observations"][0].update(vMm=240),
            "fake sheet revision": lambda x: x[0]["conflicts"][0][
                "observations"][2].update(revision="unreviewed 2026 brochure"),
            "coerce platen dimension": lambda x: x[0]["conflicts"][0][
                "observations"][0].update(hMm="440"),
            "forged review column": lambda x: x[0]["conflicts"][0][
                "observations"][0].update(approved=True),
            "historical OEM page lost": lambda x: x.__setitem__(
                2, x[2].replace(
                    "https://www.fanucamerica.com/products/roboshot/roboshot-a-s30ib",
                    "https://example.invalid/source-lost")),
            "discrepancy removed from note": lambda x: x.__setitem__(
                2, x[2].replace("UNRESOLVED", "RESOLVED")),
            "indexed reference lost": lambda x: x.__setitem__(
                3, x[3].replace(
                    "FANUC-ROBOSHOT-ALPHA-S30IB-OEM-CONFLICT.md",
                    "removed-reference.md")),
            "public S30iB machine": lambda x: x[1]["manufacturers"][0][
                "models"].append({"id":"fanuc-roboshot-alpha-s30ib",
                                  "model":"ROBOSHOT α-S30iB"}),
            "public alias bypass": lambda x: x[1]["manufacturers"][0][
                "models"][0].update(aliases=["FANUC ROBOSHOT alpha-S30iB"]),
        }
        for name, change in modifications.items():
            with self.subTest(name=name):
                inputs = deepcopy(self.real)
                change(inputs)
                with self.assertRaisesRegex(
                    AssertionError, "OEM source conflict HOLD"
                ):
                    self.validate(inputs)

    def test_unrelated_catalogue_entries_are_not_blocked(self):
        parts = deepcopy(self.real)
        parts[1]["manufacturers"][0]["models"].append({
            "id":"synthetic-other-model", "model":"Other verified geometry"
        })
        self.validate(parts)


if __name__ == "__main__":
    unittest.main()
