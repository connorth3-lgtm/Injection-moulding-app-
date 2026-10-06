#!/usr/bin/env python3
"""Safely rebind external HOLD contracts to one retained exact runtime candidate.

This tool updates candidate identity/provenance only. It refuses to promote any
external validation status or populate human/device/provider evidence.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FILES={
    "ledger":ROOT/"data/release-external-validation-v1.json",
    "at":ROOT/"data/accessibility-real-at-validation-v1.json",
    "nzqa":ROOT/"data/nzqa-external-validation-v1.json",
    "pwa":ROOT/"data/pwa-physical-device-validation-v1.json",
}

def load(path):return json.loads(path.read_text(encoding="utf-8"))
def write(path,data):path.write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
def need(cond,msg):
    if not cond:raise SystemExit(msg)

def assert_hold_boundaries(ledger,at,nzqa,pwa):
    need(ledger["accessibility"]["status"]=="hold","accessibility status must remain HOLD")
    need(ledger["pwaPhysicalDevices"]["status"]=="hold","physical-device status must remain HOLD")
    need(ledger["nzqaProvider"]["status"]=="hold","NZQA provider status must remain HOLD")
    need(at["status"]=="pending-real-at-validation","real-AT contract must remain pending")
    need(nzqa["status"]=="pending-provider-validation","NZQA contract must remain pending")
    need(pwa["status"]=="pending-physical-device-validation","physical-device contract must remain pending")
    need(pwa.get("runtimeFingerprint") is None,"physical-device validated runtime fingerprint must remain unset")
    need(pwa.get("testedAt") is None and pwa.get("testerReference") is None and pwa.get("evidenceReference") is None,
         "physical-device evidence fields must remain empty")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--release",required=True)
    ap.add_argument("--source-sha",required=True)
    ap.add_argument("--runtime-fingerprint",required=True)
    ap.add_argument("--run-id",type=int,required=True)
    ap.add_argument("--artifact-id",type=int,required=True)
    ap.add_argument("--artifact-name",required=True)
    ap.add_argument("--artifact-digest",required=True)
    ap.add_argument("--artifact-expires-at",required=True)
    ap.add_argument("--check",action="store_true")
    a=ap.parse_args()
    need(re.fullmatch(r"[0-9a-f]{40}",a.source_sha) is not None,"source SHA must be exact 40-char lowercase hex")
    need(re.fullmatch(r"sha256:[0-9a-f]{64}",a.runtime_fingerprint) is not None,"runtime fingerprint must be sha256")
    need(re.fullmatch(r"sha256:[0-9a-f]{64}",a.artifact_digest) is not None,"artifact digest must be sha256")
    need(a.artifact_name.endswith(a.source_sha),"artifact name must bind to exact source SHA")

    ledger,at,nzqa,pwa=(load(FILES[k]) for k in ("ledger","at","nzqa","pwa"))
    assert_hold_boundaries(ledger,at,nzqa,pwa)
    need(ledger["release"]==a.release==at["release"]==nzqa["release"]==pwa["release"],"release identity mismatch")

    identity={"release":a.release,"sourceSha":a.source_sha,"runtimeFingerprint":a.runtime_fingerprint}
    candidate={**identity,"candidateRunId":a.run_id,"candidateWorkflow":"Pre-merge Public Candidate",
               "artifactId":a.artifact_id,"artifactName":a.artifact_name,
               "artifactDigest":a.artifact_digest,"artifactExpiresAt":a.artifact_expires_at}

    ledger["webCandidate"]=candidate.copy()
    ledger["pwaPhysicalDevices"]["currentCandidate"]=candidate.copy()
    ledger["accessibility"]["candidate"]=identity.copy()
    ledger["nzqaProvider"]["candidate"]=identity.copy()
    at["sourceSha"]=a.source_sha
    at["runtimeFingerprint"]=a.runtime_fingerprint
    at["boundary"]=(
        f"Automated browser and accessibility regressions do not substitute for real assistive-technology interaction by a human reviewer. "
        f"Release {a.release} is bound to exact retained learner-runtime candidate {a.source_sha}; all real-AT tasks remain pending until genuine human NVDA and VoiceOver evidence is recorded."
    )
    nzqa["candidate"]=identity.copy()
    pwa["candidate"]=candidate.copy()
    assert_hold_boundaries(ledger,at,nzqa,pwa)

    if a.check:
        current=[load(FILES[k]) for k in ("ledger","at","nzqa","pwa")]
        desired=[ledger,at,nzqa,pwa]
        need(current==desired,"HOLD contracts are not bound to the supplied candidate")
        print("External HOLD candidate binding is current")
        return 0
    for key,data in zip(("ledger","at","nzqa","pwa"),(ledger,at,nzqa,pwa)):
        write(FILES[key],data)
    print(f"Rebound external HOLD contracts to {a.source_sha} without changing external validation status")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
