# MouldMaster Academy — Deep-Dive Injection Moulding Source Register

Research date: 2026-08-24

Purpose: document the additional standards and technical source families used by `reference-deep-dive.js`. These references support education, terminology, test-method interpretation, risk assessment, data exchange, validation concepts and sustainability claims. They **do not create universal machine settings or material recipes**.

## Plastics material and test methods

- **ISO 294-4:2018 — Plastics — Injection moulding of test specimens of thermoplastic materials — Part 4: Determination of moulding shrinkage**. Used for the distinction between moulding shrinkage, post-moulding shrinkage and production-part dimensional behaviour. ISO lists the 2018 edition as published/current after confirmation. https://www.iso.org/standard/70413.html
- **ISO 15512:2019 — Plastics — Determination of water content**. Used for pellet/material water-content concepts. A replacement edition was under development in 2026, so status must be rechecked before formal contractual use. https://www.iso.org/standard/73834.html
- **ISO 62:2008 — Plastics — Determination of water absorption**. Used to distinguish equilibrium/defined-exposure water absorption from processing-material water-content testing. https://www.iso.org/standard/41672.html
- **ISO 527-2:2025 — Plastics — Determination of tensile properties — Part 2: Test conditions for moulding and extrusion plastics**. Current 2025 edition for tensile-property comparison of moulding/extrusion plastics. https://www.iso.org/standard/527-2
- **ISO 178:2019 — Plastics — Determination of flexural properties**. Used for flexural-property terminology. Revision work was active in 2026; recheck status before formal use. https://www.iso.org/standard/70513.html
- **ISO 179-1:2026 — Plastics — Determination of Charpy impact properties — Part 1: Non-instrumented impact test**. Current 2026 edition; it replaced ISO 179-1:2023. https://www.iso.org/standard/91071.html
- **ISO 180:2023 — Plastics — Determination of Izod impact strength**. Current published Izod impact reference. https://www.iso.org/standard/84394.html
- **ISO 75-2:2013 — Plastics — Determination of temperature of deflection under load — Part 2**. Used for HDT terminology; HDT is a defined test result, not a universal service-temperature limit. https://www.iso.org/standard/55653.html
- **ISO 306:2022 — Plastics — Thermoplastic materials — Determination of Vicat softening temperature**. Used for Vicat terminology. Revision work was active in 2026, so formal users should check ISO status. https://www.iso.org/standard/82176.html
- **ISO 1183-1:2025 — Plastics — Methods for determining density of non-cellular plastics — Part 1**. Current density-method reference. https://www.iso.org/standard/85977.html
- **ISO 1133-1:2022 — Plastics — Determination of melt mass-flow rate and melt volume-flow rate**. MFR/MVR under defined conditions; not a complete moulding rheology curve. https://www.iso.org/standard/83905.html
- **ASTM D1238 — Melt Flow Rates of Thermoplastics by Extrusion Plastometer**. Complementary melt-flow test-method reference. https://store.astm.org/standards/d1238

## Machinery, safeguards and robot integration

- **ISO 20430:2020 — Injection moulding machines — Safety requirements**. Primary injection-machine technical safety reference. https://www.iso.org/standard/68000.html
- **ISO 12100:2010 — Safety of machinery — General principles for design — Risk assessment and risk reduction**. Used for machinery risk-assessment and modification concepts. It remained published but was under revision in 2026. https://www.iso.org/standard/51528.html
- **ISO 13849-1:2023 — Safety of machinery — Safety-related parts of control systems — Part 1**. Used for safety-related control-function design/integration concepts. https://www.iso.org/standard/73481.html
- **ISO 13850:2015 — Safety of machinery — Emergency stop function — Principles for design**. Used to distinguish emergency stop from normal isolation and guarding. https://www.iso.org/standard/59970.html
- **ISO 10218-1:2025 — Robotics — Safety requirements — Part 1: Industrial robots**. Current industrial-robot safety reference. https://www.iso.org/standard/73933.html
- **ISO 10218-2:2025 — Robotics — Safety requirements — Part 2: Industrial robot applications and robot cells**. Current integrated robot-cell/application safety reference. https://www.iso.org/standard/73934.html
- **OSHA 1910.147 — Control of hazardous energy (lockout/tagout)**. US hazardous-energy reference. https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147
- **WorkSafe NZ — Keeping workers safe with machine lockouts**. NZ machinery isolation/de-energisation guidance. https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/

## Machine data, automation and interoperability

- **EUROMAP 77 — OPC UA interface between injection moulding machines and MES**. Used for MES/machine interoperability and production-data-exchange concepts. https://euromap.org/euromap77
- **EUROMAP 82.1 — OPC UA interface for temperature control devices**. Used for mould-temperature-control-device data exchange concepts. https://www.euromap.org/en/euromap82-1/
- **EUROMAP OPC UA overview**. Tracks released and developing plastics/rubber machinery OPC UA companion specifications. https://www.euromap.org/i40/OPCUA
- **EUROMAP technical recommendations**. Supporting machinery/peripheral/robot/hot-runner interface recommendations. https://www.euromap.org/technical-issues/technical-recommendations
- **Kistler — Cavity pressure**. Manufacturer technical background for cavity-pressure monitoring; explanatory/vendor source, not a universal acceptance specification. https://www.kistler.com/en/cavity-pressure/cavity-pressure/C00000099
- **RJG — Injection molding resource center**. Industry training/technical background for scientific moulding and process-development concepts; vendor/training source rather than a governing standard. https://rjginc.com/resource-center/

## Quality, measurement and validation

- **NIST/SEMATECH Engineering Statistics Handbook**. Engineering-statistics foundation for measurement, control charts, capability and DOE. https://www.itl.nist.gov/div898/handbook/
- **ISO 22514-2:2026 — Statistical methods in process management — Capability and performance**. Current process-capability reference used by the main source library. https://www.iso.org/standard/88883.html
- **FDA — Process Validation: General Principles and Practices**. Lifecycle process-validation framework for regulated pharmaceutical/biological manufacturing. Included as a validation-concept reference only where that regulatory context is relevant. https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices
- **ISO 13485:2016 — Medical devices — Quality management systems**. Used only for medical-device QMS context; it does not make MouldMaster a medical-device validation authority. https://www.iso.org/standard/59752.html
- **ISO 9001:2015 — Quality management systems — Requirements**. General QMS context. As of the research date, the 2015 edition remained published while a replacement edition was progressing toward publication; recheck before formal use. https://www.iso.org/standard/62085.html

## Sustainability, recycling and environmental claims

- **ISO 14021:2026 — Environmental statements and programmes for products — Self-declared environmental claims**. Current 2026 reference for self-declared environmental-claim concepts, including careful treatment of recycled-content claims. https://www.iso.org/standard/14021
- **ISO 14040:2006 + Amendment 1:2020 — Environmental management — Life cycle assessment — Principles and framework**. LCA framework reference. https://www.iso.org/standard/37456.html
- **ISO 14044:2006 + amendments — Environmental management — Life cycle assessment — Requirements and guidelines**. LCA requirements/guidelines reference. https://www.iso.org/standard/38498.html
- **ISO 15270:2008 — Plastics — Guidelines for the recovery and recycling of plastics waste**. Historical/current published recycling guideline at the research date, while replacement multi-part work was progressing. Recheck status for formal use. https://www.iso.org/standard/45089.html

## Use rules

1. A standardised material test result is only comparable when specimen preparation, conditioning and test method are controlled.
2. MFR/MVR, tensile, impact, HDT, Vicat and shrinkage values are **test results**, not automatic machine setpoints or design allowables.
3. Water-content testing and water-absorption testing answer different questions.
4. Safety standards and regulator guidance control safety concepts; ordinary process-control logic is not automatically a validated safety function.
5. Vendor resources (Kistler, RJG, Autodesk, resin suppliers) are useful technical evidence but do not override law, standards, machine manuals, product requirements or approved site procedures.
6. Environmental claims such as recycled content, recyclability, bio-based content or compostability require defined evidence and must not be inferred from polymer family names.
7. Standards with active revision/replacement work must have their status rechecked before accreditation, contractual, regulatory or customer-facing use.
