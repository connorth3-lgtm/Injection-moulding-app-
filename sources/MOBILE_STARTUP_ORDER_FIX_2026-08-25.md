# Mobile evidence startup-order fix — 25 August 2026

## Symptom
On Android/Chrome, MouldMaster could start with an evidence summary of 149/157 even though the repository contained the complete 157-question bank.

## Root cause
`training-upgrade.js` adds eight guided scenarios from a `DOMContentLoaded` listener. `assessment-evidence-approval.js` previously snapshotted `MM_DATA.scenarios` while the document was still parsing, before that listener ran. The evidence layer therefore saw 32 scenarios rather than 40 and reported 149 total keyed questions.

## Fix
Evidence approval version 2026.08.25.4 now schedules its snapshot after `DOMContentLoaded` and one zero-delay task, so earlier content-upgrade listeners finish first. The browser runtime token and installed-PWA cache revision were advanced so phones request the corrected approval file.

## Regression control
`qa_runtime_hardening.py` and `qa_assessment_evidence.py` now assert the startup-order contract explicitly. The release gate still requires 157/157 approved keyed questions after initialization.

No learning content, answer keys, source mappings, learner progress storage, notes, scores or certificates were changed by this fix.
