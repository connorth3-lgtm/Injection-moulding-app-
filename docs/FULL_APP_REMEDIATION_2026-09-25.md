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

## Implemented in this remediation\n\n- Canonical release-asset agreement is now fail-closed: the runtime-domain manifest must be represented in the service-worker release inventory, duplicate CORE/OPTIONAL ownership is rejected, and missing governed files fail QA. Consumer migration to one generated manifest remains open.\n- Durable storage ownership and client compatibility matrices are now explicit and QA-gated.\n- Dynamic HTML sinks now have an explicit trust-boundary register; incremental sink retirement remains open.\n- Architecture documentation now matches the enforced 15 BODY_SCRIPTS / 5 root runtime / 0 document.write ceilings.\n- Mobile Browser QA excludes the separately enforced visual-lock test from the Chromium substantive suite using the stable test-title contract rather than a stale release number.\n\n## Explicitly still open\n\n- The assessment navigator remains at the approved 38 px visual geometry. A 44 px target requires an intentional visual-release/baseline change; this remediation does not claim otherwise.\n- Root compatibility retirement, generated-manifest consumer migration, CI coverage meta-gating, and incremental dynamic/untrusted HTML sink replacement remain engineering work.\n- All external validation areas remain HOLD until genuine evidence exists.

The items above are intentionally explicit rather than being marked fixed without implementation or evidence.
