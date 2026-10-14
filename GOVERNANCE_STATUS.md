# MouldMaster governance status

Current governed web candidate: **`2026.10.15.1`**.

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
| Static / contract | **pass** | PASS: 2026.10.15.1 exact source 397e0a024eb88f9636a8b161155c5dce6af6316b retained successful producer 38616968698, artifact 11920452430, runtime fingerprint sha256:ca0603729d78845b2551e15be74351abc75456932f9ac20b8394e730a81d2022 and all 166 public asset lengths/SHA256s verified. No real-world human/device/provider authorizations implied. |
| Behavioral / browser | **pass** | PASS: 2026.10.15.1 source 397e0a024eb88f9636a8b161155c5dce6af6316b succeeded Chromium substantive, strict 52-capture 12px visual, WebKit, cross-browser, five 100-run reliability shards, Read Aloud QA and Question Quality 50-Pass. Seven independent external HOLDs remain. |
| External human / device | **hold** | Human SME, real device/assistive-technology, signed distribution, learner-outcome and provider/accreditation evidence remains release-bound HOLD until genuinely executed. |
