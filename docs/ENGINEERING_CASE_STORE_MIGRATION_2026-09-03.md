# Engineering case store migration — 2026-09-03

## Decision

Mould Master troubleshooting cases use `mouldmaster-engineering-v2` IndexedDB as the single live persistence authority. The previous learner-scoped `mm_mould_master_cases_v1::<token>` localStorage records are migration input only.

## Migration behaviour

- Import is learner-scoped and non-destructive.
- A learner's legacy snapshot is considered once; a completed migration is not replayed on later loads.
- Existing canonical cases with the same ID are preserved when they are at least as recent as the legacy record.
- Legacy import never deletes canonical cases.
- Cross-learner case-ID conflicts are not overwritten.
- The legacy localStorage snapshot is not rewritten or deleted by the new runtime, so rollback/recovery remains possible while the migration is being proven.

## Runtime behaviour

- Workspace create, edit and delete operations await `MM_ENGINEERING_STORE` IndexedDB writes.
- Workspace hydration is keyed to the active learner token and clears the in-memory case cache when the active learner changes.
- Case reads, writes, deletes and links validate learner ownership.
- Exact material cases seed `materialGradeId` during canonical case creation and retain a learner-scoped material link.
- The temporary `store-bridge.js` runtime layer has been retired; the engineering store bootstraps its own one-time migration and the workspace hydrates when domains are ready.

## Regression evidence

`qa/engineering-case-store.spec.js` verifies:

1. a legacy case imports into IndexedDB;
2. editing the case does not rewrite localStorage;
3. the canonical edit wins after reload;
4. deleting the case does not allow the stale legacy snapshot to resurrect it;
5. switching learner profiles clears the workspace cache and enforces owner-scoped reads;
6. a LOTTE NH-1033-started case retains `materialGradeId` and its material link after further editing.

The test is part of the required Chromium Mobile Browser QA lane, and static workspace QA requires that coverage to remain wired into Playwright and CI.
