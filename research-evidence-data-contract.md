# MouldMaster contextual research evidence data contract

Version: 2026.09.02.1

## Purpose

This contract defines how governed research is converted into runtime decision support. It does not authorize universal process settings or allow research to override validated local production controls.

## Canonical mechanism record

Each runtime mechanism must retain:

- stable mechanism ID and title;
- evidence maturity state;
- aliases used for retrieval;
- measured/observable signals;
- physical quality outcomes;
- application context dimensions for material, process family, tooling and measurement/sensor type;
- a bounded mechanism claim;
- patterns that support the mechanism;
- patterns that would weaken or falsify the mechanism;
- plausible alternative explanations;
- the strongest next measurement/check;
- a recovery criterion;
- an explicit limitation/boundary;
- links to qualifying primary measured studies.

## Decision model

Evidence quality and case applicability are separate values.

Evidence quality answers whether the underlying mechanism is well supported. Applicability answers how closely the current material/process/tool/signal/outcome context overlaps the retained evidence context.

A high evidence-quality mechanism with low applicability must not be presented as a high-confidence production diagnosis.

## Use in diagnostics

The application may use research to:

1. rank plausible mechanisms;
2. explain why a mechanism is plausible;
3. show what evidence would weaken it;
4. surface alternative explanations;
5. recommend a discriminating measurement or controlled verification plan;
6. define a recovery pattern to look for;
7. connect a troubleshooting event to relevant microlearning and prior cases.

The application must not use research alone to:

- declare root cause;
- create or change a validated production setpoint;
- create a universal alarm or maintenance threshold;
- override material supplier, machine, mould, hot-runner or approved site documentation;
- override applicable safety controls or law.

## Local-data interaction

Local measured evidence should take precedence over bibliographic similarity. The strongest confirmation is a coherent pattern in which relevant process actuals and a physical outcome change together and recover together after a controlled intervention.

## Research-gap feedback

Gap feedback must be categorical and local-first. It may record a mechanism ID, broad material/process family, missing signal and gap reason. It must not store free text, production identifiers, raw process data, user identity or exact timestamps.

## Freshness

DOI/source reachability remains a bibliographic freshness control. Claim-level freshness is a separate review process and should classify new evidence as confirmation, contradiction, boundary refinement, replication, new measurement method, superseding method or unrelated. Automated classification may create a review queue but must never automatically change evidence maturity.
