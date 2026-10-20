# NZQA external-response triage — 2026

Status: **governance aid only**. This document describes how to classify external replies without promoting them into approval claims.

## Core rule

External evidence closes only the question it actually answers. A reply, meeting, introduction, statement of support or review comment must not be promoted into provider ownership, NZQA approval, consent to assess, moderation acceptance, industry endorsement, learner competence, credits or qualification status unless the external evidence explicitly establishes that fact and the responsible authority is the correct one.

## Evidence classes

### E0 — contact attempt
Examples: email sent, web form submitted, voicemail left.

Effect: update engagement log only. No readiness gate changes.

### E1 — routing / factual clarification
Examples: MAEISB confirms correct CMR route; Competenz confirms qualification version; Plastics NZ identifies the correct industry contact.

Effect: may resolve a factual ambiguity or update the source register. Does not establish partnership or approval.

### E2 — review feedback
Examples: provider, employer or industry reviewer comments on learning outcomes, curriculum gaps, practical evidence design or learner support.

Effect: may contribute to stakeholder-need or design evidence when attribution and permission are retained. Does not by itself establish formal support or provider ownership.

### E3 — documented support / willingness to participate
Examples: written willingness to review, pilot, introduce employers or explore provider ownership.

Effect: may support stakeholder-engagement gates, but the exact scope must be recorded. Do not call it endorsement unless the organisation explicitly authorises that wording.

### E4 — formal provider or standards-system evidence
Examples: eligible provider formally agrees to own development; consent-to-assess status confirmed; approved assessment/moderation arrangements documented; formal pre-moderation result retained.

Effect: only the matching governed gate may change, after the evidence is retained and independently checked against current NZQA/ISB requirements.

### E5 — authority decision
Examples: NZQA approval/accreditation decision, formal consent to assess, recognised listing or other decision from the competent authority.

Effect: update only the exact status granted, effective date, scope and conditions. Never infer broader certification or approval.

## Reply-processing checklist

For every external reply:

1. retain the original message or an immutable reference;
2. record sender/organisation/role only where supplied or public;
3. record date and channel;
4. distinguish statement of fact from opinion/recommendation;
5. identify which question/gate the reply actually addresses;
6. record any conditions, expiry, transition date or scope limitation;
7. record whether the organisation permits its name or words to be quoted publicly;
8. do not copy confidential attachments or personal data into the public repository;
9. update sources/readiness files only after checking the evidence against current official NZQA/ISB material where relevant;
10. preserve HOLD for every unrelated gate.

## High-risk phrases requiring explicit evidence

Do not use these unless directly authorised by the competent authority and scoped correctly:

- NZQA approved
- NZQA accredited
- consented to assess
- nationally moderated / moderation approved
- awards NZQA credits
- qualification equivalent
- endorsed by MAEISB
- endorsed by Competenz
- endorsed by Plastics New Zealand
- approved provider
- proves workplace competence
- authorised machine operator

## Repository update rule

External evidence should normally produce a small evidence-only commit that records:

- evidence identifier;
- date;
- source/organisation;
- classification E0–E5;
- question/gate affected;
- exact conclusion supported;
- conclusions explicitly **not** supported;
- any next action.

Do not change learner-facing release identity merely because external correspondence was received. A release bump is required only when governed learner-facing runtime/content changes under the repository's existing release rules.
