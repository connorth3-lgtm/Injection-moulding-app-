# Research evidence engine

Runtime entry point: `window.MM_RESEARCH_EVIDENCE`.

Primary APIs:

- `retrieve(context, limit)` — rank promoted mechanisms using text and structured context;
- `applicability(mechanism, context)` — evaluate context overlap separately from evidence quality;
- `verificationPlan(context, mechanismId)` — produce a bounded test/measurement plan;
- `sourceCoverage()` — expose runtime evidence totals for health checks.

Recommended context fields: `text`, `materials`, `process`, `tooling`, `sensors`, `signals`, `outcomes`.
