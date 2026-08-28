# MouldMaster real process-data pilot execution handoff

Status: execution-ready repository handoff; external site authorisation and measured data still required  
Reviewed: 2026-08-28

This handoff turns issue #50 into a concrete site-run sequence without pretending that a real pilot has already occurred. The repository can validate a prepared pilot file, but only an authorised site can provide the permissions, controlled source record, measured production history and independent engineering finding required to complete the pilot.

## What is ready in the repository

- Local browser/desktop CSV preparation: `process-data-local-intake.js`
- Intake/data-governance standard: `sources/REAL_PROCESS_DATA_INTAKE.md`
- Pilot protocol: `sources/REAL_PROCESS_DATA_PILOT_PROTOCOL.md`
- Empty prepared-file contract: `data/real-process-data-pilot-template.csv`
- Fail-closed prepared-file preflight: `tools/preflight_real_process_data_pilot.py`
- Synthetic regression fixture only: `qa/fixtures/real-process-data-pilot-synthetic.csv`
- CI guard: `.github/workflows/real-site-pilot-preflight.yml`

The synthetic fixture exists only to test the validator. It is not measured evidence and must never be cited as completion of issue #50.

## Site execution sequence

1. Obtain explicit organisational permission for the pilot use and identify the raw-data storage/retention owner.
2. Select one real injection-moulding process history with a stable baseline and a documented fault/drift period. Prefer a case with a controlled test/intervention and recovery/verification period.
3. Preserve the controlled raw source locally under the site's approved governance process. Do not upload it to the public MouldMaster repository.
4. Prepare a pseudonymised working CSV locally using MouldMaster's intake tool or an equivalent approved process. Preserve shot order, cavity identity, actual process evidence, material/lot state, quality outcome and intervention timing.
5. Human-review the prepared file for identifiers, units, command/setpoint-versus-actual semantics, sequence, cavity structure, missing values and inspection-method limitations.
6. Run the repository preflight against the prepared file.
7. Only if the preflight reports `evaluation-ready-human-comparison-required`, perform the MouldMaster diagnostic-learning comparison against the independently investigated engineering finding.
8. Record the learning conclusion and any content/data correction. Keep private approvals, proprietary values and raw records outside the public repository.
9. Publish only an approved aggregate conclusion that cannot reasonably identify the site/customer/tool/product/process, if publication is permitted.

## Preflight command

Run from a controlled local checkout:

```bash
python tools/preflight_real_process_data_pilot.py \
  --input "/approved/local/path/prepared-pilot.csv" \
  --output "/approved/local/path/pilot-preflight.json" \
  --confirm-site-authorised \
  --confirm-prepared-file-approved \
  --confirm-units-reviewed \
  --confirm-command-actual-reviewed \
  --confirm-raw-retained-under-site-governance \
  --confirm-independent-finding-available
```

Each confirmation is an operator assertion about the actual site pilot. Do not supply a confirmation merely to make the command pass.

## What the preflight checks

The tool checks the prepared file without writing raw row values to its report. It records only aggregate/provenance information such as:

- SHA-256 and byte size;
- row and column counts;
- required-header coverage;
- forbidden direct/person/timestamp/free-text header classes;
- shot-index completeness, numeric validity, uniqueness and ordering;
- canonical baseline/fault/test/recovery/verification counts;
- alias completeness and distinct alias counts without alias values;
- aggregate missing/numeric counts for physical evidence signals;
- aggregate quality/intervention completeness and distinct-category counts;
- the six required governance/evidence confirmations;
- unresolved evidence gaps and the completion boundary.

It does **not** report measured values, minima/maxima, process ranges, setpoints, identifiers or sample rows.

## Fail-closed behaviour

A real prepared file is not evaluation-ready when any of the following applies:

- required pilot headers are missing;
- direct/person/timestamp/free-text header classes remain;
- shot sequence is incomplete, nonnumeric, duplicated or non-increasing;
- baseline or fault/drift evidence is absent;
- controlled phase labels are invalid;
- fewer than four usable numeric physical evidence signals are present;
- site authorisation, prepared-file approval, units review, command/actual review, controlled raw retention or an independent engineering finding has not been explicitly confirmed.

A missing test, recovery or verification phase is surfaced as an evidence gap even if the minimum structural gate passes. The human reviewer must decide whether the remaining evidence is strong enough for a defensible comparison; the tool does not manufacture causality.

## Pilot completion record

Issue #50 should be closed only after all of the following are true for at least one authorised measured site case:

- the prepared measured dataset passes the preflight;
- the independently investigated engineering finding is available under site governance;
- MouldMaster's ranked mechanism/reasoning has been compared with that finding;
- discriminating evidence versus merely correlated evidence is documented;
- recovery/verification behaviour is reviewed where available;
- at least one concrete learning/content/data conclusion is recorded;
- evidence is retained under the site's approved governance process;
- any public repository statement remains aggregate, approved and non-identifying.

Do not commit the local preflight report automatically. It may still contain sensitive aggregate metadata and belongs under the site's governance process unless publication is explicitly approved.

## Production boundary

Passing the preflight or pilot does not authorise a production change, create a validated process window, establish universal setpoints, override machine/resin/tool documentation, or replace site change control, competent engineering review or safety requirements. Never manufacture a fault, bypass guards/interlocks or defeat hazardous-energy controls to create pilot evidence.
