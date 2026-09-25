# Full-app remediation backlog

Status: active architecture consolidation contract.

This backlog records the remaining findings from the 2026-09-25 full application/code audit that cannot be truthfully closed by a cosmetic patch or by automated CI alone.

## Release invariants

- Do not modify the frozen recovery core merely to reduce architecture-debt counts.
- Do not weaken CSP, visual-regression, assessment-key, release-provenance, or external-validation gates to make a change pass.
- Do not convert physical-device, assistive-technology, SME, learner-outcome, signing, or provider/NZQA HOLDs into PASS without genuine external evidence.
- Every retired root compatibility layer must reduce the architecture-debt baseline in the same change so it cannot silently return.

## Remaining engineering work

1. **Root compatibility retirement** — migrate each grandfathered root compatibility layer into its owning domain or deterministic pack, preserving execution order and Runtime V2 ownership. Target: zero grandfathered compatibility layers.
2. **Canonical release asset graph** — make one generated manifest the source for browser bootstrap, service-worker caching, Pages packaging, and desktop integrity manifests. Until consumers are migrated, CI must continue proving their inventories agree.
3. **CI coverage meta-gate** — define required checks by changed-path/risk class and verify that required checks ran, not merely that the checks which happened to run passed.
4. **Dynamic HTML sink reduction** — inventory active `innerHTML`/HTML insertion sites by trust boundary; replace dynamic/untrusted sinks with DOM construction or a narrowly reviewed sanitizer. Keep frozen recovery bytes immutable.
5. **Storage ownership matrix** — document and gate learner/site/device ownership, persistence technology, backup behavior, reset behavior, and migration behavior for every durable store.
6. **Client compatibility matrix** — explicitly map web, desktop, and Android release lanes to supported runtime/content/storage contracts.
7. **External validation** — complete physical PWA, real AT, Windows distribution/signing, curriculum/book SME, learner-outcome, and NZQA/provider work only from genuine evidence.

## Closed in this remediation

- Assessment navigator retains the approved 38 px visual control while exposing a 44 px effective pointer hit target through a pseudo-element.
- Premium UI QA measures the effective assessment navigator hit area across 320, 360, 390, 412, and 1024 px viewports.

The items above are intentionally explicit rather than being marked fixed without implementation or evidence.
