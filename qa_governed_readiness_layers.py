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
def release_key(value):
    try:
        parts=tuple(int(part) for part in str(value).split("."))
    except (TypeError,ValueError):
        return ()
    return parts if len(parts)==4 else ()
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
examples=q.get("packagingExamples",[])
need(len(examples)>=1,"QMS packaging example missing")
marlex=next((x for x in examples if x.get("id")=="marlex-polyethylene-sai-global-qms-marking-observation-v1"),None)
need(marlex is not None,"Marlex ISO 9001 packaging example missing")
need((marlex.get("observedMaterialIdentity") or {}).get("exactGradeStatus")=="unresolved-from-photo","Marlex exact grade must remain unresolved")
need("not as ISO 9001 certification of the polyethylene resin" in marlex.get("interpretation",""),"QMS/product-certification boundary weakened")
need(marlex.get("currentCertificateStatus")=="not-verified-from-packaging","packaging mark must not imply current certificate validation")
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
current_release=load(ROOT/"version.json").get("web_release")
readiness_release=n.get("releaseTarget")
need(release_key(readiness_release) and release_key(current_release) and release_key(readiness_release)<=release_key(current_release),"NZQA readiness release target is missing or future-dated")
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

# Regional course packs use existing lesson IDs and the governed Book module IDs.
course_asset="src/domains/learning/book-data/education-course-packs-v1.json"
course_canonical=ROOT/"data/education-course-packs-v1.json"
need(course_canonical.read_bytes()==(ROOT/course_asset).read_bytes(),"regional course pack source/runtime pair drifted")
courses=load(course_canonical)
embedded=json.JSONDecoder().raw_decode(runtime.split("const EDUCATION_DATA=Object.freeze(",1)[1])[0]
release_version=load(ROOT/"version.json")["education_pathways_version"]
need(courses["schema"]==1 and courses["id"]=="mouldmaster-education-course-packs","course pack identity mismatch")
need(courses["version"]==embedded["version"]==release_version,"regional study content versions differ")
need(courses["status"]=="draft-provider-review" and "Approved providers control" in courses["boundary"],"course packs require provider review")
packs=courses["packs"]
need(len(packs)==7 and set(packs)=={p["id"] for p in embedded["pathways"]},"each regional pathway requires one course pack")
lessons_text=text(ROOT/"src/core-runtime/core-inline-002.js").split("window.MM_DATA = ",1)[1].lstrip()
lesson_ids={lesson["id"] for lesson in json.JSONDecoder().raw_decode(lessons_text)[0]["lessons"]}
sources=courses["sources"]
exercises=courses["exercises"]
used_exercises=set()
refs={}
for pid,pack in packs.items():
    need(pack["scope"] and pack["delivery"] and pack["rows"],f"{pid} is missing delivery scope or mappings")
    need(all(sources[s]["url"].startswith("https://") and sources[s]["title"] for s in pack["sourceIds"]),f"{pid} has an invalid source")
    identifiers=[ref for row in pack["rows"] for ref in row["refs"]]
    refs[pid]=set(identifiers)
    need(len(identifiers)==len(refs[pid]),f"{pid} has duplicate requirement references")
    for row in pack["rows"]:
        need(row["refs"] and row["title"] and row["evidence"],f"{pid} has an incomplete mapping")
        need(row["coverage"] in {"mapped","supplement","workplace","provider"},f"{pid} has an invalid coverage category")
        need(set(row["book"])<=set(chapter_ids) and set(row["lessons"])<=lesson_ids,f"{pid} has a broken learning link: {row['title']}")
        if row["exercise"]: used_exercises.add(row["exercise"])
need(used_exercises==set(exercises),"workbook links must cover exactly the published workbooks")
need({key for key,workbook in exercises.items() if "hi" in workbook}=={"india-5s","india-office","india-employability","india-enterprise"},"Hindi workbook set drifted")
for key,workbook in exercises.items():
    for content in [workbook, *([workbook["hi"]] if "hi" in workbook else [])]:
        need(content["title"] and content["context"] and content["reading"] and len(content["questions"])>=2,f"{key} has missing practice content")
        need(all(q["prompt"] and q["feedback"] for q in content["questions"]),f"{key} has a question without feedback")

for qualification in ("4401","4402"):
    expected={f"{qualification} core {i}" for i in range(1,6)}|{f"{qualification} Injection Moulding {i}" for i in range(1,3)}
    need(refs[f"nz-nzqa-{qualification}"]==expected,f"NZQA {qualification} graduate profile map is incomplete")
expected_criteria={"252":(2,1,4,4),"255":(6,6,2),"260":(2,1,5),"9713":(4,2,3),"27926":(5,3),"29515":(2,2,3)}
guides=[guide for pack in packs.values() for guide in pack.get("practical",[])]
need(len(guides)==len(current) and {guide["unit"] for guide in guides}==current,"current NZQA Injection Moulding units require one guide each")
for guide in guides:
    unit=guide["unit"]
    expected=[f"{outcome}.{i}" for outcome,count in enumerate(expected_criteria[unit],1) for i in range(1,count+1)]
    need([item["ref"] for item in guide["criteria"]]==expected,f"NZQA {unit} criteria are incomplete or out of order")
    need(guide["entry"] and guide["range"] and all(item["observation"] for item in guide["criteria"]),f"NZQA {unit} evidence guide incomplete")
need(refs["uk-england-st1328"]=={f"{kind}{i}" for kind,count in [("K",43),("S",35),("B",6)] for i in range(1,count+1)},"ST1328 v1.0 must cover all 84 KSB identifiers")
methods=packs["uk-england-st1328"]["assessmentMethods"]
need([len(method["refs"]) for method in methods]==[32,28,24],"ST1328 observation, interview and test counts must match the published method mapping")
need(set().union(*(set(method["refs"]) for method in methods))==refs["uk-england-st1328"],"ST1328 methods must account for every KSB exactly once")
scot_refs=refs["uk-scotland-gp42-gp43"]
need(sum(ref.startswith("GP42 22 / ") for ref in scot_refs)==24 and sum(ref.startswith("GP43 23 / ") for ref in scot_refs)==34,"Scotland award unit catalogue drifted")
need({"603/2792/3","601/9049/8","601/5072/5"}<=refs["uk-northern-ireland-framework-348"],"NI framework 348 qualification references missing")
gqa_l2={"L/602/1611","D/602/1242","T/602/1442","T/602/1456","T/602/1487","L/504/9365","Y/504/9367",
    "D/602/1533","K/602/1521","D/602/1614","R/602/1545","Y/602/1546","M/602/1519","Y/602/1627"}
gqa_l3={"L/602/1611","A/602/1555","R/602/1559","A/602/1622","H/602/1548","K/602/1602","J/602/1607","J/602/1610"}
for pack_id,award,expected in [("uk-wales-framework","603/2760/1",gqa_l2),("uk-wales-framework","603/2792/3",gqa_l3),
                              ("uk-northern-ireland-framework-348","603/2792/3",gqa_l3)]:
    prefix=f"{award} / "
    found={ref.removeprefix(prefix) for ref in refs[pack_id] if ref.startswith(prefix)}
    need(found==expected,f"{pack_id} is missing registered GQA units for {award}")
india=packs["india-cipet-mo-im"]
expected_aos={f"{module} AO{i}" for module,count in [("CPC/N0214",18),("CPC/N0221",13),("CPC/N0222",9),
    ("CPC/N0411",21),("CPC/N0223",11),("CPC/N0219",8),("DGT/VSQ/N0101",7)] for i in range(1,count+1)}
need(refs["india-cipet-mo-im"]==expected_aos|{"Mandatory OJT 30 h","CPC/N0221 AO11 (repeated source row)"},"CIPET assessment outcome map is incomplete")
india_path=next(p for p in embedded["pathways"] if p["id"]=="india-cipet-mo-im")
need(sum(module["hours"] for module in india_path["modules"])==600 and "180 theory, 30 employability, 360 practical and 30" in india_path["duration"],"CIPET hours must include employability separately")
hours={"Theory":180,"Practical":360,"Employability":30,"On-the-job training":30}
for category,total in hours.items():
    need(sum(module["delivery"].get(category,0) for module in india_path["modules"])==total,f"CIPET {category} hours differ from the qualification")
need(all(sum(module["delivery"].values())==module["hours"] for module in india_path["modules"]),"CIPET per-module breakdown differs from published totals")
need(any("groups theory and employability into 210 hours" in note for note in india["delivery"]),"CIPET classroom subtotal must remain distinct from theory hours")
need(any("200 theory and 400 practical marks" in note and "260 and 340" in note and "Training Assessment Wing" in note for note in india["delivery"]),"CIPET conflicting mark totals require centre resolution")

# Book enrichment
esrc=ROOT/"data/book-evidence-enrichment-v2.json"
ert=ROOT/"src/domains/learning/book-data/book-evidence-enrichment-v2.json"
need(esrc.is_file() and ert.is_file(),"Book enrichment pair missing")
need(esrc.read_bytes()==ert.read_bytes(),"Book enrichment source/runtime pair drifted")
e=load(esrc)
need(e.get("schemaVersion")==1 and e.get("bookId")=="mouldmaster-book","Book enrichment identity mismatch")
need(re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+",str(e.get("release") or "")) is not None,"Book enrichment release identity invalid")
patches=e.get("chapterPatches",[])
need(len(patches)==10 and len({x["chapterId"] for x in patches})==10,"Book enrichment must cover 10 unique chapters")
need(sum(len(x.get("sections",[])) for x in patches)==14,"Book enrichment must contain 14 governed sections")
titles={s["title"] for p in patches for s in p.get("sections",[])}
for title in [
    "Command is not cavity state","Build evidence before naming the cause","Diagnose, restore and verify",
    "Mould condition changes through its life","What two intervention cases actually show",
    "Measured quality outcomes from distributed melt control","Total flow can recover while one cavity stays different",
    "Record maintenance so recovery can be proved","Recovery needs a trajectory, not one good part",
    "Pressure only means something when you know where it was measured","Similar warpage can come from different mechanisms",
    "Choose a robust region, not one optimum point","Quality records need evidence, not just completion",
    "Reading ISO 9001 marks on material packaging"
]:
    need(title in titles,f"Book enrichment section missing: {title}")
doc=next(x for x in patches if x["chapterId"]=="documentation")
need({"ISO-9001-2026","ISO-9000-2026","INTERTEK-CERT-MARK-2023"}.issubset(set(doc["sourceIds"])),"Book documentation patch lacks ISO/certification-mark anchors")
authority=e.get("authorityBoundary",{})
need(authority.get("productionUse")=="advisory-only" and authority.get("automaticMachineControl") is False and authority.get("universalSetpoints") is False,"Book enrichment authority boundary weakened")

# Release/runtime integration
version=load(ROOT/"version.json")
need(re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+",str(version.get("web_release") or "")) is not None,"governed readiness layers require a valid web release identity")
domain_manifest=load(ROOT/"runtime-domain-manifest.json")
need("./src/domains/governance/standards-readiness.js" in domain_manifest.get("assets",[]),"readiness runtime missing from domain manifest")
sw=text(ROOT/"service-worker.js")
for asset in [
    "./src/domains/governance/standards-readiness.js",
    "./src/domains/quality/data/quality-management-iso9001-v1.json",
    "./src/domains/learning/book-data/nzqa-education-readiness-v1.json",
    "./src/domains/learning/book-data/nzqa-provider-evidence-templates-v1.json",
    "./src/domains/learning/book-data/book-evidence-enrichment-v2.json",
    f"./{course_asset}",
]:
    need(asset in sw,f"offline release missing governed readiness asset: {asset}")

auth=load(ROOT/"data/book-publication-authorization-v1.json")
permit=auth.get("evidenceEnrichmentAuthorization",{})
need(permit.get("status")=="authorized" and permit.get("release")==e.get("release"),"Book enrichment authorization must bind the governed enrichment content release")
need(release_key(permit.get("release")) and release_key(version.get("web_release")) and release_key(permit.get("release"))<=release_key(version.get("web_release")),"Book enrichment authorization cannot target a future learner release")
need(permit.get("ledger")=="data/book-evidence-enrichment-v2.json","Book enrichment authorization ledger mismatch")
need(permit.get("sectionCount")==14 and permit.get("chapterCount")==10,"Book enrichment authorization counts mismatch")
need(permit.get("independentSmeStatus")=="hold","Book enrichment must preserve independent SME HOLD")
need("book-evidence-enrichment-v2.json" in auth.get("runtimeIntegrity",{}).get("gitBlobSha1ByFile",{}),"Book enrichment missing from exact-byte authorization")

sme=load(ROOT/"data/book-sme-review-v1.json")
need(sme.get("release")==e.get("release"),"Book SME contract must remain bound to the governed enrichment content release")
need(release_key(sme.get("release")) and release_key(version.get("web_release")) and release_key(sme.get("release"))<=release_key(version.get("web_release")),"Book SME evidence cannot target a future learner release")
need(set(sme.get("enrichmentChapterIds",[]))=={x["chapterId"] for x in patches},"Book SME contract does not cover enrichment chapters")
need(sme.get("status")=="hold","Book SME must remain HOLD")

print("PASS: governed Book enrichment, ISO 9001:2026 support and NZQA readiness are byte-paired and claim-bounded. Seven draft regional packs have valid learning links, published reference coverage and offline packaging.")
