# NZQA external validation — 2026.10.03.1

Release `2026.10.03.1` has a repository-controlled NZQA readiness layer, but external provider/NZQA validation remains **HOLD**.

- retained learner-facing source: `68ecd9eac901b4ff8bb775c67489f72474e0e24b`
- runtime fingerprint: `sha256:6eb6a125c44890de718b4c7be9a33ecba95a9fb7f160b2be2713cefc703eba24`
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