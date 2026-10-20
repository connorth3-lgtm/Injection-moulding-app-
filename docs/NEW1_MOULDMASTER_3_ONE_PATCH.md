# New1 — MouldMaster 3.0 Digital Factory (single governed patch)

This patch implements the **first end-to-end academy assignment** on the existing six-case Virtual Apprenticeship. It does **not** implement the proposed 250+ lessons, 1,000 case library, 1,500 assessed items, validated simulation physics or hosted trainer/cohort infrastructure.

## One connected learning journey
- **Factory:** use the existing VA-02 four-cavity case, with three clearly synthetic cavity-mass windows and a link to the existing Spatial Twin and relative process simulator.
- **Interactive Book:** open four real governed modules: multi-cavity, cavity-pressure, feed-system and diagnostic-method. The original Book's chapter/evidence/SME status remains authoritative.
- **Tutor:** score the four existing evidence-reasoning decisions and recommend Book reading tied to *missed* reasoning steps; a high score is not a workplace competence certificate.
- **Apprenticeship:** expose the existing six authored investigations as one operator → setter → technician → troubleshooter → process engineer formative track.
- **Private progress:** retain results through the existing learner-scoped Runtime V2 storage; expose a read-only competencyRecord API for future trainer-supervised extensions. No new cloud storage, real production uploads or cross-learner data sharing.
- **Visible UI fixes:** five equal mobile tabs at the mid-width tablet breakpoint, only one empty-state mission prompt, and quiet recording of legacy badges without automatic toast/confetti. The frozen legacy Windows recovery payload is unchanged; generated-runtime transformations remain reproducible.

## Safety, quality and scope
- The cavity mass values are **invented** educational observations, not measured evidence, tolerances, recipes or validated machine physics.
- The Book link is a reading aid, not source/evidence promotion. Book SME and curriculum SME remain on **HOLD**.
- The scored four-step exercise is *formative*; it does not award accredited, safety or professional competence.
- The training role labels describe difficulty rather than job authorisation or trainee sign-off.
- There is **no** remote trainer console, multiuser classroom database, real-machine control, site deployment, production-data processing or outcome-validation claim.

## Mandatory release gate before merge
This changes governed learner runtime bytes. The patch must advance version.json's web release, PWA cache revision, supporting labels, current external-validation HOLD packets and **new exact-runtime candidate**. Its actual browser candidate must be built, fingerprinted and retained by the normal GitHub workflow. **Never reuse the old release's source SHA, fingerprint or retained artifact** to attest the new runtime. Until the new candidate/packets and all six protected-main CI contexts are proven, the PR must remain **draft/unmerged**. The production root stays release-held and the hosted non-production /preview/ is not updated by pushing a Git branch.

Real iOS/iPadOS/Android checks, NVDA/VoiceOver, Windows signing, Book/curriculum SME, learner outcomes and NZQA/provider approvals remain independently **HOLD**. Production and accredited use are not authorised.

## Verification checklist
- Run `node qa_virtual_apprenticeship.cjs`, `node qa_mission_control.cjs`, `python3 tools/externalize_core_scripts.py --check`, `python3 tools/sync_web_release.py --check` and the full required release workflows on the **exact PR head**.
- Run Chromium and WebKit at 320, 375, 701, 810, 900, 1024, 1100 and 1440 pixels; check five bottom tabs on the narrow/tablet layout, Book links, 200% zoom, keyboard focus, safe-area clearance and reduced motion.
- Check A → B → A learner switching, score reset/review idempotency, and offline Book opening. Missing Book content should never silently mark a case complete.
- Keep the current #517/#519 deeper compatibility/duplicate source debt tracked separately, without claiming it vanished in this patch.

Related: #521 (academy scope), #520 (confirmed visual issues), #512 (non-production tester rollout hold).
