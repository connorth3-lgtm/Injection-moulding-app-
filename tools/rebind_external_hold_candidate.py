#!/usr/bin/env python3
"""Safely rebind external HOLD contracts to one retained exact runtime candidate.

This tool updates candidate identity/provenance only. It refuses to promote any
external validation status or populate human/device/provider evidence.
"""
from __future__ import annotations
import argparse, copy, datetime as dt, json, os, re, tempfile
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

def previous_at_candidate(previous, at):
    """Preserve the old accessibility source under its actual old release key."""
    return {
        "release": previous.get("release"),
        "sourceSha": at["sourceSha"],
        "runtimeFingerprint": at["runtimeFingerprint"],
    }


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
    # A new release starts with a truthful PENDING artifact banner. Only a
    # real successful producer may later supply the retained candidate identity.
    # Both staged and already-bound packets must have exactly one active banner;
    # never accept a prior release's banner or ambiguous duplicated provenance.
    positions = [i for i, line in enumerate(lines[:12])
                 if line.startswith("> **RETAINED ") or line.startswith("> **PENDING ")]
    need(len(positions) == 1, f"{path}: missing or ambiguous artifact banner")
    i = positions[0]
    banner_release = re.match(
        r"^> \*\*(?:PENDING|RETAINED) (\d{4}\.\d{2}\.\d{2}\.\d+) (?:TECHNICAL )?ARTIFACT",
        lines[i],
    )
    need(bool(banner_release) and banner_release.group(1) == candidate["release"],
         f"{path}: artifact banner release mismatch")
    if lines[i].startswith("> **PENDING "):
        need("ARTIFACT" in lines[i] and "STOP" in lines[i],
             f"{path}: pending artifact banner must explicitly preserve tester HOLD")
    else:
        try:
            validate_packet(text, path, candidate, candidate["release"])
            return text
        except ValueError:
            pass
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


def stage_governance_model(model, candidate):
    """An unverified new technical candidate may never inherit prior PASS claims."""
    result=copy.deepcopy(model)
    result["currentPublicBoundary"]["technicalAutomation"]="fail"
    evidence=result["currentAssuranceEvidence"]
    evidence["staticContract"]={
        "status":"fail",
        "meaning":(
            f"HOLD: release {candidate['release']} source {candidate['sourceSha']} artifact "
            f"{candidate['artifactId']} and producer {candidate['candidateRunId']} are staged as technical "
            "metadata only; producer success and quality are NOT independently verified. "
            "No source, human, device or production approval is implied."
        ),
    }
    evidence["behavioralBrowser"]={
        "status":"fail",
        "meaning":(
            f"HOLD: browser and question gates for release {candidate['release']} source "
            f"{candidate['sourceSha']} must be independently verified on the staged candidate; "
            "prior green workflows do not transfer to a different exact source."
        ),
    }
    need(evidence["externalHumanDevice"]["status"]=="hold",
         "staged candidate cannot promote external human evidence")
    return result


def commit_staged_files(files):
    """Stage all writes before replacing any file; attempt rollback on disk failure."""
    snapshots={path:path.read_bytes() for path in files}
    temps={}
    changed=[]
    try:
        for path, content in files.items():
            with tempfile.NamedTemporaryFile("wb",dir=path.parent,prefix=".mm-staged-",delete=False) as out:
                out.write(content.encode("utf-8"))
                temps[path]=Path(out.name)
        for path, tmp in temps.items():
            os.replace(tmp,path)
            changed.append(path)
    except OSError:
        for path in reversed(changed):
            path.write_bytes(snapshots[path])
        raise
    finally:
        for tmp in temps.values():
            tmp.unlink(missing_ok=True)

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
                at["previousCandidate"]=previous_at_candidate(previous,at)
        # An unverified new artifact must not inherit its predecessor's PASS.
        ledger["technicalAutomation"]={
            "status":"fail",
            "claim":"New candidate metadata staged, but producer success and exact-head quality remain unverified. Independent validation is HOLD."
        }
        ledger["candidateStatus"]="HOLD — new candidate producer success NOT independently verified; seven external streams remain HOLD."
    ledger["webCandidate"]=candidate.copy()
    ledger["pwaPhysicalDevices"]["currentCandidate"]=candidate.copy()
    ledger["accessibility"]["candidate"]=identity.copy()
    ledger["nzqaProvider"]["candidate"]=identity.copy()
    at["sourceSha"]=a.source_sha
    at["runtimeFingerprint"]=a.runtime_fingerprint
    if changed and not a.check:
        at["boundary"]=(
            f"Automated browser and accessibility regressions do not substitute for real assistive-technology interaction by a human reviewer. "
            f"Release {a.release} is bound to exact retained learner-runtime candidate {a.source_sha}; all real-AT tasks remain pending until genuine human NVDA and VoiceOver evidence is recorded."
        )
    else:
        need(a.release in at.get("boundary","") and a.source_sha in at.get("boundary",""),
             "real-AT boundary must contain exact current candidate without rewriting human notes")
    nzqa["candidate"]=identity.copy()
    pwa["candidate"]=candidate.copy()
    if changed and not a.check:
        pwa["boundary"]=(
            f"Retained release {a.release} candidate {a.source_sha} and artifact {a.artifact_id} are NOT "
            "evidence of testing on physical iOS/iPadOS and Android devices. "
            "Real device install, offline restart, reboot, update, storage-pressure and zoom remain pending. "
            "Real assistive-technology validation is separately governed by "
            "data/accessibility-real-at-validation-v1.json. "
            "Production root, signing, provider and machine-control authority remain HOLD."
        )
        nzqa["boundary"]=(
            f"Release {a.release} technical candidate {a.source_sha} does not establish any of "
            "NZQA/provider G1–G8 external gates or assessment/accreditation authority."
        )
    assert_hold_boundaries(ledger,at,nzqa,pwa)

    if a.check:
        current=[load(FILES[k]) for k in ("ledger","at","nzqa","pwa")]
        desired=[ledger,at,nzqa,pwa]
        need(current==desired,"HOLD contracts are not bound to the supplied candidate")
        validate_packets(ROOT,ledger)
        print("External HOLD candidate binding is current")
        return 0
    packet_updates=prepare_packets(ledger,candidate)
    staged={
        FILES[key]:json.dumps(data,indent=2)+"\n"
        for key,data in zip(("ledger","at","nzqa","pwa"),(ledger,at,nzqa,pwa))
    }
    staged.update(packet_updates)
    if changed:
        # The public status and canonical assurance layers must move to FAIL
        # in the same transaction as the new candidate; the previous successful
        # source/build does not authorize this different identity.
        governance_path=ROOT/"data/governance-state-model-v1.json"
        governance=stage_governance_model(load(governance_path),candidate)
        staged[governance_path]=json.dumps(governance,indent=2)+"\n"
        from render_governance_status import render
        staged[ROOT/"GOVERNANCE_STATUS.md"]=render(model_override=governance)
    commit_staged_files(staged)
    print(f"Rebound four HOLD contracts and seven packets to {a.source_sha} without external validation")
    if changed:print("Technical automation FAIL until independent candidate producer verification")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
