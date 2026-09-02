# MouldMaster Material Engineering Source Register

Status: 2026-09-02

Purpose: support exact-grade engineering records without turning family-level guidance into universal production recipes.

## Data policy

1. Exact supplier grade data outrank polymer-family guidance.
2. Missing fields remain `null`; values are not borrowed silently from another grade.
3. Supplier processing values are starting windows/guidance, not validated process settings for a specific mould.
4. Barrel-zone settings and measured melt temperature are separate quantities.
5. Drying temperature/time pairs must remain paired when the supplier publishes a schedule rather than a continuous range.
6. Directional shrinkage remains directional; a single percentage must not replace flow/transverse data for anisotropic materials.
7. Secondary supplier-attributed databases are explicitly labelled and should be replaced with current primary TDS/processing guides when available.
8. Recycled/circular claims must preserve the supplier’s actual claim mechanism (for example mass-balance chemically recycled attribution versus mechanically recycled content).

## Existing reference families — grade coverage

| Existing family | Grade-level record |
|---|---|
| PP | LyondellBasell Moplen HP500N |
| HDPE | LyondellBasell Lupolen GX 5038 |
| ABS | INEOS Styrolution Terluran GP-35 |
| PC | Covestro Makrolon 2405 |
| PA6 / PA66 | BASF Ultramid B3EG7 + A3EG7 |
| POM | Celanese Hostaform C 9021 |
| PBT | BASF Ultradur B4300 G6 High Speed |
| PET | Rynite 530 NC010 — secondary supplier-attributed, verify current TDS |
| PMMA | PLEXIGLAS 8N plus — secondary supplier-attributed, verify current Roehm sheet |
| TPU | Covestro Desmopan 786 E |
| PPS | Syensqo Ryton R-4-200BL |
| PEEK | VICTREX PEEK 450GL30 |
| PS | INEOS Styrolution PS 165N/L |
| HIPS | INEOS Styrolution PS 495N |
| ASA | INEOS Luran S 757G |
| SAN | INEOS Luran 378P |
| TPE / TPR | KRAIBURG THERMOLAST K TP9LDZ |
| LCP | Celanese Vectra A130 — secondary supplier-attributed, verify current guide |
| PC/ABS | Covestro Bayblend T65 XF |
| Recycled-content compounds | Covestro Makrolon 2405 RP70 CQ |

## Added families

| Added family | Grade-level record |
|---|---|
| LDPE | LyondellBasell Lupolen 1800S |
| PPA | BASF Ultramid Advanced T1000 HG7 UN |
| PEI | SABIC ULTEM 1000 — secondary supplier-attributed, verify current SABIC guide |
| PPSU | Syensqo Radel R-5000 |

## High-confidence processing examples retained

### Covestro Makrolon 2405

The record retains supplier drying at 120 °C for 2–3 h with maximum moisture 0.02%, melt 280–320 °C with 300 °C standard value, mould 80–120 °C, barrel zones, nozzle range, screw peripheral speed and 30–70% shot/cylinder guidance. Directional moulding shrinkage values are retained separately.

### BASF Ultradur B4300 G6 High Speed

The record retains maximum moisture 0.04%, 80–120 °C drying with 100 °C target for 4 h, 230–275 °C melt with 260 °C target, 60–100 °C mould with 80 °C target, barrel/nozzle starting values, screw peripheral limit and separate parallel/transverse shrinkage.

### BASF Ultramid Advanced T1000 HG7 UN

The PPA record retains 120 °C / 8 h drying, maximum moisture 0.05%, 335–355 °C melt with 350 °C target, 140–170 °C mould range with supplier optimum guidance at or above 150 °C, maximum 5 min supplier residence guidance in the source context, and directional shrinkage.

### Syensqo Radel R-5000

Drying is stored as discrete supplier pairs rather than a fabricated continuous range: 177 °C for at least 2.5 h, 150 °C for at least 4 h, or 135 °C for at least 4.5 h. Maximum injection-moulding moisture is retained as 500 ppm (0.05%).

## Intentional nulls / evidence gaps

- Moplen HP500N: exact public grade source does not provide a production injection-temperature window, so melt/mould processing fields remain null.
- Desmopan 786 E: public grade data provides maximum drying temperature but not a complete exact-grade drying duration, so duration remains null.
- VICTREX PEEK 450GL30: captured grade evidence supports barrel/nozzle starting values and mould range; measured/actual melt range remains null until separately verified.
- THERMOLAST K TP9LDZ: grade/property record is retained but processing setpoints are not invented from generic TPE family guidance.
- PET, PMMA, LCP and PEI records currently contain some secondary supplier-attributed data and are visibly marked as such.

The executable coverage audit is in `qa-material-engineering.js`. The database itself is `material-engineering-database.js`.
