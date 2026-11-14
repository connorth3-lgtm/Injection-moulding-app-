# MouldMaster governance status

Current governed web candidate: **`2026.11.14.3`**.

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
| Reader structure | **21 reader chapters** derived from **46 governed modules**; reader grouping adds no technical claim or SME approval. |
| Claim evidence | **116 supported · 21 qualified · 0 hold · 0 conflicting** |
| Manifest workflow metadata | **46 source-review**; this is evidence/workflow metadata, not the learner-facing publication status. |
| Historical accuracy gate | **technical-review-only** · lifecycle **historical-prepublication-gate** · superseded for current publication status by `data/book-publication-authorization-v1.json`. |
| Independent human SME review | **hold** · **0/46 governed modules approved** |

Publication authorization and independent validation are separate namespaces. The Book can be authorized as a source-evidence-reviewed reference while independent human SME, device, learner-outcome and provider/accreditation evidence remains on HOLD.

## Assurance evidence layers

These layers are reported separately. Passing static/contract or automated browser QA does not convert the external human/device layer into a pass.

| Layer | State | Meaning |
| --- | --- | --- |
| Static / contract | **pass** | PASS — software-only: release 2026.11.14.3 source 242f490ef2b9fc97dbd3641e98a760b53a7d5e65 run 43550875834 artifact 14096005944 fingerprint sha256:99e603a595f642cef824cf8b22e6eef2e74f636930e86821e05a1cac7c1c1336; artifact digest sha256:a3482b93e12d73e9134b8ac63150bf2f7a3588d9970b83307ab076e5436ee863, expiry 2027-02-12T03:17:41Z. No human, device, provider or production approval is implied. |
| Behavioral / browser | **pass** | PASS — software-only: release 2026.11.14.3 source 242f490ef2b9fc97dbd3641e98a760b53a7d5e65; Mobile Browser QA run 43550875958 and Question Quality 50-Pass run 43550875895 passed on this exact source. External human/device validation remains HOLD. |
| External human / device | **hold** | All seven independent human, device, Windows distribution, SME, learner-outcome and provider/NZQA evidence streams remain HOLD for release 2026.11.14.3. |
