# Real-site measured-evidence feedback

Use `data/real-site-pilot-feedback-template.csv` only after a site-authorised diagnostic evaluation. This file is a feedback contract, not evidence that a pilot has occurred.

## What to record

Record one row per reviewed scenario. Use an anonymous session alias and broad user role only. Score whether the measured-evidence cards were relevant, whether irrelevant/noisy cards appeared, whether **Why relevant** made the selection understandable, and whether the direct-versus-supporting evidence boundary was clear. Record whether the evidence helped or changed the decision, whether the operator overrode the app, and whether any wording appeared unsafe or overconfident.

`evidence_relevance_rating_1_5` uses 1 = not relevant and 5 = highly relevant. `evidence_noise_rating_1_5` uses 1 = no distracting evidence and 5 = severe irrelevant/noisy evidence. Boolean fields should use `yes` or `no`; use `unknown` only when the reviewer genuinely cannot determine the answer.

## Privacy boundary

Do not enter names, email addresses, customer names, company names, machine serial numbers, mould/tool identifiers, material lot numbers, order numbers, raw process values, raw timestamps, free-form customer text, or proprietary setpoints. `notes_redacted` must contain only de-identified observations needed to improve the evidence workflow.

## Completion boundary

A passing repository QA confirms only that the feedback instrument is safe and structurally usable. It does **not** create, simulate, infer, or claim real-site feedback. A real pilot remains incomplete until authorised human reviewers use the application with site-approved prepared data and return actual observations under the site's governance.
