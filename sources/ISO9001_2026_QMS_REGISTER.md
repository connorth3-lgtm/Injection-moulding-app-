# ISO 9001:2026 QMS support register

Checked: 2026-09-18

## Current basis

- **ISO 9001:2026 — Quality management systems — Requirements** is the current published requirements edition. ISO published the sixth edition on 2026-09-16. Official record: https://www.iso.org/standard/9001
- **ISO 9000:2026 — Quality management — Fundamentals and vocabulary** is the current published vocabulary/fundamentals edition. Official record: https://www.iso.org/standard/9000
- ISO 9001:2015 and ISO 9001:2015/Amd 1:2024 are retained only as superseded transition history.

## MouldMaster support boundary

MouldMaster supports learning and evidence practices relevant to a quality-management system. It does **not** establish organisational conformity, ISO certification, accreditation, auditor approval, production-release authority, employer competence authorisation, calibration accreditation or validated manufacturing recipes.

The governed QMS contract paraphrases clause themes and does not reproduce ISO requirement text. A licensed copy of ISO 9001:2026 remains controlling for the normative requirements.

## 2026 revision handling

The learner-facing support layer reflects only public, high-level revision themes published by ISO: clearer wording, stronger leadership/quality-culture emphasis, clearer treatment of risks and opportunities, and continued process/continual-improvement focus. It does not reconstruct or quote protected clause text.

## Repository controls

- canonical contract: `data/quality-management-iso9001-v1.json`
- runtime mirror: `src/domains/quality/data/quality-management-iso9001-v1.json`
- read-only surface: `src/domains/governance/standards-readiness.js`
- QA: `qa_governed_readiness_layers.py`

Any future ISO edition/amendment requires a fresh source-status check and deliberate governed update.


## Marlex packaging observation

A user-supplied Marlex polyethylene bag shows a **SAI Global Certified System** mark and wording that the product was manufactured in a plant whose quality-management system was registered to ISO 9001.

Governed interpretation:

- this is packaging evidence about the manufacturing organisation/plant QMS;
- it is **not** ISO 9001 certification of the polyethylene resin, grade properties, processing window, lot acceptance or moulding suitability;
- the exact Marlex grade is obscured in the image and remains **unresolved**;
- packaging alone does not establish that the certificate is current or that its scope covers the exact current site/product;
- SAI Global Assurance was acquired by Intertek in 2021, so historic SAI Global branding should be treated as historical certification-mark context and current validity should be verified with current certificate/scope evidence when required.

Primary certification-mark guidance: Intertek F205, *Use of Certificates and Certification and Accreditation Marks* (2023). Current SAI Global/Intertek corporate context: Intertek acquisition completion announcement (7 September 2021).
