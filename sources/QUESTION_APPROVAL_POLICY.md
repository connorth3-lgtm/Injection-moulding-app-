# MouldMaster question evidence approval policy

Reviewed: 25 August 2026

Every keyed learner question must have a stable identity, one defensible answer, a rationale, at least one direct HTTPS evidence source, a reviewer, a review date, an approval status and a content fingerprint or an approval fingerprint tied to an immutable reviewed source file.

The approval scope is internal educational content approval. It does not imply external accreditation or independent third-party SME endorsement.

Coverage required by release QA:

- 30 technical exam questions
- 27 UK/US/NZ regional safety/compliance exam questions
- 40 scenario drills
- 36 questions across the 9 Diagnostic Learning Labs
- 24 questions across the 6 Material Behaviour Labs
- 157 keyed questions in total

Regional safety/compliance questions must retain a direct official regulator, legislation or standards source. Technical questions may use a question-specific source or a mapped authoritative/peer-reviewed source that supports the mechanism or method being assessed. Material Behaviour Lab questions use explicit source IDs selected for the actual resin/mechanism being taught. Research findings support mechanisms and methods; they are not universal production recipes.

Mapped evidence must be topic-appropriate. A generic fallback source is not permitted: if the evidence resolver cannot identify a source that supports the actual question/scenario/lab topic, the record is blocked and release QA must fail with the affected stable ID. Scenario evidence QA must reconstruct the real live scenario text rather than placeholders. High-value mapped sources are also enrolled in source/DOI freshness tracking where applicable.

Approval is invalidated when any reviewed content-bearing source file changes. A changed question, answer, rationale, scenario, Diagnostic Learning Lab or Material Behaviour Lab source file therefore requires a fresh evidence review before release QA can pass.