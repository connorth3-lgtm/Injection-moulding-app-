# MouldMaster app-wide deep-dive audit — 2026-09-03

Baseline audited: `main` at `bf6f5260564d3ee1c5acba184760965a2b5dd1f6` after PR #145.

This pass was performed after the release/provenance, learner-storage, PWA, desktop, exact-material and browser-matrix remediation work. The goal was not to add another feature wave. It was to find remaining structural debt, stale metadata and release-path divergence, then convert the highest-value findings into enforceable cleanup.

## Executive result

The active product is materially healthier than the legacy source layout suggests. Release provenance now fails closed, the real post-squash Pages path is proven, engineering records are learner-owned, browser/PWA state is non-destructive, desktop packaging is integrity-checked, exact-grade material claims retain provenance and test context, and the browser matrix covers Chromium, Firefox and WebKit.

The largest remaining technical debt is the legacy bootstrap/global-layer architecture. That debt is now capped by CI so it can shrink but cannot silently expand.

No evidence was found in this pass that justified weakening provenance, privacy, exact-grade semantics, offline behavior or desktop security in order to simplify the codebase.

## 1. Production release provenance — resolved

### Finding

Earlier post-merge Pages runs exposed a GitHub API contract mismatch: the post-merge provenance guard could resolve the squash-merged PR while the Pages production-source verifier could not. The problem only appeared on real `main` squash commits, so ordinary offline verifier tests were insufficient.

### Cleanup completed before this audit branch

PR #145 made the Pages job exercise its own real token/API context against the current `main` base SHA before merge and aligned the production-source verifier with the successful `gh api` transport.

Post-merge proof on `bf6f5260564d3ee1c5acba184760965a2b5dd1f6`:

- Main PR Provenance Guard: success.
- Deploy MouldMaster to GitHub Pages: success.

### Additional cleanup from this audit

`tools/quarantine_legacy_pages.py` was the remaining GitHub-API helper in the Pages path using raw `urllib` plus an explicit REST-version header. It has been migrated to the same authenticated `gh api` transport as the other release guards. `qa_pages_single_publisher.py` now rejects a return to the raw transport.

The policy remains fail closed. This change consolidates request transport; it does not broaden publication eligibility.

## 2. Runtime/bootstrap architecture — highest remaining debt

Measured from the audited `index.html`:

- 62 ordered entries in `BODY_SCRIPTS`.
- 61 directly injected root-level runtime scripts.
- 1 manifest-driven domain bootstrap entry.
- 9 existing root compatibility-layer filenames matching the historical `*-fix.js`, `*-hardening.js`, `*-finalize.js` or `*-extension.js` pattern.
- 1 legacy `document.write` call used to replace the bootstrap document with the fetched core application.
- `MouldMaster_Core_App.html` remains a large monolithic legacy core document.

A big-bang rewrite would put proven learning, evidence, storage, PWA and desktop behavior at unnecessary risk. The safer migration is monotonic: move capability into domains, reduce root/global layers, then retire the document-rewrite bootstrap after callers have migrated.

### Cleanup implemented

New CI contract:

- `qa/architecture-debt-baseline.json`
- `qa_architecture_debt.py`

It allows debt to decrease but fails if the bootstrap or root compatibility stack grows. It also blocks new string-to-code execution and remote runtime-script expansion.

Current ceilings are 62 bootstrap scripts, 61 root runtime scripts and one `document.write` call. The existing compatibility-layer names are explicitly grandfathered; new ones are rejected and new product code belongs under `src/domains/<domain>/`.

## 3. Runtime security/CSP — strong boundary, one known migration debt

The active shell CSP remains same-origin constrained:

- `base-uri 'none'`
- `object-src 'none'`
- `frame-src 'none'`
- scripts are local/self; no remote runtime script origin is required
- `connect-src 'self'` is required by the current bootstrap because it fetches the same-origin core/runtime assets
- `unsafe-eval` is not permitted

`qa_architecture_debt.py` now rejects:

- CSP `unsafe-eval`
- external `connect-src` endpoints
- remote HTTP(S) runtime script tags in the shell/core
- `eval()` or `new Function()` in active runtime JavaScript/domain modules
- additional `document.write` usage

`'unsafe-inline'` remains in script/style policy because the legacy shell/core still contains inline code/styles. Removing it is a future migration objective, not something to fake by breaking the current application.

## 4. Materials/exact-grade programme — data sound, umbrella metadata was stale

### Finding

The exact-grade pipeline had already published four validated primary-source LOTTE grades, but `data/materials/staging/korea-pilot-v1.json` still described every target manufacturer as discovery-pending.

### Cleanup implemented

The umbrella Korean pilot manifest now records:

- four target manufacturers;
- LOTTE as the single validated/published pilot manufacturer;
- four published exact-grade IDs;
- LG Chem, KEP and KOLON ENP as discovery-pending.

The umbrella manifest still keeps every `gradeRecords` array empty. It points to `lotte-exact-grade-pilot-v1` instead of duplicating exact-grade claims. `qa_material_catalog.py` cross-checks the pointer, exact IDs, runtime publication and pending-state boundaries.

Current validated/published LOTTE pilot:

- NH-1033
- NH-1034R
- AE-3060 H
- XP-2140C

No missing glass-fibre percentage, lifecycle state, approval, material condition or processing value is inferred.

## 5. Learner data / engineering ownership — no new cleanup required

The post-remediation engineering store uses IndexedDB, retains exact `materialGradeId` links, enforces learner ownership and uses explicit legacy synchronization rather than browser-global `Storage.prototype` monkey-patching.

Legacy migration remains additive and non-destructive. This audit found no reason to collapse that boundary for code-size reduction.

## 6. Browser/PWA and desktop distribution — runtime boundary is correct

Current browser/PWA behavior uses a shared-origin service-worker lifecycle rather than unregistering or clearing installed-app state during normal browser use. Cross-browser regression coverage includes Chromium, Firefox and WebKit.

The frozen legacy Academy HTML and legacy EXE are excluded from current PWA caching and current Electron packaging/integrity resources.

### Recovery artifact placement

The old `MouldMasterAcademy.exe` still lives at repository root. That looks untidy, but moving it now would break the explicitly frozen recovery feed because `latest.json` still points `launcher_url` at the root path. `desktop/electron/LEGACY_MIGRATION.md` also requires a real Windows backup/import migration validation before the recovery launcher is retired.

Therefore this pass deliberately does **not** move or delete the legacy EXE. Runtime/distribution exclusion is already enforced; physical relocation is deferred until the recovery contract is retired or rewritten with a tested migration path.

The legacy Academy HTML remains frozen/source-only and excluded from current distributions. It should be relocated only as part of the same recovery-consumer audit, not as an isolated cosmetic move.

## 7. Release QA maintainability — manual duplication removed

### Finding

`MouldMaster Release QA` manually listed dozens of individual root JavaScript files for `node --check`. That duplicated the application bootstrap, missed the direction of travel toward domain modules, and required editing CI whenever files changed.

### Cleanup implemented

Release QA now discovers:

- root `*.js` files;
- `src/domains/**/*.js` files;
- Electron source/script `*.cjs` files

from the filesystem and syntax-checks them directly.

`qa_repo_governance.py` now asserts that this filesystem-driven contract and the architecture debt gate remain present, so the manual list cannot quietly return.

No new workflow was added for the architecture audit. The check is attached to the existing Release QA and Domain Foundation QA lanes to avoid increasing CI sprawl.

## 8. Workflow estate — strong coverage, still too broad to consolidate blindly

The repository has a large workflow estate spanning release, browser, desktop, evidence/data, research/benchmark and scheduled/operational checks. The audit confirms substantial duplication of responsibility at the workflow level, but the workflows also encode different data rights, evidence and release boundaries.

This pass therefore does not delete or merge workflow files without trigger/permission/artifact equivalence proof.

Recommended consolidation order:

1. label workflows conceptually as release-critical, product QA, evidence/data, or scheduled/operational;
2. identify identical setup/action sequences that can move to reusable workflows or scripts;
3. preserve the four release-critical required contexts exactly while native protection documentation references them;
4. consolidate only when permissions, triggers, artifacts and failure semantics are demonstrably equivalent.

The immediate brittle duplication inside Release QA was removed because its equivalence was straightforward and testable.

## 9. Native `main` protection — still an external administrator remainder

Repository-level compensating controls are active: the Main PR Provenance Guard checks exact merged-PR provenance and the four required pre-merge workflows, and can roll back an unverified direct `main` push.

This is not a claim that GitHub's native branch/ruleset protection is enabled. The reviewed helper `.github/scripts/apply-main-ruleset.sh` and `.github/MAIN_PROTECTION.md` remain the administrator path, and Issue #43 remains the external owner/admin action.

## Cleanup outcome

This deep-dive pass converts the most important remaining structural findings into monotonic controls rather than another patch layer:

- real post-merge provenance + Pages path proven green;
- all Pages GitHub-API release helpers converging on one `gh api` transport;
- root/bootstrap debt capped and grandfathered explicitly;
- remote script/string-to-code/CSP expansion blocked;
- Korean materials programme metadata reconciled to actual validated state;
- Release QA syntax enumeration made filesystem-driven;
- recovery artifacts left in place only where an explicit compatibility contract still depends on them.

## Next architecture reduction target

The next cleanup should **reduce**, not merely cap, the 61 root runtime scripts. Start with one coherent low-coupling domain cluster, migrate its public API and tests under `src/domains/`, remove the corresponding root injection(s), then lower the baseline ceiling in the same PR. Do not create replacement `*-fix.js` or `*-extension.js` layers to bridge the move.
