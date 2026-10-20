# Real learner problem priority

MouldMaster should fix observed learner harm and blocked learning journeys before speculative feature expansion. Synthetic QA, design preference and roadmap ideas do not count as real learner evidence by themselves.

## Priority order

1. **Safety or technical correctness — P0.** Potentially incorrect safety guidance, technically wrong learner-facing content, corrupted progress/records, or a defect that could cause a learner to rely on unsafe or materially incorrect advice. Stop relying on the affected item, reproduce it, verify against authoritative evidence where relevant, and fix before lower-priority work.
2. **Blocked learner journey — P1.** App load/crash failures, update loops, offline/PWA failures, inaccessible controls, lost progress, broken assessment submission, or another defect that prevents a learner completing the intended learning task.
3. **Repeated learner friction — P2.** Repeated confusion, ambiguous assessment wording, navigation problems, readability/accessibility friction, or diagnostic guidance that learners consistently misinterpret despite the underlying function remaining available.
4. **Feature request — P3.** New content, convenience improvements and speculative enhancements that are not correcting an observed learner problem.

A single credible P0 or severe P1 report is enough to investigate immediately. P2 changes should normally be supported by repeat reports, learner-observation evidence, or a clear reproducible interaction problem so wording is not churned from preference alone.

## Evidence required for a learner-problem fix

A learner-facing corrective PR should link the real report/observation when one can be retained safely, state the reproduction condition, identify the learner impact, and record the post-fix verification. Do not describe a change as learner-validated merely because repository QA passed.

Production health diagnostics are supporting evidence only. They can establish crashes, failed resources, update/deployment coherence and environment context; they do not prove that content was pedagogically effective or that a technical proposition was correct.

## Privacy and safety boundary

Do not ask learners to publish names, email addresses, progress backups, notes, assessment answers, analytics exports, raw process-data files, customer/site identifiers or other personal/confidential information in a public issue. Use the app's **safe diagnostics** snapshot only when useful. It intentionally contains coarse environment data, public release/deployment identifiers and bounded technical signal categories rather than learner content.

Potential safety or technical-content concerns remain fail-closed: learners should stop relying on the disputed item until it is reviewed against current authoritative evidence and the exact machine/material/site context where applicable.
