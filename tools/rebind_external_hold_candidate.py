#!/usr/bin/env python3
"""Safely rebind external HOLD contracts to one retained exact runtime candidate.

This tool updates candidate identity/provenance only. It refuses to promote any
external validation status or populate human/device/provider evidence.
"""
from __future__ import annotations
import argparse, copy, datetime as dt, json, re
from pathlib import Path

from hold_candidate_packet_integrity import PACKETS, candidate_identity, hold_statuses, validate_packet, validate_packets

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
    hold_statuses(ledger)
    need(ledger["accessibility"]["status"]=="hold","accessibility status must remain HOLD")
    need(ledger["pwaPhysicalDevices"]["status"]=="hold","physical-device status must remain HOLD")
    need(ledger["nzqaProvider"]["status"]=="hold","NZQA provider status must remain HOLD")
    need(at["status"]=="pending-real-at-validation","real-AT contract must remain pending")
    need(nzqa["status"]=="pending-provider-validation","NZQA contract must remain pending")
    need(pwa["status"]=="pending-physical-device-validation","physical-device contract must remain pending")
    need(pwa.get("runtimeFingerprint") is None,"physical-device validated runtime fingerprint must remain unset")
    need(pwa.get("testedAt") is None and pwa.get("testerReference") is None and pwa.get("evidenceReference") is None,
         "physical-device evidence fields must remain empty")


def update_banner(text, candidate, path):
    """Replace only the release-specific artifact banner, retaining review evidence."""
    lines = text.splitlines(keepends=True)
    need(bool(lines) and candidate["release"] in lines[0], f"{path}: release heading stale")
    positions = [i for i, line in enumerate(lines[:12]) if line.startswith("> **RETAINED ")]
    need(len(positions) == 1, f"{path}: missing or ambiguous retained-artifact banner")
    try:
        validate_packet(text, path, candidate, candidate["release"])
        return text
    except ValueError:
        pass
    i = positions[0]
    expiry, fingerprint, digest = (candidate[key] for key in ("artifactExpiresAt", "runtimeFingerprint", "artifactDigest"))
    source, run, artifact = candidate["sourceSha"], candidate["candidateRunId"], candidate["artifactId"]
    banner = (
        f"> **RETAINED {candidate['release']} TECHNICAL ARTIFACT — INDEPENDENT REVIEWS HOLD.** "
        f"[Exact-source producer run {run}]"
        f"(https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/{run}) "
        f"created artifact **{artifact}**, source {source}, digest {digest}, expiry {expiry}, "
        f"and public-runtime fingerprint {fingerprint}. Producer quality must be independently "
        "verified. The retained artifact does not establish any human, real-device, "
        "Windows signing, provider, accreditation or production authorization."
    )
    lines[i] = banner + ("\r\n" if lines[i].endswith("\r\n") else "\n")
    result = "".join(lines)
    validate_packet(result, path, candidate, candidate["release"])
    return result


def prepare_packets(ledger, candidate):
    """Stage all seven packet edits before changing any on-disk state."""
    updates = {}
    for area, (field, _) in PACKETS.items():
        rel = ledger[area].get(field)
        need(isinstance(rel, str) and rel.endswith(f"_{candidate['release']}.md"),
             f"{area}: missing current release reviewer packet")
        target = (ROOT / rel).resolve()
        need(target.is_relative_to(ROOT.resolve()) and target.is_file(),
             f"{area}: missing/unsafe reviewer packet path")
        updates[target] = update_banner(target.read_text(encoding="utf-8"), candidate, rel)
    return updates

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
    need(a.artifact_name==f"physical-pwa-candidate-{a.source_sha}","artifact name must exactly match source SHA")

    candidate_identity({
        "release": a.release, "sourceSha": a.source_sha, "runtimeFingerprint": a.runtime_fingerprint,
        "candidateRunId": a.run_id, "candidateWorkflow": "Pre-merge Public Candidate",
        "artifactId": a.artifact_id, "artifactName": a.artifact_name,
        "artifactDigest": a.artifact_digest, "artifactExpiresAt": a.artifact_expires_at,
    }, a.release)
    expiry = dt.datetime.fromisoformat(a.artifact_expires_at.replace("Z", "+00:00"))
    need(expiry > dt.datetime.now(dt.timezone.utc), "candidate artifact has expired")
    need(load(ROOT / "version.json").get("web_release")==a.release, "version.json release mismatch")
    ledger,at,nzqa,pwa=(load(FILES[k]) for k in ("ledger","at","nzqa","pwa"))
    assert_hold_boundaries(ledger,at,nzqa,pwa)
    need(ledger["release"]==a.release==at["release"]==nzqa["release"]==pwa["release"],"release identity mismatch")

    identity={"release":a.release,"sourceSha":a.source_sha,"runtimeFingerprint":a.runtime_fingerprint}
    candidate={**identity,"candidateRunId":a.run_id,"candidateWorkflow":"Pre-merge Public Candidate",
               "artifactId":a.artifact_id,"artifactName":a.artifact_name,
               "artifactDigest":a.artifact_digest,"artifactExpiresAt":a.artifact_expires_at}

    previous=ledger.get("webCandidate")
    changed=previous!=candidate
    if not a.check and changed:
        if isinstance(previous,dict) and previous.get("sourceSha"):
            ledger["previousCandidate"]=copy.deepcopy(previous)
            if pwa.get("candidate"):pwa["previousCandidate"]=copy.deepcopy(pwa["candidate"])
            if nzqa.get("candidate"):nzqa["previousCandidate"]=copy.deepcopy(nzqa["candidate"])
            if at.get("sourceSha") and at.get("runtimeFingerprint"):
                at["previousCandidate"]={"release":at["release"],"sourceSha":at["sourceSha"],
                                         "runtimeFingerprint":at["runtimeFingerprint"]}
        # An unverified new artifact must not inherit its predecessor's PASS.
        ledger["technicalAutomation"]={
            "status":"fail",
            "claim":"New candidate metadata staged, but producer success and exact-head quality remain unverified. Independent validation is HOLD."
        }
        ledger["candidateStatus"]="Technical candidate staged; producer success NOT independently verified; seven external streams HOLD."
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
        validate_packets(ROOT,ledger)
        print("External HOLD candidate binding is current")
        return 0
    packet_updates=prepare_packets(ledger,candidate)
    for key,data in zip(("ledger","at","nzqa","pwa"),(ledger,at,nzqa,pwa)):
        write(FILES[key],data)
    for path,text in packet_updates.items():
        path.write_text(text,encoding="utf-8")
    print(f"Rebound four HOLD contracts and seven packets to {a.source_sha} without external validation")
    if changed:print("Technical automation FAIL until independent candidate producer verification")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
