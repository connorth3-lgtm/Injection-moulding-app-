#!/usr/bin/env python3
from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(TOOLS))

import build_measured_learning_case as builder  # noqa: E402
import qa_measured_learning_library as qa  # noqa: E402
from measured_learning_core import calculate_method, canonical_sha, raw_window_fingerprint, representation_fingerprint, window_overlap  # noqa: E402


class MeasuredLearningV2Tests(unittest.TestCase):
    def binding(self):
        return {
            "schemaVersion":2,"caseId":"MLM-021","sourceFamily":"openmms-t4g","datasetId":"openmms-t4g",
            "sourceReference":"TEPGomes/OpenMMS-T4G@cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7",
            "sourceFingerprint":"sha256:aa78e659bc4b7a0361882d2eaa516a0010bfb573d413a3600baad98aae397bf6",
            "licenceOrAccessStatus":"bsd-3-clause",
            "extraction":{"description":"first four published rows used only as deterministic QA fixture","sourceArtifact":"Real_World_Test/Case_Study_Raw_Data.csv","sourceMember":None,"sourceOrderingPreserved":True,"window":{"kind":"range","axis":"row-index","scope":"Case_Study_Raw_Data.csv","start":0,"endExclusive":4,"unit":"row"}},
            "signals":[
                {"id":"pressure","sourceChannel":"P","label":"Cavity pressure","semantic":"cavity-pressure","unit":"bar","representation":{"originalPointCount":4,"reductionMethod":"identity-v1","xSemantic":"time","xUnit":"s","x":[0.015883300000041345,0.11717850000002272,0.30457799999999224,0.3722109000000273],"y":[0.0,0.0,0.0,0.0]}},
                {"id":"force","sourceChannel":"F","label":"Extraction force","semantic":"extraction-force","unit":"N","representation":{"originalPointCount":4,"reductionMethod":"identity-v1","xSemantic":"time","xUnit":"s","x":[0.015883300000041345,0.11717850000002272,0.30457799999999224,0.3722109000000273],"y":[0.0,109.45,109.45,27.36]}},
            ],
            "features":[{"id":"force-range","label":"Force range","method":"range","methodVersion":1,"inputs":["signal:force"],"params":{},"calculationScope":"fixture-window","unit":"N"}],
            "observations":[{"id":"OBS-1","text":"Extraction force varies across these four published samples while cavity pressure remains at zero.","support":["signal:pressure","signal:force","feature:force-range"]}],
            "learnerTask":{"observePrompt":"What differs between these two measured signals?","investigatePrompt":"What additional cycle context would you inspect before interpreting this interval?","explanation":"This fixture proves the governed data path and does not diagnose a process mechanism.","takeaway":"A measured difference can be observed without assigning a cause."},
            "supportedConclusions":["The selected force values vary while the selected pressure values are zero."],
            "unsupportedConclusions":["These four samples do not establish a moulding-cycle fault or production root cause."],
            "limitations":["Four-row CI fixture only; not a learner case and not representative of a complete moulding cycle."],
            "novelty":{"learningObjective":"qa-fixture-openmms-exact-artifact-channel-feature-chain","sourceWindowReuse":False,"reuseJustification":None},
            "sourceEstablishesCausality":False,"claimScope":"observation_only","reviewed":True,
            "authorId":"ci-fixture-author","reviewerId":"ci-fixture-reviewer","reviewerRole":"test-evidence-review","reviewRecordType":"test-fixture","reviewRecord":"tests/test_measured_learning_v2.py","reviewedAt":"2026-09-05T00:00:00Z",
        }

    def candidate(self): return builder.catalogue_by_id()["MLM-021"]

    def explicit_artifact_list_binding(self):
        binding=copy.deepcopy(self.binding()); digest=binding.pop("sourceFingerprint"); name=binding["extraction"].pop("sourceArtifact")
        binding["extraction"]["sourceArtifacts"]=[{"name":name,"sha256":digest}]
        return binding

    @staticmethod
    def ratio_signal(signal_id, values, x=None):
        x=x or list(range(1,len(values)+1))
        return {"id":signal_id,"semantic":"recorded-count","unit":"units","representation":{"x":x,"y":values,"xSemantic":"observation-index","xUnit":"index"}}

    def test_valid_fixture_builds_and_revalidates(self):
        case=builder.build(self.candidate(),self.binding()); self.assertEqual(case["schemaVersion"],3); self.assertAlmostEqual(case["features"][0]["value"],109.45)
        qa.validate_case_object(case,self.candidate(),qa.readiness_map(),qa.artifacts_map(),qa.channels_map(),qa.methods_map())

    def test_explicit_source_artifacts_binding_builds_and_revalidates(self):
        case=builder.build(self.candidate(),self.explicit_artifact_list_binding())
        self.assertIn("sourceArtifacts",case["source"]); self.assertNotIn("sourceFingerprint",case["source"])
        qa.validate_case_object(case,self.candidate(),qa.readiness_map(),qa.artifacts_map(),qa.channels_map(),qa.methods_map())

    def test_explicit_source_artifacts_wrong_hash_fails(self):
        binding=self.explicit_artifact_list_binding(); binding["extraction"]["sourceArtifacts"][0]["sha256"]="sha256:"+"0"*64
        with self.assertRaises(SystemExit): builder.build(self.candidate(),binding)

    def test_multi_artifact_raw_identity_is_order_independent(self):
        extraction={"window":{"kind":"id_set","axis":"cycle-id","scope":"fixture","ids":[250,251]}}
        a=[{"name":"cycle-b.csv","sha256":"sha256:"+"b"*64},{"name":"cycle-a.csv","sha256":"sha256:"+"a"*64}]
        b=list(reversed(a))
        self.assertEqual(raw_window_fingerprint(None,a,None,extraction),raw_window_fingerprint(None,b,None,extraction))

    def test_wrong_artifact_hash_fails(self):
        binding=self.binding(); binding["sourceFingerprint"]="sha256:"+"0"*64
        with self.assertRaises(SystemExit): builder.build(self.candidate(),binding)

    def test_wrong_channel_unit_fails(self):
        binding=self.binding(); binding["signals"][0]["unit"]="MPa"
        with self.assertRaises(SystemExit): builder.build(self.candidate(),binding)

    def test_author_and_reviewer_must_differ(self):
        binding=self.binding(); binding["reviewerId"]=binding["authorId"]
        with self.assertRaises(SystemExit): builder.build(self.candidate(),binding)

    def test_tampered_feature_is_rejected_even_with_new_case_hash(self):
        case=builder.build(self.candidate(),self.binding()); case["features"][0]["value"]+=1.0; case["caseFingerprint"]=canonical_sha({k:v for k,v in case.items() if k!="caseFingerprint"})
        with self.assertRaises(AssertionError): qa.validate_case_object(case,self.candidate(),qa.readiness_map(),qa.artifacts_map(),qa.channels_map(),qa.methods_map())

    def test_raw_window_identity_is_separate_from_representation(self):
        binding=self.binding(); extraction=binding["extraction"]
        raw1=raw_window_fingerprint(binding["sourceFingerprint"],extraction["sourceArtifact"],None,extraction)
        changed=copy.deepcopy(binding["signals"]); changed[1]["representation"]["y"][1]+=10
        raw2=raw_window_fingerprint(binding["sourceFingerprint"],extraction["sourceArtifact"],None,extraction)
        self.assertEqual(raw1,raw2); self.assertNotEqual(representation_fingerprint(raw1,binding["signals"]),representation_fingerprint(raw2,changed))

    def test_substantial_overlap_is_detected(self):
        a={"kind":"range","axis":"row-index","scope":"x","start":0,"endExclusive":100,"unit":"row"}; b={"kind":"range","axis":"row-index","scope":"x","start":10,"endExclusive":100,"unit":"row"}
        self.assertEqual(window_overlap(a,b),1.0)

    def test_expansion_is_not_available_while_gate_is_locked(self): self.assertNotIn("MLM-071",builder.catalogue_by_id())

    def test_ratio_of_sums_percent_uses_aggregate_counts(self):
        rejected=self.ratio_signal("rejected",[2,3,5]); production=self.ratio_signal("production",[100,100,200]); value,unit=calculate_method("ratio_of_sums_percent",[rejected,production]); self.assertAlmostEqual(value,2.5); self.assertEqual(unit,"%")

    def test_ratio_of_sums_percent_rejects_zero_aggregate_denominator(self):
        with self.assertRaisesRegex(ValueError,"aggregate denominator > 0"): calculate_method("ratio_of_sums_percent",[self.ratio_signal("rejected",[1,2,3]),self.ratio_signal("production",[0,0,0])])

    def test_ratio_of_sums_percent_requires_aligned_coordinates(self):
        with self.assertRaisesRegex(ValueError,"identical aligned x values"): calculate_method("ratio_of_sums_percent",[self.ratio_signal("rejected",[1,2,3],[1,2,3]),self.ratio_signal("production",[100,100,100],[1,2,4])])


if __name__=="__main__": unittest.main()
