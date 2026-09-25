# Durable storage ownership matrix

This is the architectural ownership contract for durable MouldMaster state. Feature code must not create a second live authority for an existing data class.

| Data class | Owner scope | Canonical persistence | Backup/export | Reset/migration contract |
| --- | --- | --- | --- | --- |
| Learner assessment/progress state | learner | learner-scoped browser storage through the scoped runtime APIs | learner backup only | reset only the active learner; legacy keys are migration input, not a second authority |
| Engineering cases | learner | IndexedDB `mouldmasterProDB` / engineering-store v2 | learner-owned case export through governed backup paths | owner token required; legacy localStorage is import-only and non-destructive |
| Process/connected machine observations | device/site dataset | IndexedDB/data-domain stores | explicit dataset export; do not imply learner ownership | preserve source/site/device provenance; reset is dataset-specific |
| PWA runtime cache | application release | Cache Storage, release-version named | not learner data and never included as learner backup | atomically replaced only after complete install; no destructive state reset |
| Desktop application bytes | installed application | integrity-hashed packaged resources | release artifacts/SBOM, not learner backup | immutable serving allowlist; stable loopback origin preserves browser-origin state |

Any new durable store must document owner scope, persistence technology, backup/export behavior, reset semantics, and migration behavior before release.
