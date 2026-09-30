# NZQA external validation — 2026.09.30.8

Release `2026.09.30.8` has a repository-controlled NZQA readiness layer, but external provider/NZQA validation remains **HOLD**.

- retained learner-facing source: `359730b042302a4a8c338b1f62f65b39ea1f0027`
- runtime fingerprint: `sha256:e50a7685f649322ec518385f8f9d774dbb7b4c13f083f9a3c08403904dfa24a5`
- readiness contract: `data/nzqa-education-readiness-v1.json`
- provider evidence templates: `data/nzqa-provider-evidence-templates-v1.json`
- external closeout tracker: #379

The following gates require genuine external evidence:

| Gate | Status | Required evidence |
| --- | --- | --- |
| G1 provider | **HOLD** | Eligible recognised provider and accountable programme/application owner. |
| G2 need | **HOLD** | Genuine employer, learner, provider and industry need/support evidence. |
| G3 design | **HOLD** | Provider-approved title, outcomes, level/credits/workload, entry/RPL, assessment and completion rules. |
| G4 assessment | **HOLD** | Approved summative instruments, authorised assessors, internal moderation and evidence-retention controls. |
| G5 consent | **HOLD** | Applicable consent-to-assess and CMR requirements confirmed with the relevant provider/standard-setting/NZQA authorities. |
| G6 national moderation | **HOLD** | Applicable national external moderation participation/acceptance. |
| G7 workplace | **HOLD** | Genuine authorised workplace practical evidence where required. |
| G8 review | **HOLD** | Provider-controlled review/change governance and any required NZQA change approval. |

MouldMaster completion does not award NZQA credits, establish workplace competence, grant consent to assess, make the repository an accredited provider, or prove national moderation acceptance. Automated QA may verify this contract and the readiness mapping, but it must never manufacture provider/NZQA evidence.
