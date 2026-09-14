# Book data-acquisition outreach pack — 2026-09-15

Purpose: ready-to-send, minimal-data requests for the three remaining Book evidence-linkage gaps. These templates request only the fields needed to answer the research question, allow de-identification, and separate permission to analyse data from permission to redistribute raw rows.

## 1. Black-speck / black-dot chronology request

**Suggested recipients:** Ryan Jeffrey P. Curbano (`ryanjeffrey.curbano@lpulaguna.edu.ph`); Itthiwat Rattanabunditsakun or advisor/institutional repository contact for the Chulalongkorn thesis.

**Subject:** Request for de-identified black-speck intervention chronology for injection-moulding education research

Dear [Name],

I am working on an evidence-based injection-moulding training resource that is building original troubleshooting examples from published production studies. Your work on black-spot/black-dot reduction is especially useful because it reports a real intervention and a measured production outcome.

Would you be willing to share a de-identified extract of the underlying chronology used in the study? We do not need company names, customer/product identities, recipes, commercial resin names, or other trade-sensitive information. The smallest useful record would contain ordered cycle/sample IDs, the black-speck or black-dot observation for each sample or interval, the intervention timing/type, and enough post-intervention observations to show whether the process stabilized. Material family and machine/mould identifiers can be pseudonymized.

CSV/XLSX is ideal, but any documented export is useful. If raw rows cannot be redistributed, that is acceptable: we can work under terms that allow analysis and publication only of newly derived, de-identified diagrams/tables with attribution. We would not reproduce protected figures or claim that a plant-specific intervention is a universal root cause.

If the original shot-level log no longer exists, a control-chart export, defect log, inspection counts by production interval, or intervention/quality timeline would still be valuable.

Thank you for considering the request.

## 2. Hot-runner synchronized actuator/cavity/quality request

**Suggested recipients:** Matthias Schöll (`matthias.schoell@ikv.rwth-aachen.de`); EWIKON Application Engineering (`anwendungstechnik@ewikon.com`) or `info@ewikon.com`.

**Subject:** Request for synchronized valve-pin, cavity-pressure and quality traces for educational research

Dear [Name],

I am building an evidence-based injection-moulding training resource and am looking for one narrowly defined dataset that is difficult to find publicly: synchronized hot-runner records that distinguish the valve command from the valve’s actual motion and then link that to what happened in the cavity and to the resulting part.

The minimum useful record would have a shared cycle/time identifier, gate or cavity ID, commanded valve state/target stroke, actual valve-pin position or stroke, local cavity-pressure trace, and a cavity-specific quality result such as part weight or a measured dimension. Motor current, torque or force is highly desirable where available, but not mandatory. Process settings can be limited to what is needed to interpret the trial.

The data may be de-identified and commercial mould/material identities may be removed. We do not require permission to republish raw controller exports. A restricted data-use arrangement that permits analysis and publication of new, de-identified Book diagrams/tables would be sufficient. We will keep legacy/self-regulating valve evidence separate from modern servo performance and will not present a single trial as a universal control recipe.

A small but well-documented experiment is enough: for example, 50+ cycles per cavity around a stable period and one deliberate/natural disturbance, with channel units and sensor locations documented.

If the raw traces cannot be shared, an institutional archive, anonymized sample export, or field/schema documentation showing how cycle IDs join controller, cavity-sensor and quality records would still materially advance the work.

Thank you for considering the request.

## 3. Mould condition → maintenance → recovery request

**Suggested recipients:** Parisa Niloofar (`parni@mmmi.sdu.dk`), Kristian Have (`kristian.have@hotmail.com`), Flavia Dalia Frumosu (`fdal@dtu.dk`), corresponding author/project owners of the 13-mould RUL study, and the University of Aveiro/OLI predictive-maintenance project team.

**Subject:** Request for de-identified mould maintenance and post-maintenance recovery records

Dear [Name],

I am working on an evidence-based injection-moulding training resource and would like to build an original lifecycle example showing the complete chain from measured mould/component condition, through maintenance/refurbishment, to verified production recovery.

Your published work already establishes strong real-world mould lifecycle or maintenance evidence. The remaining question is whether a small de-identified event-linked extract could be shared. The minimum useful fields are: stable mould/asset ID, maintenance-event ID, shot count (or another exposure measure) at the event, a measured pre-intervention condition or failure state, the specific maintenance action, a post-intervention condition measurement, and comparable part-quality/metrology results before and after the intervention.

Company, customer, product and tool identities may be fully pseudonymized. We do not need cost data, proprietary geometry, commercial process recipes or confidential maintenance notes unrelated to the evidence question. CSV/XLSX/Parquet is ideal, but a joined CMMS + metrology export with documented keys is equally useful.

If raw rows cannot be redistributed, a research-use agreement that permits analysis and publication of derived, de-identified lifecycle/recovery diagrams would be enough. We will not convert model accuracy, component lifetimes or maintenance durations into generic thresholds.

Even a small subset of repeated events across a few moulds would be valuable if the condition → intervention → recovery linkage is reliable.

Thank you for considering the request.

## Intake rule

Any reply or dataset must be evaluated against `data/research-expansion/2026-09-15/book-data-acquisition-execution-v1.json` before acceptance. Publication/open-access status of a paper does **not** automatically authorize reuse or redistribution of the underlying industrial data.