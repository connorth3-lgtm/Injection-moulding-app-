# Measured Learning Library V2

## Decision

V2 makes MouldMaster **100-case capable without changing the current 70-case release target**.

The existing `MLM-001..MLM-070` catalogue remains the governed release curriculum. `MLM-071..MLM-100` are reserved identifiers only. They are not authored, counted as learner cases, or promotable until the V2 expansion gate passes.

This prevents a round-number target from lowering evidence quality.

## V2 expansion gate

`data/measured-learning/v2-policy.json` requires all of the following before the 71-100 expansion is considered unlocked:

- at least 50 of the existing 70 cases promoted;
- at least 15 independent promotion-ready source families;
- source-window reuse rate at or below 10%;
- lazy case loading in the learner runtime;
- authoritative source-fingerprint verification;
- real X-axis rendering;
- explicit case-novelty review.

The 100-case design target also carries concentration guardrails: the largest source should be no more than 15% of the final 100 and the top four sources should be no more than 45% combined. Those shares cannot be proven until cases 71-100 are actually proposed, so they remain expansion acceptance criteria rather than claims about the present 70-case catalogue.

## Catalogue eligibility is not promotion readiness

V1 used the execution-ledger `accepted-profiled*` family as the catalogue eligibility boundary. V2 keeps that broad catalogue boundary but introduces a second, stricter promotion boundary in `source-readiness-v2.json`.

A source can therefore be useful for curriculum planning while still being blocked from learner promotion because of unresolved units, unresolved semantics, restricted research/education terms, noncommercial terms, or another explicit source-specific limitation.

Promotion is fail-closed. A source marked `promotionReady: false` cannot be promoted by the case builder merely because its dataset family is present in the 70-case catalogue.

## Authoritative source fingerprints

A V2 binding must provide an exact SHA-256 fingerprint that already appears in the source family's committed benchmark evidence under `data/public-benchmark-results/`.

The builder and QA recursively recover governed SHA-256 values from the recorded benchmark result and reject a binding whose fingerprint is merely well-formed but not evidenced.

This closes the V1 gap where a syntactically valid SHA-256 string could be supplied without independent reconciliation to the source evidence already retained by the repository.

## Numerical trace integrity

Every V2 signal representation requires:

- finite numeric `x` and `y` values;
- equal non-empty X/Y lengths;
- no more than 600 displayed points;
- original point count at least as large as the displayed count;
- deterministic reduction method;
- resolved Y semantic and engineering unit;
- resolved X semantic and unit;
- monotonic non-decreasing X ordering.

The learner renderer uses the actual X values for horizontal spacing. It no longer assumes every compact trace is evenly sampled by array index.

Each chart states the X scope and the engineering Y range and explicitly notes that vertical display is scaled per signal. This prevents normalized chart height from being mistaken for equal absolute engineering magnitude across different signals.

## Feature governance

`feature-methods-v1.json` is the allow-list for calculated learner features.

Every feature must provide:

- stable feature ID;
- registered method;
- registered method version;
- calculation scope;
- input fingerprint;
- calculation fingerprint;
- finite numeric value.

A feature remains descriptive evidence. Registering a calculation method does not grant causal meaning.

## Stronger observation links

Every learner-facing observation must reference existing `signal:<id>` or `feature:<id>` evidence. Unknown links fail QA.

This keeps engineering prose attached to the numerical evidence that supports it.

## Independent review identity

V2 promotion requires:

- `reviewed: true`;
- stable `reviewerId`;
- reviewer role;
- stable `reviewRecord`;
- review timestamp.

The final case asset retains those fields in its provenance block. The runtime exposes the review reference to the learner rather than hiding review governance entirely behind the build pipeline.

## Novelty and reuse

Each promoted case must state a distinct `novelty.learningObjective`.

The same source-window fingerprint plus the same canonical set of signals may not appear as another case. Reuse of a source window with a materially different signal set is allowed only when every reused case explicitly sets `sourceWindowReuse: true` and supplies a reviewable justification.

The corpus-wide source-window reuse rate may not exceed 10%.

This prevents changing only the title or analysis lens from inflating the library count.

## Payload and runtime budget

V2 sets:

- typical case target: 256 KiB;
- hard individual case ceiling: 512 KiB;
- aggregate promoted measured-library ceiling: 20 MiB.

The learner library loads only the catalogue, promotion index, V2 policy and source-readiness metadata when opened. Individual measured case JSON is fetched only when the learner opens that case and is then cached in memory.

This architecture is appropriate for 70 cases and remains viable if the expansion gate later unlocks 100.

## Evidence tiers remain unchanged

- **Synthetic** — controlled teaching evidence where the scenario cause can be known because MouldMaster generated it.
- **Measured** — real measured behaviour supporting observations and bounded associations; default claim scope remains observation-only.
- **Site validated** — measured production evidence paired with an independently investigated production finding.

V2 does not weaken the real-site pilot contract and ordinary public measured cases still cannot self-promote to `validated_mechanism`.

## Release interpretation

V2 distinguishes four numbers that must not be conflated:

1. **catalogue capacity** — 100;
2. **current release target** — 70;
3. **promotion-ready candidate count** — recalculated from the source-readiness registry;
4. **promoted learner-case count** — exact QA-valid case assets in the promotion index.

Only the fourth number represents real measured cases currently available to learners.
