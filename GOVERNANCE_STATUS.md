# MouldMaster governance status

Current governed web candidate: **`2026.10.16.1`**.

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
| Static / contract | **pass** | PASS: release 2026.10.15.3 source d827fb7d9d0e73486b49fc27f29a5ccdff092f36 completed successful exact-source producer run 38791607720, retained artifact 11999364412, digest sha256:9a6367509cc93cf83924de4069570754d8fc510771dc82ce6d39bbe25cfef948, expiry 2027-01-13T19:09:45Z, and measured public-runtime fingerprint sha256:80ed59be26c4c6e7906ca4abeb55b5df1df0cbaa94390749427ff6cc991d6d3f. Software provenance only; seven independent external human/device/provider streams HOLD. |
| Behavioral / browser | **pass** | PASS: release 2026.10.15.3 source d827fb7d9d0e73486b49fc27f29a5ccdff092f36 completed exact-source Mobile Browser QA 38791607812 (approved strict 52-screenshot 12px visual, substantive Chromium/WebKit, cross-browser, reachability and five 100-run reliability shards), plus Question Quality 38791607780. No physical-device, human SME or provider approval. |
| External human / device | **hold** | Human SME, real device/assistive-technology, signed distribution, learner-outcome and provider/accreditation evidence remains release-bound HOLD until genuinely executed. |
