# MouldMaster governance status

Current governed web candidate: **`2026.10.08.1`**.

This page is generated from `data/governance-state-model-v1.json`. Do not hand-edit status words here; update the governed evidence/state contract and regenerate this file.

| Boundary | Current state |
| --- | --- |
| Technical automation | **pass** |
| Native main governance | **enforced** |
| Book publication authorization | **authorized** |
| Independent Book SME review | **hold** |
| Independent Academy SME review | **hold** |
| Physical iOS/iPadOS + Android validation | **hold** |
| Real NVDA + VoiceOver validation | **hold** |
| Signed/Store Windows distribution validation | **hold** |
| Real learner outcome evidence | **hold** |
| NZQA/provider/accreditation validation | **hold** |
| GitHub desktop-release immutability | **hold** |
| Production authority | **advisory-only** |

## Interpretation

`pass` describes software-controlled automation only. `pending-native-ruleset-apply` means repository policy is ready but the live GitHub main ruleset has not yet been verified against it, so release promotion remains blocked. `authorized` describes internal publication authorization only. `hold` on an external-validation row is a truthful blocked state awaiting genuine release-bound human/device/platform evidence; it is not a software-test failure. `advisory-only` means MouldMaster does not provide validated production-recipe or automatic machine-control authority.

The Book may therefore be publication-authorized while independent Book SME review remains on HOLD. Those states are intentionally different and must not be collapsed into a single 'validated' label.

## Book publication detail

- **Current learner-facing publication:** Source evidence reviewed — internal governed publication status **authorized** for **46/46** governed modules.
- **Reader architecture:** **20** reader chapters map all **46** governed modules exactly once.
- **Claim evidence disposition:** **116 supported**, **21 qualified scope boundaries**, **0 HOLD**, **0 conflicting**.
- **Independent human Book SME:** **hold**; current accepted review records: **0/46**.
- **Manifest workflow states:** 46 source-review. These fields are not the current publication authority; current publication status is derived from `data/book-publication-authorization-v1.json`.
- **Historical accuracy gate:** **technical-review-only**, **0** chapters automatically verified. Its lifecycle is explicitly `historical-prepublication-gate` and superseded for current publication status by `data/book-publication-authorization-v1.json`.

This distinction is fail-closed: publication authorization does not create independent SME approval, accreditation, learner outcome evidence, physical-device evidence or production authority.

## Assurance evidence layers

These layers are reported separately. Passing static/contract or automated browser QA does not convert the external human/device layer into a pass.

| Layer | State | Meaning |
| --- | --- | --- |
| Static / contract | **pass** | Repository-controlled static, schema, arithmetic and source-binding checks pass on the current candidate. Live GitHub native governance is reported separately and does not inherit this pass. |
| Behavioral / browser | **pass** | Automated browser/runtime behavior suites pass on the current candidate; browser automation is not physical-device or human-assistive-technology evidence. |
| External human / device | **hold** | Human SME, real device/assistive-technology, signed distribution, learner-outcome and provider/accreditation evidence remains release-bound HOLD until genuinely executed. |
