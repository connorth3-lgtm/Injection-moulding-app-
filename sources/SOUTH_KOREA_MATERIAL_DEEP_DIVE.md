# South Korea material supplier deep dive

Date: 2026-09-03

## Why this matters
South Korea is not just a secondary source of commodity resin. Korean producers have deep current portfolios across ABS/SAN, PC and PC alloys, POM, PBT, PA6/PA66, PP/PE, TPE/TPC-ET, copolyesters, PPA/PCT/PPS, PVC/CPVC/EVA and aliphatic polyketone. These portfolios are particularly useful for the MouldMaster goal of reaching 10+ real commercial grades per material family because several suppliers expose current searchable grade tables rather than only family brochures.

## Primary supplier map

### LG Chem
Current supplier pages cover ABS, PC-based LUPOY compounds, ABS/SAN-based LUPOS compounds, PP-based LUPOL compounds, PPS/SPS-based LUSEP, LUCON conductive compounds, PVC, POE/LUCENE and other petrochemical resins. LG Chem explicitly identifies POE use in compound/injection supply chains and maintains one of the world's largest ABS businesses.

Primary pages:
- https://www.lgchem.com/product-detail/abs
- https://www.lgchem.com/product-detail/lupoy
- https://www.lgchem.com/product-detail/lupos
- https://www.lgchem.com/product-detail/lupol
- https://www.lgchem.com/product-detail/lusep
- https://www.lgchem.com/product-detail/lucon?lang=en_US
- https://www.lgchem.com/product-detail/poe

### LOTTE Chemical
LOTTE's live Advanced Materials datasheet system exposes exact grade names and resin types across ABS, PC/ABS, PC/PET, PC/PBT, PPA, PCT, PBT, PPS, PP and related compounds. The business portfolio also includes starex ABS/ASA, INFINO PC/PC alloys/high-performance EP, POPELEN PP compounds, SUPRAN LFT and LOTTMER TPE.

Primary pages:
- https://product.lottechem.com/en/advanced_materials/datasheets.do
- https://product.lottechem.com/en/advanced_materials/pc.do
- https://product.lottechem.com/ko/advanced_materials/asa.do
- https://product.lottechem.com/ko/advanced_materials/tpe.do

Exact-grade processing pages are available for selected grades; they remain exact-grade evidence and must never be generalized to the whole resin family.

### KOLON ENP
KOLON is unusually valuable for grade coverage because its current property table publishes many exact commercial grades. KOCETAL POM, SPESIN PBT and KOPA PA6/PA66 each expose well over ten current grade identities. KOPEL is a Korean TPC-ET family and KOPPS is PPS.

Primary pages:
- https://www.kolonenp.com/en/sub/product-table.php
- https://www.kolonenp.com/en/sub/product-table.php?page=3
- https://www.kolonenp.com/en/sub/product-table.php?page=5
- https://www.kolonenp.com/en/sub/product-table.php?page=6
- https://www.kolonenp.com/en/sub/KOPEL.php
- https://www.kolonenp.com/en/sub/KOPPS.php

### Samyang Corporation
Samyang states that its Advanced Material business has 500+ products and supplies TRIREX PC, TRILOY PC alloys, TRIBIT PBT, TRIPET PET, TRIEL TPEE, TRILEN PP, TRIBS ABS, TRIHIP HIPS, TRIMMA PMMA, TRAMID PA, TRIPPE modified PPE, TRIPPS PPS, TRIPLA PLA and long-fibre thermoplastics. The public family page is excellent for supplier/family coverage, but exact grade identities should only enter the grade library when an exact grade datasheet or current product listing is captured.

Primary page:
- https://www.samyangcorp.com/en/chemical-business/engineering-plastics

### SK chemicals
SK chemicals provides several especially useful polyester systems. SKYGREEN has multiple current copolyester grades including dedicated injection grades; ECOZEN provides a broad heat-resistant bio-based copolyester portfolio; SKYPET covers PET; SKYPURA is PCT; and SKYPEL is TPC-ET with standard and fast-injection product types.

Primary pages:
- https://www.skchemicals.com/en/products/SKYGREEN.aspx
- https://www.skchemicals.com/en/products/ECOZEN.aspx
- https://www.skchemicals.com/en/products/SKYPET.aspx
- https://www.skchemicals.com/en/products/SKYPURA.aspx
- https://www.skchemicals.com/en/products/SKYPEL.aspx

### Hyosung Chemical
Hyosung is strategically important because POKETONE is a distinct engineering-plastic family rather than another brand of an existing resin. The current supplier site describes aliphatic polyketone injection-moulding grades and exposes a large grade/certification table including unfilled, glass-reinforced, flame-retardant, food-contact, medical and drinking-water variants.

Primary pages:
- https://www.hyosungchemical.com/en/business/pok
- https://www.poketone.com/en/polyketone/portfolio.do
- https://www.poketone.com/en/polyketone/datasheet.do

POKETONE is therefore added as its own `PK` material family, not folded into POM, PA or polyester.

### DL Chemical / PolyMirae
DL Chemical provides Korean HDPE and metallocene PE and participates in PolyMirae PP. PolyMirae publishes exact PP product pages and injection-use grades. These are useful primary sources for PP/PE grade identity and application evidence.

Primary pages:
- https://dlchemical.co.kr/en/biz/polyethylene
- https://www.daelim.co.kr/en/pc/business-areas/polymer/polypropylene.do
- https://www.polymirae.com/home/?lang=en

### Kumho Petrochemical
Kumho's current product/archive pages expose deep ABS and SAN portfolios, plus GPPS/HIPS and synthetic-rubber families. The current ABS archive and SAN product table provide enough exact current grade identities to satisfy a 10-grade identity threshold without inventing aliases.

Primary pages:
- https://www.kkpc.com/eng/product/library/libraryList/?PRODUCT_CATEGORIZE_SEQ=2&PRODUCT_SEQ=14
- https://www.kkpc.com/eng/product/syntheticResins/productDetail/?seq=15
- https://www.kkpc.co.kr/eng/

### Hanwha Solutions Chemical
Hanwha is a major Korean source of PVC, CPVC, LDPE/LLDPE and EVA. It is especially relevant to the app's flexible-PVC and EVA coverage, but a base PVC resin must not be treated as an injection-ready flexible PVC compound without compound-specific plasticizer/stabilizer evidence.

Primary company page:
- https://www.hanwha.com/companies/hanwha-solutions-chemical-division.do

## Grade identity rules
1. A grade identity proves that a named commercial grade exists in a supplier's current portfolio. It does not authorize processing values.
2. Numeric moulding data are populated only from exact-grade supplier documentation or clearly labelled family-level processing guides.
3. Country of supplier/source is stored separately from polymer family and process model.
4. Korean resin producers can strengthen global grade coverage but do not replace exact compound verification for PVC, TPE or rubber systems.
5. Historical PDFs are useful for lineage research but current live supplier catalogues outrank historical grade lists for the 10+ grade requirement.

## First Korean grade-source pack
The runtime extension initially enforces >=10 Korean primary-source grade identities for:
- ABS — Kumho Petrochemical
- SAN — Kumho Petrochemical
- POM — KOLON KOCETAL
- PBT — KOLON SPESIN
- PA — KOLON KOPA PA6/PA66
- COPOLYESTER — SK chemicals SKYGREEN
- PK / POKETONE — Hyosung Chemical

This pack is intentionally an identity/provenance layer. Detailed process windows remain in the exact-grade engineering records and are never copied from one grade to another.