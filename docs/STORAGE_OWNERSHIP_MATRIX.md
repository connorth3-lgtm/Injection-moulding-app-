# Durable storage ownership matrix

This is the architectural ownership contract for durable MouldMaster state. Feature code must not create a second live authority for an existing data class.

| Data class | Owner scope | Canonical persistence | Backup/export | Reset/migration contract |
| --- | --- | --- | --- | --- |
| Learner assessment/progress state | learner | learner-scoped browser storage through the scoped runtime APIs, including generated-form membership/exposure history | core progress plus spaced-review, practical-sign-off, measured-assessment, process-diagnostics, Diagnostic Learning Lab and Material Behaviour Lab progress are backed up; assessment analytics/opening/membership histories and Learning Insights event logs are derived local state and are not backup-restored | reset only the active learner, including governed training extras and derived assessment membership/exposure history; legacy keys are migration input, not a second authority |
| Engineering cases + structured case evidence | learner | IndexedDB `mouldmaster-engineering-v2`, schema/DB version 3; stores `cases`, `caseLinks`, `caseEvidence`, `migrations` | explicit schema-4 case export/import; learner backup intentionally excludes workplace engineering evidence | owner token required; import validates before one transaction, restores as a new case rather than overwriting, evidence is append-only with revision/void audit records; legacy localStorage is import-only and non-destructive |
| Process/connected machine observations | device/site dataset | IndexedDB/data-domain stores | explicit dataset export; do not imply learner ownership | preserve source/site/device provenance; reset is dataset-specific |
| PWA runtime cache | application release | Cache Storage, release-version named | not learner data and never included as learner backup | atomically replaced only after complete install; no destructive state reset |
| Desktop application bytes | installed application | integrity-hashed packaged resources | release artifacts/SBOM, not learner backup | immutable serving allowlist; stable loopback origin preserves browser-origin state |

Any new durable store must document owner scope, persistence technology, backup/export behavior, reset semantics, and migration behavior before release.
