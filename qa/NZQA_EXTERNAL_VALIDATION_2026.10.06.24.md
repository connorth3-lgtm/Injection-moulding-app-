# NZQA external validation — 2026.10.06.24

Release `2026.10.06.24` has a repository-controlled NZQA readiness layer, but external provider/NZQA validation remains **HOLD**.

- retained learner-facing source: `be4fb81c8c8a0bd9d4561cbf8693864edc2863a9`
- runtime fingerprint: `sha256:58552f3a79b11f1022197980219883ef2de7671beb4bebe01a12fdd1ace8fb46`
- readiness contract: `data/nzqa-education-readiness-v1.json`
- provider evidence templates: `data/nzqa-provider-evidence-templates-v1.json`
- external closeout tracker: #379
- candidate authority: retained exact-head artifact from `Pre-merge Public Candidate` run `37510980065`; mutable `preview` is non-authoritative

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

The Book’s 20 reader-facing chapters remain a structural presentation of the same 46 governed modules used by the readiness mapping; consolidation does not create NZQA approval, credits, provider status or competence evidence.
