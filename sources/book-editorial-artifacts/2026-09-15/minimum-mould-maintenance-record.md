# Minimum mould maintenance record for future diagnosis

Status: Book-ready record-template specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

A maintenance note such as “cleaned mould” or “replaced bush” is rarely enough for later diagnosis. The Book should teach a minimum evidence record that allows engineers to link asset exposure, observed condition, intervention and verified recovery.

## Minimum record template

| Field | Why it matters | Example entry style |
|---|---|---|
| Stable mould / asset ID | Preserves identity across years and maintenance systems | Mould-042 |
| Component ID | Links the event to a physical item rather than only the mould | Gate bush 3 |
| Date / time | Establishes chronology | ISO date/time |
| Shot count / production exposure | Gives an engineering exposure measure | cumulative shots or documented equivalent |
| Machine / cell context | Helps separate mould and machine effects | machine ID / cell ID |
| Material / grade context | Prevents mixing incompatible process histories | resin + grade |
| Observed symptom | Records what triggered investigation | dimensional drift, leak, low flow, wear mark |
| Measurement before maintenance | Creates a quantitative baseline | flow, pressure loss, dimension, clearance, roughness, photo ID |
| Physical condition finding | Distinguishes statistical suspicion from inspection evidence | corrosion, deposit, worn guide, damaged seal |
| Maintenance action | States what physically changed | clean, polish, replace, align, repair |
| Parts / consumables used | Preserves component traceability | part number / batch if relevant |
| Measurement after maintenance | Tests whether the asset condition changed | same measurement method as baseline |
| Part-quality verification | Tests whether the production outcome recovered | dimension, weight, defect rate, capability result |
| Verification sample / duration | Avoids calling one good shot a recovery | number of cycles, time window, sampling rule |
| Person / role | Preserves accountability and context | technician / engineer / approver |
| Evidence attachments | Links photos, reports or trend files without relying on memory | file IDs / URLs / CMMS attachment IDs |
| Follow-up trigger | Makes recurrence observable | recheck at X shots / condition threshold / next planned inspection |

## Required logic

The Book should visually group the record into four blocks:

1. **Identity and exposure** — what asset, component and production history are we talking about?
2. **Pre-intervention evidence** — what symptom and measured condition existed before maintenance?
3. **Intervention** — what was actually changed?
4. **Verification** — did the measured asset condition and the relevant part-quality outcome recover?

Add the callout:

> **A maintenance event is not a verified recovery until comparable measurements show what changed in the asset and what changed in the part.**

## Learner exercise

Give learners this intentionally poor record:

> “Mould 7 — black parts out of tolerance. Tool cleaned and repaired. Running OK.”

Ask them to rewrite it so a different engineer, six months later, could determine:

- which component was suspected;
- what evidence supported the suspicion;
- how much production exposure had accumulated;
- exactly what intervention occurred;
- whether the physical condition changed;
- whether part quality recovered and for how long it was verified.

### Expected reasoning

A strong rewrite adds stable component identity, shot count/date, quantified pre-condition, specific maintenance action, comparable post-condition measurement and repeated quality verification. It should not invent values that were never measured.

## Evidence context

A 2011–2024 industrial maintenance history contained **64,020 maintenance notifications across 9,157 injection moulds and 2,553 spare parts**, with shot counts at maintenance. The study itself reports data-quality limitations including mixed cleaning/maintenance records, duplicate entries, free-text information loss and lack of direct component-state information. This is exactly why the Book's record template explicitly separates symptom, physical condition, intervention and verification.

A separate mould-maintenance project repository used structured attributes such as typical failures, cycle rate, mould age/year, cavity count and maintenance duration for case-based reasoning. Use that evidence to support structured recordkeeping, not to promote the reported maintenance durations as generic planning allowances.

## Editorial boundaries

- Do not require fields solely because they are easy to collect; retain fields that support future causal diagnosis and verification.
- Do not use maintenance-model accuracy as a maintenance threshold.
- Do not treat maintenance duration from another company as a standard allowance.
- If a value was not measured, record it as missing rather than reconstructing it later.
- Company identity, product identity and commercial identifiers may be pseudonymized where needed, but join keys must remain stable inside the governed dataset.

## Source routes

- wave8:esrel-2025-9157mould-maintenance-history
- wave8:procir-2017-mould-maintenance-time-cbr
- wave6:springer-2022-13mould-rul-metrology

## Production instruction

Turn this into a one-page Book record template plus the poor-record repair exercise. Keep “measured before”, “physical finding”, “maintenance action” and “verified after” as visibly separate sections.
