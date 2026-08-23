# MouldMaster Credential Governance

Status: design specification. Current certificates remain local learning records until an approved provider/accreditor and secure issuer system are in place.

## Goal
Move from a printable local certificate to a verifiable credential architecture without making premature accreditation claims.

## Credential record fields
A production credential registry should store:
- `credential_id` — random, non-sequential public identifier
- `learner_id` — private/internal identifier, not exposed unnecessarily
- learner display/legal name as required by provider policy
- programme/credential title
- programme version
- question-bank version
- jurisdiction/standards mode
- completion date/time
- knowledge score
- safety-critical pass result
- practical evidence status
- assessor/provider identity where applicable
- issue date
- status: active / revoked / superseded
- revocation reason where policy permits disclosure
- issuer legal name
- accreditor/approval identifiers only after real approval exists

## Public verification response
A public verification page should reveal only what is needed to verify authenticity, for example:
- credential ID
- holder name (or privacy-preserving display depending provider policy)
- credential title
- issue/completion date
- issuer
- status
- programme/version
- accreditation/approval claim only when officially granted

Do not expose learner email, internal notes, full assessment answers or workplace comments.

## Security design
For recognised credentials, do not trust local browser storage as the source of truth.

Recommended architecture:
1. learner completes controlled assessment
2. authorised backend validates eligibility and assessment evidence
3. issuer creates a server-side credential record
4. random credential ID is generated
5. certificate displays a QR code to the HTTPS verification page
6. verification endpoint reads server-side signed/controlled record
7. revocation/supersession is supported
8. audit log records issuance/status changes

## Interim local certificate
Until the registry exists, the app may continue to provide a printable certificate with wording such as:

> MouldMaster Academy Certificate of Completion — Local learning record. Not an externally accredited qualification or statutory authorisation.

Do not add a QR code that implies external verification if the source of truth is only learner-editable local storage.

## Credential ID format
Recommended opaque ID example:
`MM-7K4P-9X2M-Q6TR`

Generate with cryptographically secure randomness on the issuer backend. Do not derive it from learner name, score, email or date.

## QR code
Target format after registry deployment:
`https://<approved-domain>/verify/<credential_id>`

The verification page must show the current credential status, not a static PDF copy.

## Assessment evidence linkage
The issuer should retain a private audit link from each credential to:
- assessment attempt ID
- item-bank version
- result
- critical-safety result
- identity-verification event
- practical-assessment record where required
- moderation/review version

The public verifier does not need to expose these details.

## Privacy & retention
Before launch, the recognised provider must approve:
- privacy notice
- lawful basis/consent as applicable
- access/correction process
- retention period
- security roles
- breach process
- credential-publication consent or alternative privacy mode

## Accreditation claim gate
Credential templates must support explicit statuses:
- `NON_ACCREDITED_COMPLETION`
- `PROVIDER_RECOGNISED`
- `NZQA_APPROVED_MICROCREDENTIAL` (only after approval)
- `IACET_CEU` (only after Accredited Provider status and compliant activity)

Application code must default to `NON_ACCREDITED_COMPLETION` unless the issuer configuration is controlled by the approved provider/backend.
