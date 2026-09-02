# Contextual research evidence engine integration

Load order for public runtime:

1. existing canonical/reference/evidence data modules;
2. `research-evidence-engine.js`;
3. `research-evidence-adapter.js`;
4. `research-evidence-workspace.js`;
5. `research-evidence-microlearning.js`;
6. `research-utilisation-analytics.js`;
7. `research-gap-feedback.js`;
8. `research-claim-freshness.js`;
9. `research-evidence-ui.js`;
10. `research-evidence-runtime-health.js`.

The UI is deliberately additive: it enriches measured-evidence panels, process-data labs and lesson bodies without replacing existing source cards or diagnostic logic.

The assessment boundary remains unchanged: exact evidence capable of supporting an assessment answer must only appear after grading under the existing assessment hardening rules.
