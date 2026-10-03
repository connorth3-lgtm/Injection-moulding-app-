# NZQA external validation — 2026.10.04.1

Release `2026.10.04.1` has a repository-controlled NZQA readiness layer, but external provider/NZQA validation remains **HOLD**.

- retained learner-facing source: `dedf5fd0c03b4580fbff5442cd5307d473459d50`
- runtime fingerprint: `sha256:62cdf25d79db3edbcf792ae5032205d509c7c8421189a28672d6d1c471d06df2`
- readiness contract: `data/nzqa-education-readiness-v1.json`
- provider evidence templates: `data/nzqa-provider-evidence-templates-v1.json`
- external closeout tracker: #379
- candidate authority: retained exact-head artifact from `Pre-merge Public Candidate` run `37155328537`; mutable `preview` is non-authoritative

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