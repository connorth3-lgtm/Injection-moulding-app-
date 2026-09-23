# Fine-tooth code audit — 2026-09-24

This audit continues the monotonic architecture cleanup on top of the existing debt ceilings.

## Remediation in this tranche

The domain bootstrap previously started two learner-facing compatibility runtimes with separate `async=true` script insertions before the manifest-driven domain bootstrap. That created a timing-dependent initialization path: those runtimes could execute before, during, or after domain assets depending on fetch/cache timing.

The bootstrap now has one deterministic loader:
- the two remaining learner UI compatibility assets are explicitly allowlisted and load first, preserving their historical precedence without network-timing races;
- manifest domain assets then load sequentially in declared order;
- `mm:domains-ready` fires only after the complete governed sequence is loaded.

`qa_architecture_debt.py` now rejects a return to fire-and-forget async compatibility loading.

## Audit observations retained for later tranches

- The five grandfathered root runtime entries remain at the current architecture ceiling; they should be reduced only with behavior-equivalent migration and release QA.
- Root compatibility layers remain historical debt even where they are no longer direct bootstrap entries.
- The frozen legacy EXE/core recovery artifacts remain compatibility dependencies and are not cosmetic deletion candidates.
- Workflow count remains high; consolidation requires trigger, permission, artifact, and failure-semantics equivalence rather than filename-based deletion.
- Local storage usage is widespread; migration should continue through the existing Runtime V2 scoped-storage boundary rather than a bulk mechanical replacement.
- DOM HTML sinks are numerous and require sink-by-sink trust analysis; no broad replacement was attempted in this tranche.

This tranche deliberately changes initialization ownership rather than product behavior.

## CI follow-up

The first candidate exposed two fail-closed gates. Browser QA showed tiny but repeatable Home visual drift when compatibility assets were moved after domain assets; the loader was corrected to preserve historical compatibility precedence while still removing async timing races. Release external validation separately reports the physical-PWA packet fingerprint as stale against the prior exact release; that release-specific evidence is intentionally not rewritten as part of a code-cleanup PR.
