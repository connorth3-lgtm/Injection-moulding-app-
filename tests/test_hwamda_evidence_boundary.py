"""Synthetic safety regressions for HMD400M6 original-M6 OEM research."""
from copy import deepcopy
import json
import unittest

from qa_hwamda_evidence_boundary import ROOT, LEDGER, verify


class HwamdaEvidenceBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.actual = [
            json.loads((ROOT / LEDGER).read_text(encoding="utf-8")),
            json.loads((ROOT / "machine-library-v1.json").read_text(encoding="utf-8")),
            (ROOT / "research/hwamda-hmd400m6/README.md").read_text(
                encoding="utf-8"
            ),
        ]

    @staticmethod
    def machine(values):
        return next(
            model
            for maker in values[1]["manufacturers"]
            for model in maker.get("models", [])
            if model.get("id") == "hwamda-hmd400m6"
        )

    def test_original_historical_machine_remains_unknown(self):
        args = deepcopy(self.actual)
        verify(*args)
        self.assertIsNone(args[0]["installedInjectionUnit"])
        self.assertEqual(args[0]["installedControllerHost"], "unknown")
        self.assertEqual(args[0]["machineSuitability"], "unknown")
        self.assertEqual(args[0]["independentlyVerifiedOemManuals"], [])
        self.assertEqual(len(args[0]["publishedInjectionVariants"]), 2)

    def test_adversarial_machine_and_document_promotions_rejected(self):
        def inject_manual(args):
            self.machine(args)["manuals"][1]["exact_model"] = True

        def promote_missing(args):
            self.machine(args)["wanted_documents"][0]["status"] = "verified"

        def modify_variant(args):
            self.machine(args)["published_injection_variant"][
                "injection_pressure_mpa"
            ][1] = 152

        mutations = {
            "fictional controller host": lambda a: a[0].update(
                installedControllerHost="AK668"),
            "fictional injection unit": lambda a: a[0].update(
                installedInjectionUnit="HMD400M6-A"),
            "fictional installed pressure": lambda a: a[0].update(
                verifiedInstalledPressureMpa=206),
            "unsafe machine fit": lambda a: a[0].update(
                machineSuitability="pass"),
            "fabricated exact manual": lambda a: a[0].update(
                independentlyVerifiedOemManuals=["Techmation M8M"]),
            "missing OEM hydraulic evidence removed": lambda a: a[0][
                "missingOemDocuments"].remove(
                    "machine/serial-specific hydraulic schematic"
                ),
            "generation silently becomes M6-S": lambda a: a[0].update(
                generation="M6-S"),
            "unattributed variant silently reclassified": lambda a: a[0][
                "publishedInjectionVariants"][1].update(
                    status="documented-exact-model-distributor-archive"
                ),
            "unattributed spec given invented OEM URL": lambda a: a[0][
                "publishedInjectionVariants"][1].update(
                    url="https://example.invalid/pretend-service-manual.pdf"
                ),
            "A/B shot-volume mixed": lambda a: a[0][
                "publishedInjectionVariants"][0]["shotVolumeCm3"].__setitem__(
                    1, 1590
                ),
            "A/B pressure mixed": lambda a: a[0][
                "publishedInjectionVariants"][0]["injectionPressureMpa"].__setitem__(
                    1, 152
                ),
            "screw diameter coerced string": lambda a: a[0][
                "publishedInjectionVariants"][0]["screwDiameterMm"].__setitem__(
                    0, "70"
                ),
            "boolean instead of pressure": lambda a: a[0][
                "publishedInjectionVariants"][0]["injectionPressureMpa"].__setitem__(
                    0, True
                ),
            "unreviewed variant removed": lambda a: a[0][
                "publishedInjectionVariants"].pop(),
            "duplicate source variant": lambda a: a[0][
                "publishedInjectionVariants"][1].update(
                    id="hmd-m6-tech-pack"
                ),
            "injected approved flag": lambda a: a[0].update(
                approvedInstalledMachine=True
                ),
            "catalogue source promoted as installed rating": lambda a:
                self.machine(a)["published_injection_variant"].update(
                    status="installed-verified"
                ),
            "source A injection pressure silently replaced": modify_variant,
            "original M6 wrong generation": lambda a: self.machine(a).update(
                series="M6-S"
                ),
            "fabricated build year": lambda a: self.machine(a)[
                "manufacture_year"].update(value=2008, status="verified"),
            "machine host inferred from panel": lambda a: self.machine(a)[
                "controller"].update(host_controller="AK668"),
            "generic controller marked exact machine manual": inject_manual,
            "operation manual falsely acquired": promote_missing,
            "technical data relabelled service pack": lambda a:
                self.machine(a)["manuals"][0].update(type="operation"),
            "original M6 document caveat lost": lambda a: self.machine(a).update(
                generation_note="M6-S is interchangeable"),
            "variant conflict removed from research": lambda a: a.__setitem__(
                2, a[2].replace("Conflicting published injection-unit data", ""))
        }
        for label, mutate in mutations.items():
            with self.subTest(label=label):
                args = deepcopy(self.actual)
                mutate(args)
                with self.assertRaisesRegex(
                    AssertionError, "HMD400M6 OEM evidence HOLD:"
                ):
                    verify(*args)

    def test_unrelated_machine_entry_does_not_change_evidence_boundary(self):
        args = deepcopy(self.actual)
        args[1]["manufacturers"][0]["models"].append({
            "id": "qa-only-machine",
            "model": "Fictional unrelated machine",
            "research_status": "unknown",
        })
        verify(*args)


if __name__ == "__main__":
    unittest.main()
