from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parent
def text(p): return (ROOT/p).read_text(encoding="utf-8")
N=0
def audit(ok,name):
    global N
    N+=1
    if not ok: raise AssertionError(f"100-pass audit #{N} failed: {name}")
def uniq(xs): return len(xs)==len(set(xs))
def norm(x): return re.sub(r"\s+"," ",str(x or "").strip().lower())

core=text("MouldMaster_Core_App.html")
mark="window.MM_DATA = "
D=None
if mark in core:
    try: D,_=json.JSONDecoder().raw_decode(core[core.index(mark)+len(mark):])
    except Exception: D=None
D=D or {}
C=D.get("courses",[]); L=D.get("lessons",[]); F=D.get("defects",[])
S=D.get("scenarios",[]); E=D.get("exams",{}); R=D.get("regionalQuestions",{})

# 1-10 core
audit((ROOT/"MouldMaster_Core_App.html").exists(),"core exists")
audit(bool(D),"MM_DATA parses")
audit(len(C)==12,"12 courses")
audit(len(L)==120,"120 lessons")
audit(uniq([x.get("id") for x in C]),"unique course ids")
audit(uniq([x.get("id") for x in L]),"unique lesson ids")
audit(all(len(x.get("lessonIds",[]))==10 for x in C),"10 lessons per course")
lids={x.get("id") for x in L}
audit(all(set(x.get("lessonIds",[]))<=lids for x in C),"mapped lesson ids exist")
cb={x.get("id"):x for x in C}
audit(all(x.get("course") in cb and x.get("id") in cb[x.get("course")].get("lessonIds",[]) for x in L),"lesson ownership")
audit(all(x.get("courseName")==cb[x.get("course")].get("name") for x in L),"course names match")

# 11-20 lessons
audit(all(str(x.get("title","")).strip() for x in L),"lesson titles present")
audit(uniq([norm(x.get("title")) for x in L]),"lesson titles unique")
audit(all(str(x.get("summary","")).strip() for x in L),"summaries present")
audit(all(str(x.get("intro","")).strip() for x in L),"intros present")
audit(all(len(x.get("objectives",[]))>=3 for x in L),"objectives present")
audit(all(len(x.get("keypoints",[]))>=4 for x in L),"key points present")
audit(all(str(x.get("exercise","")).strip() for x in L),"exercises present")
audit(all(isinstance(x.get("duration"),(int,float)) and 0<x["duration"]<=120 for x in L),"durations sane")
levels=" ".join(str(x.get("level","")) for x in C)
audit(all(k in levels for k in ["Beginner","Intermediate","Advanced","Very Advanced","Expert"]),"level progression")
audit(not re.search(r"\b(?:TODO|TBD|lorem ipsum)\b",json.dumps(L),re.I),"no lesson placeholders")

# 21-30 defects
audit(len(F)>=12,"defect records")
audit(uniq([norm(x.get("name")) for x in F]),"defect names unique")
audit(all(str(x.get("symptom","")).strip() for x in F),"symptoms present")
audit(all(len(x.get("mechanisms",[]))>=4 for x in F),"mechanisms present")
audit(all(len(x.get("checks",[]))>=4 for x in F),"checks present")
audit(all(uniq([norm(y) for y in x.get("mechanisms",[])]) for x in F),"mechanisms unique")
audit(all(uniq([norm(y) for y in x.get("checks",[])]) for x in F),"checks unique")
req={"short shot","flash","sink","splay","burn marks","weld line","jetting","warpage","brittleness","dimensional drift"}
audit(req<={norm(x.get("name")) for x in F},"key defect coverage")
audit(all(all(str(y).strip() for y in x.get("mechanisms",[])) for x in F),"mechanisms nonempty")
audit(all(all(str(y).strip() for y in x.get("checks",[])) for x in F),"checks nonempty")

# 31-40 scenarios
audit(len(S)==8,"8 core scenarios")
audit(uniq([norm(x.get("title")) for x in S]),"scenario titles unique")
audit(all(len(x.get("choices",[]))==4 for x in S),"four scenario choices")
audit(all(isinstance(x.get("correct"),int) and 0<=x["correct"]<4 for x in S),"scenario keys valid")
audit(all(uniq([norm(y) for y in x.get("choices",[])]) for x in S),"scenario choices unique")
audit(all(str(x.get("why","")).strip() for x in S),"scenario rationales")
audit(all(len(x.get("feedback",[]))==4 for x in S),"scenario feedback")
audit(all(str(x["feedback"][x["correct"]]).strip() for x in S),"correct scenario feedback")
upgrade=text("training-upgrade.js")
extras=["Fill time drifts but recipe does not","One cavity becomes light","Recovery time becomes erratic","Dimension shifts after water-line work","Part sticks after texture change","Cpk drops after gauge change","DOE result changes by run order","Pressure sensor disagrees with machine"]
audit(all(x in upgrade for x in extras),"8 added scenarios")
audit("scenarioDrills:40" in text("assessment-100-pass.js"),"40 scenario metadata")

def qt(q): return str(q[0]) if len(q)>0 else ""
def qo(q): return q[1] if len(q)>1 and isinstance(q[1],list) else []
def qc(q): return q[2] if len(q)>2 else None
def qe(q): return str(q[3]) if len(q)>3 else ""
def qr(q): return str(q[4]) if len(q)>4 else ""
def qu(q): return q[5] if len(q)>5 else None
def qf(q): return q[6] if len(q)>6 and isinstance(q[6],list) else []
def qk(q): return q[7] if len(q)>7 else None
T=[q for v in E.values() for q in v]

# 41-60 technical questions
audit(set(E)=={"Beginner","Intermediate","Advanced"},"technical levels")
audit(all(len(E[x])==10 for x in E),"10 technical per level")
audit(len(T)==30,"30 technical")
audit(all(qt(q).strip() for q in T),"technical question text")
audit(all(len(qo(q))==4 for q in T),"technical option count")
audit(all(isinstance(qc(q),int) and 0<=qc(q)<4 for q in T),"technical keys")
audit(all(uniq([norm(x) for x in qo(q)]) for q in T),"technical options unique")
audit(all(qe(q).strip() for q in T),"technical rationales")
audit(all(qr(q).strip() for q in T),"technical references")
audit(all(len(qf(q))==4 for q in T),"technical feedback count")
audit(all(not qu(q) or str(qu(q)).startswith("https://") for q in T),"technical urls https")
audit(all(qk(q) is False for q in T),"technical critical flags")
audit(uniq([norm(qt(q)) for q in T]),"technical questions unique")
audit(all("all of the above" not in norm(qt(q)+" "+" ".join(qo(q))) and "none of the above" not in norm(qt(q)+" "+" ".join(qo(q))) for q in T),"no all-none cue")
audit(all(str(qo(q)[qc(q)]).strip() for q in T),"technical keyed answer nonempty")
audit(all(norm(qf(q)[qc(q)])==norm(qe(q)) or norm(qe(q)) in norm(qf(q)[qc(q)]) or norm(qf(q)[qc(q)]) in norm(qe(q)) for q in T),"technical keyed feedback alignment")
audit(set(qc(q) for q in T)=={0,1,2,3},"technical key distribution")
audit(all(len({norm(x) for x in qo(q)})==4 for q in T),"technical normalized options unique")
audit(all(len(q)>=8 for q in T),"technical fields complete")
audit(all(len(qt(q))>=20 for q in T),"technical questions substantive")

RI=[q for rv in R.values() for lv in rv.values() for q in lv]
# 61-80 regional
audit(set(R)=={"UK","US","NZ"},"regions exact")
audit(all(set(R[x])=={"Beginner","Intermediate","Advanced"} for x in R),"regional levels exact")
audit(all(len(R[x][y])==3 for x in R for y in R[x]),"3 regional per level")
audit(len(RI)==27,"27 regional")
audit(all(qt(q).strip() for q in RI),"regional question text")
audit(all(len(qo(q))==4 for q in RI),"regional option count")
audit(all(isinstance(qc(q),int) and 0<=qc(q)<4 for q in RI),"regional keys")
audit(all(uniq([norm(x) for x in qo(q)]) for q in RI),"regional options unique")
audit(all(qe(q).strip() for q in RI),"regional rationales")
audit(all(qr(q).strip() for q in RI),"regional references")
audit(all(str(qu(q) or "").startswith("https://") for q in RI),"regional urls https")
audit(all(len(qf(q))==4 for q in RI),"regional feedback count")
audit(all(qk(q) is True for q in RI),"regional safety critical")
audit(uniq([norm(qt(q)) for q in RI]),"regional questions unique")
audit(all(norm(qf(q)[qc(q)])==norm(qe(q)) or norm(qe(q)) in norm(qf(q)[qc(q)]) or norm(qf(q)[qc(q)]) in norm(qe(q)) for q in RI),"regional keyed feedback alignment")
uk=json.dumps(R["UK"]); us=json.dumps(R["US"]); nz=json.dumps(R["NZ"])
audit("PUWER" in uk and "Northern Ireland" in uk,"UK jurisdiction distinction")
audit("State Plan" in us,"US State Plan coverage")
audit("1910.147" in us and ("minor-servicing" in us or "minor servicing" in us),"US hazardous-energy coverage")
audit("AS/NZS 4024" in nz and "HSWA" in nz,"NZ machinery context")
audit("Health and Safety at Work Amendment Act 2026" in nz and "1 April 2027" in nz,"NZ future-law date")

# 81-90 runtime answer integrity
V=json.loads(text("version.json"))
m=re.search(r"const BANK_VERSION='([^']+)'",upgrade)
audit(bool(m),"legacy bank version pinned")
audit(bool(m) and m.group(1)==V.get("legacy_review_id_version") and V.get("question_bank_version")=="2026.08.30.1","legacy review ID version and current question-bank revision are explicit")
audit("normaliseTechnicalQuestion10" in core,"technical normalizer")
audit("normaliseRegionalQuestion10" in core,"regional normalizer")
audit("correct:oldIndex===item.correct" in core and "correct:mixed.findIndex(x=>x.correct)" in core,"shuffle keeps answer key")
audit('["UK","US","NZ"]' in core,"Compare All region set")
audit('region==="ALL"?16:10' in core,"exam question counts")
audit('region==="ALL"?9:3' in core,"regional question counts")
audit("pct>=80&&criticalWrong===0" in core,"certificate competence gate")
audit("Correct answer:" in core and "answerReview" in core,"answer review present")

# 91-100 shipping
A=text("assessment-100-pass.js")
audit("passCount:100" in A and "totalExamQuestions:57" in A,"100-pass metadata asset")
reg=ROOT/"sources"/"ASSESSMENT_AND_DATA_100_PASS_AUDIT.md"
audit(reg.exists() and "100-pass" in reg.read_text(encoding="utf-8").lower(),"100-pass register")
idx=text("index.html")
audit('<script src="./assessment-100-pass.js">' in idx and idx.index("training-qa-fix.js")<idx.index("assessment-100-pass.js")<idx.index("source-library.js"),"shell audit load order")
audit("'./assessment-100-pass.js'" in text("service-worker.js"),"offline audit asset")
P=json.loads(text("desktop/electron/package.json"))
paths={x.get("from") for x in P["build"]["extraResources"] if isinstance(x,dict)}
audit("../../assessment-100-pass.js" in paths,"desktop audit asset")
audit("'assessment-100-pass.js'" in text("desktop/electron/scripts/generate-integrity.cjs"),"integrity audit asset")
qy=text(".github/workflows/qa.yml")
audit("node --check assessment-100-pass.js" in qy and "python qa_100_pass.py" in qy,"release workflow audit")
ow=text(".github/workflows/open-desktop-build.yml")
audit("- 'assessment-100-pass.js'" in ow and "- 'qa_100_pass.py'" in ow and "python qa_100_pass.py" in ow,"desktop workflow audit")
audit("python qa_100_pass.py" in text(".github/workflows/microsoft-store-msix.yml"),"store workflow audit")
refs=["source-library.js","reference-data.js","reference-deep-dive.js","reference-research-extension.js","reference-20x-extension.js","reference-sources.js"]
audit(all("activeExam" not in text(x) and "#examQuestions" not in text(x) for x in refs),"references isolated from exams")

if N!=100: raise AssertionError(f"audit definition error: {N} checks")
print("MouldMaster 100-pass data and assessment audit passed (100/100; 57 exam questions; 40 scenarios)")