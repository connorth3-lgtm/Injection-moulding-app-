# PR #640 + PR #641 integration record — status updated 20 October 2026

This integration preserves both original source histories through a two-parent integration commit:
- PR #641 Book/Listen branch: `012bc6af61afaf7af75b1c499da0e3635a84cc3c`
- PR #640 Android Learn/Practice branch: `a56094315a8d43cfe3b5083e1ff6367b89f67bfb`

## Source reconciliation

1. The complete PR #641 tree was used as the initial release/Book/Listen base.
2. All 26 files unique to PR #640 were carried forward, including core Learn/Practice source, QA, and external evidence packets.
3. The two shared learner-presentation files use the PR #640 Home/Learn/Practice presentation; the initial integration rebased the release/CSS reference to `2026.10.18.1`.
4. PR #641 was retained for the other 14 shared files to keep the initial web/cache release and Book audio/CSP runtime coherent.
5. The governed web candidate later advanced to release `2026.10.20.2`; current identity is recorded in `data/release-external-validation-v1.json` and `qa/EXTERNAL_VALIDATION_2026.10.20.2.md`.
6. Superseded `2026.10.17.1` packets remain historical and are not acceptance evidence for the current candidate.

## Current candidate and visual record

The retained runtime candidate is source `e841e470e651c9f9c8766f1941554e60d554523f`, producer run [39389190646](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39389190646), artifact `12248398761`, digest `sha256:9f5db7d8b3e898ff834b828b1590098944101c7f5734c0e215c73c1786e3a1b8`, fingerprint `sha256:abbe5ca24fcc7e2203436c75df21550264bd71d48fe983416eb6b6f87489bd4f`. Owner approval of the presented integrated-app and Book Read Aloud screenshots is recorded at visual source `83401a4bb217baa5c1a4acfa9181e7725e8098ac`; this is visual-design approval only.

## Remaining external HOLDs

All seven release-specific independent reviews remain **HOLD**: physical iOS/iPadOS and Android install/update/offline/speech; human NVDA/VoiceOver; signed Windows distribution; independent Book SME review of 46 modules; curriculum SME review of 120 lessons; real-learner outcome evidence; and NZQA/provider G1–G8. Production-site and machine-control authority remain advisory-only.

## Merge and release boundary

Protected-main policy requires the repository owner’s deliberate squash-merge decision after all six required exact-head checks succeed. External evidence remains a separate HOLD and must stay represented as HOLD. Merging this integration does not authorize production release, tester invitations, accreditation, efficacy or production claims. The main Pages workflow keeps the production root fail-closed and stages only a release-hold/non-production preview candidate while exact-runtime physical-device authorization is absent.
