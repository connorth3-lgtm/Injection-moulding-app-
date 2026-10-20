# Repository-wide hygiene assessment — 9 October 2026

**Scope:** a read-only inventory of the full Git tree, not a claim that every line of code has received human security or engineering review. A root `.gitignore` now prevents accidentally staging local dependencies, generated build/test outputs, credentials and unreviewed installer archives.

## Tracked-tree inventory

Inventory baseline: `preview` at squash merge `cedee690036ac493b2fa1fbbf1cd8e2232b9001d`.

- **1,776 tracked files** across **16 top-level areas** (including root), approximately 25.6 MB of tracked file content.
- `qa/`: 576 files, mostly historical validation packets and executable browser tests.
- `data/`: 337 files, mostly governed JSON datasets.
- `tools/`: 114+ Python tools; `src/`: 103 runtime/source files.
- `.github/`: 80+ policy/workflow files, including 77 workflow YAML files.
- `certification/`, `sources/`, `docs/`, `desktop/`, `assets/`, `audit/`, `machine-research/`, `credentials/`, `research/`, and `tests/`: retained subject-area evidence and supporting code.

Counts are a historical snapshot; the required `tools/repository_hygiene.py` gate computes live counts for **every tracked path**. It is run by MouldMaster Release QA on the exact candidate checkout.

## Checks introduced

| Surface | New automated invariant |
| --- | --- |
| Every tracked file/folder | Valid, portable path; case-insensitive collision prevention; no tracked symlink/submodule/special modes; all folders under reviewed owners |
| Credential/scratch-file hazards | Reject `.env*`, key-store/private-key file patterns, typical OS junk; detect embedded unencrypted private-key PEM blocks in source/configuration |
| Unexpected release archives | Prevent adding arbitrary executables or ZIPs without policy review |
| Frozen recovery lane | Preserve exact historical `MouldMasterAcademy.exe` and source-freshness audit archive; existing SHA/provenance checks remain authoritative |
| All tracked `*.json` | JSON parseability; existing domain validators remain responsible for semantics |
| Every Actions workflow | Immutable 40-hex action refs; Docker actions require digest; existing detailed governance tests still enforce permissions, triggers, token privileges and publications |
| Book and quality data publication | Hash-equal canonical `data/` and runtime-facing `src/domains/**/data/` mirrors; missing mirror source fails instead of silently drifting |
| Runaway additions | Explicit review for tracked files larger than 8 MiB |
| Regressions | Unit tests for unsafe additions, path collisions, symlinks, secret markers, unlocked actions, bad JSON and diverging mirrors |

The new QA does **not** weaken existing release checks, current CSP, runtime dependency graph, cache/release identity, provenance, privacy isolation, human/device HOLDs or protected-main rules.

## Local file hygiene

Root `.gitignore` covers Node/Electron packages, Python environments and caches, generated Pages/QA outputs, local environment files, key stores, desktop installers, ZIP downloads and OS/editor debris. Already tracked historical evidence and the frozen Windows recovery executable remain under their existing immutable SHA/evidence guards. The QA gate requires these ignore rules on future commits. Do not use `git clean -fdx` on a working directory holding unsaved learner or operator data.

## What was deliberately not deleted

- Hundreds of historical `qa/` release packets are retained as audit/review evidence.
- Canonical Book data and their byte-identical runtime mirrors are **intentional publication duplicates**. Deleting either copy would risk offline references, source provenance or Pages asset integrity.
- The checked-in Windows recovery executable is pinned by an audited SHA-256 and belongs to the isolated frozen recovery lane; it is not an unsigned replacement for current Windows distribution.
- Archived source-freshness ZIP evidence and legacy standalone HTML documents are retained pending provenance-safe, separately reviewed retirement.

## Limits and remaining work

This deterministic gate is **not** a substitute for full code review, dependency advisory checks, threat modelling, independent SME review, physical mobile testing, real NVDA/VoiceOver testing or signed desktop validation. It cannot prove that an arbitrary JSON object is truthful, that every workflow policy is correct, or that all application strings are safe. Existing domain-specific test suites provide additional coverage.

Prior to external invitations, [PR #511](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/511) and the live preview/version discrepancy in [issue #512](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/512) must be resolved through the protected-main process. [Draft #513](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/513) is **not** an approved production promotion.

**External validations remain HOLD; production authority remains advisory-only.** No automatic rollout, purge or release authorization follows from this report.
