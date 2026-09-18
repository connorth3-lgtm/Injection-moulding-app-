#!/usr/bin/env python3
"""Fail-closed QA for Book enrichment, ISO 9001:2026 support and NZQA readiness."""
# Generated release state is committed separately and must pass this QA on the protected PR head.
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def need(ok,msg):
    if not ok: raise AssertionError(msg)
def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def text(p): return Path(p).read_text(encoding="utf-8")

# ISO 9001:2026
qsrc=ROOT/"data/quality-management-iso9001-v1.json"
qrt=ROOT/"src/domains/quality/data/quality-management-iso9001-v1.json"
need(qsrc.is_file() and qrt.is_file(),"QMS contract pair missing")
need(qsrc.read_bytes()==qrt.read_bytes(),"QMS source/runtime pair drifted")
q=load(qsrc)
need(q.get("schema")==1 and q.get("id")=="mouldmaster-iso9001-qms-support","QMS identity mismatch")
need(q.get("checked")=="2026-09-18","QMS source check must be current")
standards={x["id"]:x for x in q.get("standards",[])}
need(standards.get("ISO-9001-2026",{}).get("role")=="current-published-requirements-basis","ISO 9001:2026 must be current requirements basis")
need(standards["ISO-9001-2026"].get("currentState")=="published","ISO 9001:2026 must be published")
need(standards.get("ISO-9000-2026",{}).get("role")=="current-terminology-basis","ISO 9000:2026 must be current terminology basis")
need(standards["ISO-9000-2026"].get("currentState")=="published","ISO 9000:2026 must be published")
need(standards.get("ISO-9001-2015",{}).get("currentState")=="superseded","ISO 9001:2015 must be historical/superseded")
need([x.get("clause") for x in q.get("supportMap",[])]==["4","5","6","7","8","9","10"],"QMS support map must cover clauses 4-10")
for row in q["supportMap"]:
    need(row.get("mouldmasterSupport") and row.get("notProvided"),f"QMS clause {row.get('clause')} lacks support/exclusion separation")
need({x.get("id") for x in q.get("recordTemplates",[])}=={"audit-evidence","nonconformity-capa","measurement-resource","competence","document-change"},"QMS template set mismatch")
need(re.search(r"\bshall\b",qsrc.read_text(encoding="utf-8").lower()) is None,"QMS contract appears to reproduce normative ISO wording")
iso_register=text(ROOT/"sources/ISO9001_2026_QMS_REGISTER.md")
for marker in ["ISO 9001:2026","ISO 9000:2026","superseded transition history","does **not** establish organisational conformity"]:
    need(marker in iso_register,f"ISO register missing boundary: {marker}")

# NZQA
nsrc=ROOT/"data/nzqa-education-readiness-v1.json"
nrt=ROOT/"src/domains/learning/book-data/nzqa-education-readiness-v1.json"
tsrc=ROOT/"data/nzqa-provider-evidence-templates-v1.json"
trt=ROOT/"src/domains/learning/book-data/nzqa-provider-evidence-templates-v1.json"
for a,b,label in [(nsrc,nrt,"NZQA readiness"),(tsrc,trt,"NZQA templates")]:
    need(a.is_file() and b.is_file(),f"{label} pair missing")
    need(a.read_bytes()==b.read_bytes(),f"{label} pair drifted")
n=load(nsrc);t=load(tsrc)
need(n.get("schema")==1 and n.get("id")=="mouldmaster-nzqa-education-readiness","NZQA identity mismatch")
need(n.get("checked")=="2026-09-18","NZQA source check must be current")
need(n.get("releaseTarget")=="2026.09.18.3","NZQA readiness must target current governed release")
need(n.get("publicationEffect")=="read-only-readiness-surface","NZQA publication effect must stay read-only")
current={x["id"] for x in n.get("currentInjectionMouldingStandards",[])}
expired=set(n.get("expiredStandardsNotForCurrentAssessmentMapping",[]))
need(current=={"252","255","260","9713","27926","29515"},f"unexpected current NZQA Injection Moulding set: {sorted(current)}")
need(expired=={"253","254","256","257","258","259","27925","9712"},f"unexpected expired NZQA set: {sorted(expired)}")
need(current.isdisjoint(expired),"NZQA current/expired sets overlap")
manifest=load(ROOT/"data/book-manifest-v1.json")
chapter_ids=[c["id"] for p in manifest["parts"] for c in p["chapters"]]
mapped=[x["chapterId"] for x in n.get("chapterMap",[])]
need(len(chapter_ids)==46 and len(mapped)==46 and set(mapped)==set(chapter_ids),"NZQA mapping must cover all 46 Book chapters exactly")
for row in n["chapterMap"]:
    need(set(row["standardRefs"]).issubset(current),f"NZQA chapter {row['chapterId']} references non-current standard")
    need(set(row["standardRefs"]).isdisjoint(expired),f"NZQA chapter {row['chapterId']} references expired standard")
gates={x["id"]:x for x in n.get("gates",[])}
for gid in ["G1-provider","G2-need","G4-assessment","G5-consent","G6-national-moderation","G7-workplace"]:
    need(gates.get(gid,{}).get("status")=="external-hold",f"{gid} must remain external-hold")
need(t.get("checked")=="2026-09-18","NZQA evidence templates must be rechecked")
privacy=t.get("privacyBoundary","").lower()
for marker in ["learner pii","customer names","proprietary part data","confidential workplace records"]:
    need(marker in privacy,f"NZQA privacy boundary missing {marker}")

# Read-only runtime surface
runtime=text(ROOT/"src/domains/governance/standards-readiness.js")
for marker in ["ISO 9001 support — evidence, not certification","NZQA readiness — preparation, not approval","MM_STANDARDS_READINESS","Standards & readiness"]:
    need(marker in runtime,f"standards/readiness runtime missing {marker}")
need("localStorage" not in runtime and "indexedDB" not in runtime,"readiness surface must remain read-only")
need("quality-management-iso9001-v1.json" in runtime and "nzqa-education-readiness-v1.json" in runtime,"readiness runtime must load governed contracts")

# Book enrichment
esrc=ROOT/"data/book-evidence-enrichment-v2.json"
ert=ROOT/"src/domains/learning/book-data/book-evidence-enrichment-v2.json"
need(esrc.is_file() and ert.is_file(),"Book enrichment pair missing")
need(esrc.read_bytes()==ert.read_bytes(),"Book enrichment source/runtime pair drifted")
e=load(esrc)
need(e.get("schemaVersion")==1 and e.get("bookId")=="mouldmaster-book","Book enrichment identity mismatch")
need(e.get("release")=="2026.09.18.3","Book enrichment release mismatch")
patches=e.get("chapterPatches",[])
need(len(patches)==10 and len({x["chapterId"] for x in patches})==10,"Book enrichment must cover 10 unique chapters")
need(sum(len(x.get("sections",[])) for x in patches)==13,"Book enrichment must contain 13 governed sections")
titles={s["title"] for p in patches for s in p.get("sections",[])}
for title in [
    "Command is not cavity state","Build evidence before naming the cause","Diagnose, restore and verify",
    "Mould condition changes through its life","What two intervention cases actually show",
    "Measured quality outcomes from distributed melt control","Total flow can recover while one cavity stays different",
    "Record maintenance so recovery can be proved","Recovery needs a trajectory, not one good part",
    "Pressure only means something when you know where it was measured","Similar warpage can come from different mechanisms",
    "Choose a robust region, not one optimum point","Quality records need evidence, not just completion"
]:
    need(title in titles,f"Book enrichment section missing: {title}")
doc=next(x for x in patches if x["chapterId"]=="documentation")
need({"ISO-9001-2026","ISO-9000-2026"}.issubset(set(doc["sourceIds"])),"Book documentation patch lacks current ISO anchors")
authority=e.get("authorityBoundary",{})
need(authority.get("productionUse")=="advisory-only" and authority.get("automaticMachineControl") is False and authority.get("universalSetpoints") is False,"Book enrichment authority boundary weakened")

# Release/runtime integration
version=load(ROOT/"version.json")
need(version.get("web_release")=="2026.09.18.3","governed readiness layers require web release 2026.09.18.3")
domain_manifest=load(ROOT/"runtime-domain-manifest.json")
need("./src/domains/governance/standards-readiness.js" in domain_manifest.get("assets",[]),"readiness runtime missing from domain manifest")
sw=text(ROOT/"service-worker.js")
for asset in [
    "./src/domains/governance/standards-readiness.js",
    "./src/domains/quality/data/quality-management-iso9001-v1.json",
    "./src/domains/learning/book-data/nzqa-education-readiness-v1.json",
    "./src/domains/learning/book-data/nzqa-provider-evidence-templates-v1.json",
    "./src/domains/learning/book-data/book-evidence-enrichment-v2.json",
]:
    need(asset in sw,f"offline release missing governed readiness asset: {asset}")

auth=load(ROOT/"data/book-publication-authorization-v1.json")
permit=auth.get("evidenceEnrichmentAuthorization",{})
need(permit.get("status")=="authorized" and permit.get("release")=="2026.09.18.3","Book enrichment authorization missing")
need(permit.get("ledger")=="data/book-evidence-enrichment-v2.json","Book enrichment authorization ledger mismatch")
need(permit.get("sectionCount")==13 and permit.get("chapterCount")==10,"Book enrichment authorization counts mismatch")
need(permit.get("independentSmeStatus")=="hold","Book enrichment must preserve independent SME HOLD")
need("book-evidence-enrichment-v2.json" in auth.get("runtimeIntegrity",{}).get("gitBlobSha1ByFile",{}),"Book enrichment missing from exact-byte authorization")

sme=load(ROOT/"data/book-sme-review-v1.json")
need(sme.get("release")=="2026.09.18.3","Book SME contract release mismatch")
need(set(sme.get("enrichmentChapterIds",[]))=={x["chapterId"] for x in patches},"Book SME contract does not cover enrichment chapters")
need(sme.get("status")=="hold","Book SME must remain HOLD")

print("PASS: governed Book enrichment, ISO 9001:2026 support and NZQA readiness are byte-paired, claim-bounded, read-only/offline-governed and release-authorized.")
