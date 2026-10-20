# MouldMaster governance status

Current governed web candidate: **`2026.10.20.2`**.

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

## Book current publication state

This section resolves the Book current learner-facing publication state from the governed authorization/evidence overlays. Historical manifest workflow fields and the pre-publication accuracy gate remain audit inputs; they do not override the current publication authorization.

| Signal | Current meaning |
| --- | --- |
| Governed modules | **46/46 publication-authorized** as **Source evidence reviewed** |
| Reader structure | **20 reader chapters** derived from **46 governed modules**; reader grouping adds no technical claim or SME approval. |
| Claim evidence | **116 supported · 21 qualified · 0 hold · 0 conflicting** |
| Manifest workflow metadata | **46 source-review**; this is evidence/workflow metadata, not the learner-facing publication status. |
| Historical accuracy gate | **technical-review-only** · lifecycle **historical-prepublication-gate** · superseded for current publication status by `data/book-publication-authorization-v1.json`. |
| Independent human SME review | **hold** · **0/46 governed modules approved** |

Publication authorization and independent validation are separate namespaces. The Book can be authorized as a source-evidence-reviewed reference while independent human SME, device, learner-outcome and provider/accreditation evidence remains on HOLD.

## Assurance evidence layers

These layers are reported separately. Passing static/contract or automated browser QA does not convert the external human/device layer into a pass.

| Layer | State | Meaning |
| --- | --- | --- |
| Static / contract | **pass** | Exact retained candidate verified for release 2026.10.20.2 source 6d14b9d738f0cf04f182cecad6491e1830fc449c, producer run 39407663327, artifact 12257897600, fingerprint sha256:a0c7d14eb405642c5ba60b9f1237d8e22affa4f6a5210b30b463432501ff745c. External human/device/provider evidence remains HOLD. |
| Behavioral / browser | **pass** | Exact-source browser and speech regression coverage passed for release 2026.10.20.2 source 6d14b9d738f0cf04f182cecad6491e1830fc449c; Read Aloud QA run 39407663456 passed 45 Chromium tests, Mobile Browser QA run 39407663413 passed Chromium, WebKit, cross-browser, and all five reliability shards. |
| External human / device | **hold** | Human SME, real device/assistive-technology, signed distribution, learner-outcome and provider/accreditation evidence remains release-bound HOLD until genuinely executed. |
