# Material expansion — 60 common + 20 specialty selections

Status: 2026-09-02

This layer expands the engineering material catalog without weakening the existing evidence policy. Selector entries are navigation/formulation classes; only sourced grade/family records may contribute engineering properties. Missing exact-grade process values remain null.

## New common material families

| Family | Representative supplier anchor | Evidence retained |
|---|---|---|
| MABS | INEOS Styrolution Terlux 2802 | Standard injection-moulding MABS; supplier melt 230–260 °C and mould 50–75 °C guidance. |
| AES | Techno-UMG TECHNO AES W210 | Current weatherable AES grade identity; setpoints remain null pending exact TDS capture. |
| SBC | INEOS Styrolution Styrolux 656C | Clear SBC used almost exclusively for injection moulding of rigid/tough transparent parts. |
| SEBS | Kraton G1651 / automotive processing guidance | SEBS used in injection-moulded TPE compounds; formulation-dependent conditions remain null. |
| SMMA | INEOS Styrolution NAS 90 | Clear SMMA grade; MFR 1.5 g/10 min at 200 °C / 5 kg retained. |
| PPE/PA | SABIC NORYL GTX | PPE/PA high-performance blend family anchor. |
| MBS | INEOS Styrolution Zylar 631 | Injection-moulded transparent impact styrenic; MFR 5 g/10 min at 200 °C / 5 kg. |
| ABS/PA | INEOS Styrolution Terblend N NM-19 | ABS/PA; family processing guidance 260–280 °C melt, 50–80 °C mould; conditioned total shrinkage about 0.7%. |
| ASA/PA | INEOS Styrolution Terblend S SG-02EF | ASA/PA6 blend, exact grade identity retained. |
| ASA/PC | INEOS Styrolution Luran S KR2864C | ASA/PC; 90–115 °C / 2–4 h drying, <0.1% moisture, 260–300 °C melt, 60–90 °C mould family guidance. |

## New specialty families

| Family | Representative supplier anchor | Evidence retained |
|---|---|---|
| SPS | Idemitsu XAREC SPS | Primary high-performance syndiotactic-polystyrene family anchor. |
| PMP | Mitsui Chemicals TPX | Injection mouldable polymethylpentene; density about 0.83 g/cm³; normally no predrying when properly stored; high-temperature processing note retained without converting it into a false exact window. |
| ETFE | Daikin NEOFLON EP-546 | Exact TDS: injection-moulded parts permitted; MFR 4–8 g/10 min at 297 °C; melting point and specific-gravity ranges retained at source. |
| FEP | Daikin NEOFLON NP-101 | Exact TDS: thin-wall injection moulding; MFR 21–27 g/10 min; melting point 250–260 °C retained at source. |
| PFA | Daikin NEOFLON AP-202 / AP-series | Melt-processable PFA with injection-moulding grades; AP-202 high-flow family table retained. |
| EFEP | Daikin NEOFLON RP-4020 | Exact TDS: injection moulding supported; MFR 40 g/10 min at 265 °C, density 1.74 g/cm³, representative melting point 160 °C. |

## Catalog totals

- 66 material families.
- 67 representative supplier/grade records.
- 60 common shop-floor material selections.
- 20 specialty/high-performance selections.
- 80 total selector entries.

## Validation

`qa-material-expanded-catalog-200.js` performs a deterministic 200-case property/provenance pass and verifies:

- exactly 66 families and 67 representative records;
- exactly 60 common and 20 specialty selector entries;
- every selector family exists;
- every selected family has at least one representative sourced record;
- duplicate family/grade/selection IDs are rejected;
- all representative records retain HTTPS provenance;
- source evidence levels remain within the approved vocabulary.

The catalog remains an engineering starting-point system. Supplier data do not replace current exact-grade TDS/process sheets, machine OEM limits, mould/hot-runner documentation, or site process validation.