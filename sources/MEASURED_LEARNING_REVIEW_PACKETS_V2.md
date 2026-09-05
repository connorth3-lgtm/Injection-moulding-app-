# Measured Learning Review Packets V2

## Purpose

The case-specific review packets reduce the mechanical work required for independent engineering review of the 70-case measured-learning release curriculum without weakening the review boundary.

They are transient CI review aids. They are **not learner cases**, are not committed under `data/measured-learning/cases/`, do not enter `promoted-v1.json`, and cannot satisfy promotion by themselves.

## Verified state

The first fully integrated packet run is **MouldMaster Measured Learning Library run #140** on V2 head `28deda4a42a367a2617a0bece8bd47c11a94d1c0`.

That run passed, in order:

1. exact public-source proof and extraction;
2. 70/70 numeric/direct-binding authoring coverage QA;
3. deterministic 70-case independent-review queue generation and QA;
4. 70 case-specific review-packet generation;
5. fail-closed review-packet QA;
6. release-library governance QA;
7. learner payload QA.

The generated artifact contains:

- **70** case-specific review packets (`MLM-001..MLM-070`);
- **40** distinct transient source-derived authoring candidates upstream;
- **39** pinned candidate evidence bundles used by the 70-case review queue;
- **4,590,262 bytes** aggregate review-packet payload;
- **133,592 bytes** for the largest individual packet;
- **0** reviewed packets;
- packet-level `promotionEligible: false`;
- **0** promoted learner cases.

The packet payload therefore remains comfortably inside the review-aid budget of 512 KiB per packet and 20 MiB aggregate.

## What a packet contains

Each `MLM-xxx` packet copies the exact evidence bundle already pinned by the deterministic review queue. It contains:

- curriculum case ID, title, difficulty, analysis lens and coverage tags;
- governed source family;
- selected authoring candidate ID and candidate fingerprint;
- exact registered source artifact names and SHA-256 values;
- governed licence/access scope;
- source-selection scope;
- exact required source channels for that case;
- the complete compact measured signal representations selected for review;
- signal semantics, units, X semantics/units and representation fingerprints;
- any registered recommended descriptive feature recipe;
- the evidence boundary carried from the source/candidate review layer;
- the same seven-part engineering review checklist used by the queue.

The packets remove the need for a reviewer to manually join a queue entry back to a large candidate artifact merely to inspect the underlying bounded measurements.

## What a packet deliberately does not contain

The packet builder leaves all interpretive and approval fields empty:

- reviewed observations;
- learner observe/investigate prompts;
- engineering explanation;
- takeaway;
- supported conclusions;
- unsupported conclusions;
- limitations;
- novelty learning objective;
- source-window reuse decision/justification;
- causality decision;
- final claim scope;
- author identity;
- reviewer identity and role;
- review record/reference;
- review timestamp;
- approval/rejection decision;
- reviewer notes.

These fields require case-specific engineering judgment and, for promotion, independent reviewer identity distinct from the author.

## Fail-closed QA

`qa_measured_learning_review_packets.py` re-links every generated packet to the review queue and original transient candidate artifact. It rejects:

- missing or extra release packets;
- packet/queue case metadata drift;
- candidate ID or fingerprint drift;
- source-family drift;
- source-artifact/hash drift;
- rights-scope drift;
- source-scope drift;
- signal representation drift;
- required-channel omissions;
- single-signal evidence for curriculum cases tagged `multi-signal`;
- missing engineering units or X semantics;
- packet payloads above 512 KiB;
- aggregate packet payload above 20 MiB;
- any pre-authored observation, learner explanation, conclusion, limitation or novelty judgment;
- any pre-filled causality or claim-scope judgment;
- any fabricated author/reviewer identity, review record, timestamp, decision or notes;
- any packet or index marked promotion-eligible.

The packet index also records exact byte counts and requires all review states to remain `unreviewed` at generation time.

## Promotion boundary

A review packet is an evidence presentation surface only. The promotion path remains:

**governed source evidence → pinned authoring candidate → independent review packet → completed case-specific V2 binding → independent engineering review → promotion QA → learner-visible measured case**

No step in packet generation may skip the binding, novelty/window-reuse, author/reviewer separation or promotion QA requirements.

Public measured evidence remains observation/association evidence unless the source itself establishes something stronger. A validated production mechanism still requires the separate real-site chain:

**measurement → MouldMaster ranked mechanism → independent site investigation → corrective action → recovery evidence**
