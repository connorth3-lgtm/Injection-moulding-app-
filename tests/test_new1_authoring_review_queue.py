"""Adversarial synthetic-only QA for New1 human-review discovery worklist."""
from copy import deepcopy
import csv
import io
import json
import unittest
from unittest.mock import patch

from tools.new1_authoring_review_queue import (
    DISCOVERY, HOLD, make_queue, write_csv,
)
from qa_new1_semantic_link_review import BOOK_RUNTIME_REQUIRED_FILES, book_runtime_fingerprint


def fixture():
    lessons = [
        {"id": i, "course": ((i - 1) % 12) + 1,
         "title": f"Fictional course lesson {i}"}
        for i in range(1, 121)
    ]
    courses = {i: f"Fictional course {i}" for i in range(1, 13)}
    chapters = [
        {"id": f"fictional-book-{i}", "title": f"Fictional module {i}",
         "state": "source-review", "sourceIds": ["QA-SOURCE-1"] if i % 2 else [],
         "claimClasses": ["fundamental", "diagnostic-hypothesis"] if i % 3 == 0 else ["fundamental"]}
        for i in range(1, 47)
    ]
    crosswalk = {
        "schemaVersion": 1,
        "crosswalkId": "mouldmaster-book-academy-crosswalk",
        "mappingLevel": "course-level semantic reinforcement",
        "courseNames": list(courses.values()),
        "chapterMappings": [
            {"chapterId": c["id"],
             "courseNames": [courses[((i - 1) % 12) + 1]],
             "themes": ["synthetic QA thematic overlap"]}
            for i, c in enumerate(chapters, 1)
        ],
    }
    contract = {
        "schemaVersion": 1,
        "webRelease": "2026.10.09.6",
        "status": "hold-exact-lesson-review",
        "mappingLevel": "authored exact-lesson to Book-module semantic match",
        "lessonAuthority": "MouldMaster_Core_App.html:window.MM_DATA.lessons",
        "bookAuthority": "data/book-manifest-v1.json",
        "courseCrosswalk": "data/book-curriculum-crosswalk-v1.json",
        "bookPublicationAuthority": "data/book-publication-authorization-v1.json",
        "approvedPublicLinks": False,
        "reviewedLinks": [],
        "policy": (
            "These are not reviewed exact-lesson links. Automated shape checks "
            "grant no public navigation entitlement; offline/deep-link review "
            "is pending."
        ),
    }
    return {
        "lessons": lessons, "courses": courses, "chapters": chapters,
        "crosswalk": crosswalk,
        "publication": {
            "status": "authorized", "version": "synthetic-book-v1",
            "runtimeIntegrity": {
                "algorithm": "git-blob-sha1",
                "gitBlobSha1ByFile": {
                    name: f"{i:040x}" for i, name in enumerate(
                        sorted(BOOK_RUNTIME_REQUIRED_FILES), start=1
                    )
                },
            },
        },
        "contract": contract,
        "release": "2026.10.09.6",
        "book_sme": {"status": "hold"},
        "source_seeds": [
            {"id": "QA-SOURCE-1", "url": "https://example.invalid/qa-only-source"}
        ],
        "claim_classes": ["fundamental", "diagnostic-hypothesis"],
    }


class WorklistTests(unittest.TestCase):
    def test_complete_queue_is_deterministic_and_unreviewed(self):
        args = fixture()
        first = make_queue(**args)
        second = make_queue(**deepcopy(args))
        self.assertEqual(first, second)
        self.assertEqual(len(first["lessons"]), 120)
        self.assertFalse(first["approvedPublicLinks"])
        self.assertEqual(first["exactLessonMatchesVerified"], 0)
        self.assertEqual(first["reviewStatus"], HOLD)
        lesson = first["lessons"][0]
        self.assertEqual(lesson["lessonId"], 1)
        self.assertEqual(lesson["canonicalCourseName"], "Fictional course 1")
        self.assertEqual(len(lesson["possibleBookModules"]), 4)
        chapter = lesson["possibleBookModules"][0]
        self.assertEqual(chapter["chapterId"], "fictional-book-1")
        self.assertEqual(chapter["discoveryBasis"], DISCOVERY)
        self.assertEqual(chapter["reviewStatus"], HOLD)
        self.assertEqual(chapter["manifestSourceState"], "source-review")
        self.assertEqual(chapter["declaredBookSourceIds"], ["QA-SOURCE-1"])
        self.assertEqual(chapter["declaredBookClaimClasses"], ["fundamental"])
        self.assertEqual(chapter["courseOverlapThemes"], ["synthetic QA thematic overlap"])
        self.assertIn("DECLARED ONLY", chapter["sourceDisclosureStatus"])
        self.assertTrue(chapter["chapterManifestFingerprint"].startswith("sha256:"))
        self.assertEqual(chapter["bookRuntimeFingerprint"], book_runtime_fingerprint(args["publication"]))
        self.assertEqual(first["bookRuntimeFingerprint"], chapter["bookRuntimeFingerprint"])
        # A serialized discovery worklist MUST NOT contain the record fields
        # that could misrepresent it as human approval or learner completion.
        encoded = json.dumps(first)
        for prohibited in (
            '"reviewer":', '"reviewEvidenceRef":', '"reviewedAt":',
            '"learnerCompletion":', '"competencyId":', '"score":',
            '"learningCreditGranted":', '"practiceActivityId":',
        ):
            self.assertNotIn(prohibited, encoded)
        self.assertEqual(args["contract"]["reviewedLinks"], [])

    def test_csv_is_plain_data_with_no_approved_columns(self):
        worklist = make_queue(**fixture())
        buffer = io.StringIO()
        with patch("sys.stdout", buffer):
            write_csv(worklist)
        reader = csv.DictReader(io.StringIO(buffer.getvalue()))
        rows = list(reader)
        self.assertGreater(len(rows), 120)
        self.assertEqual(rows[0]["lessonId"], "1")
        self.assertEqual(rows[0]["reviewStatus"], HOLD)
        self.assertEqual(rows[0]["declaredBookSourceIds"], "QA-SOURCE-1")
        self.assertEqual(rows[0]["declaredBookClaimClasses"], "fundamental")
        self.assertEqual(rows[0]["courseOverlapThemes"], "synthetic QA thematic overlap")
        self.assertIn("DECLARED ONLY", rows[0]["sourceDisclosureStatus"])
        self.assertEqual(rows[0]["bookRuntimeFingerprint"], worklist["bookRuntimeFingerprint"])
        self.assertNotIn("reviewer", reader.fieldnames)
        self.assertNotIn("learnerProgress", reader.fieldnames)

    def test_content_source_change_invalidates_review_fingerprint_without_manifest_edit(self):
        args = fixture()
        original = make_queue(**args)
        before = original["lessons"][0]["possibleBookModules"][0]
        changed = deepcopy(args)
        # The authoritative Book module metadata and version stay identical;
        # only an authored Book payload's published blob identity changes.
        blobs = changed["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"]
        blobs["book-authored-foundations-v1.json"] = "a" * 40
        new = make_queue(**changed)
        after = new["lessons"][0]["possibleBookModules"][0]
        self.assertEqual(after["chapterManifestFingerprint"], before["chapterManifestFingerprint"])
        self.assertEqual(after["bookPublicationRelease"], before["bookPublicationRelease"])
        self.assertNotEqual(after["bookRuntimeFingerprint"], before["bookRuntimeFingerprint"])
        self.assertEqual(changed["contract"]["reviewedLinks"], [])
        self.assertFalse(new["approvedPublicLinks"])

    def test_disclosed_sources_do_not_become_reviewed_when_manifest_changes(self):
        args = fixture()
        queue = make_queue(**args)
        before = queue["lessons"][0]["possibleBookModules"][0]
        changed = deepcopy(args)
        changed["chapters"][0]["sourceIds"] = []
        changed["chapters"][0]["claimClasses"] = ["diagnostic-hypothesis"]
        changed["crosswalk"]["chapterMappings"][0]["themes"] = [
            "alternative hypothetical cross-course rationale"
        ]
        refreshed = make_queue(**changed)
        after = refreshed["lessons"][0]["possibleBookModules"][0]
        self.assertNotEqual(
            before["chapterManifestFingerprint"], after["chapterManifestFingerprint"]
        )
        self.assertEqual(after["declaredBookSourceIds"], [])
        self.assertEqual(after["declaredBookClaimClasses"], ["diagnostic-hypothesis"])
        self.assertEqual(after["courseOverlapThemes"], [
            "alternative hypothetical cross-course rationale"
        ])
        self.assertEqual(after["reviewStatus"], HOLD)
        self.assertEqual(refreshed["exactLessonMatchesVerified"], 0)
        self.assertFalse(refreshed["approvedPublicLinks"])
        self.assertEqual(args["contract"]["reviewedLinks"], [])

    def test_csv_blocks_spreadsheet_formula_injection(self):
        args = fixture()
        args["lessons"][0]["title"] = "  =HYPERLINK(1,2)"
        args["chapters"][0]["title"] = "@SUM(1,2)"
        queue = make_queue(**args)
        buffer = io.StringIO()
        with patch("sys.stdout", buffer):
            write_csv(queue)
        rows = list(csv.DictReader(io.StringIO(buffer.getvalue())))
        self.assertEqual(rows[0]["lessonTitle"], "'  =HYPERLINK(1,2)")
        self.assertEqual(rows[0]["chapterTitle"], "'@SUM(1,2)")
        from tools.new1_authoring_review_queue import safe_spreadsheet_cell
        for prefix in ("=", "+", "-", "@"):
            self.assertEqual(safe_spreadsheet_cell(prefix + "1"), "'" + prefix + "1")
        self.assertEqual(safe_spreadsheet_cell("\t=SUM(1,1)"), "'\t=SUM(1,1)")
        self.assertEqual(safe_spreadsheet_cell("Normal lesson"), "Normal lesson")
        self.assertEqual(safe_spreadsheet_cell(12), 12)

    def test_runtime_book_and_course_changes_fail_closed(self):
        mutations = {
            "activate public navigation": lambda x: x["contract"].update(
                approvedPublicLinks=True
            ),
            "fake independent Book SME signoff": lambda x: x["book_sme"].update(
                status="validated"
            ),
            "unapproved Book publication": lambda x: x["publication"].update(
                status="hold"
            ),
            "missing Book runtime integrity": lambda x: x["publication"].pop(
                "runtimeIntegrity"
            ),
            "wrong Book runtime hash algorithm": lambda x: x["publication"][
                "runtimeIntegrity"].update(algorithm="sha256-unverified"),
            "missing authored Book payload source": lambda x: x["publication"][
                "runtimeIntegrity"]["gitBlobSha1ByFile"].pop(
                    "book-authored-foundations-v1.json"),
            "malformed authorized Book source hash": lambda x: x["publication"][
                "runtimeIntegrity"]["gitBlobSha1ByFile"].update(
                    {"book-authored-foundations-v1.json": "sha256:wrong"}),
            "incomplete lesson roster": lambda x: x["lessons"].pop(),
            "duplicate lesson IDs": lambda x: x["lessons"][-1].update(id=1),
            "incomplete chapter roster": lambda x: x["chapters"].pop(),
            "duplicate chapter IDs": lambda x: x["chapters"][-1].update(
                id="fictional-book-1"
            ),
            "tampered chapter mapping": lambda x: x["crosswalk"][
                "chapterMappings"
            ][0].update(chapterId="invented-book"),
            "malformed course registry": lambda x: x["crosswalk"][
                "courseNames"
            ].append("Invented course"),
            "unmapped lesson course": lambda x: x["lessons"][0].update(
                course=999
            ),
            "mislabelled mapping scope": lambda x: x["crosswalk"].update(
                mappingLevel="exact lesson equivalence"
            ),
            "outdated release": lambda x: x.update(
                release="2026.10.09.7"
            ),
            "invented chapter source": lambda x: x["chapters"][0].update(
                sourceIds=["QA-SOURCE-INVENTED"]
            ),
            "duplicate chapter source": lambda x: x["chapters"][0].update(
                sourceIds=["QA-SOURCE-1", "QA-SOURCE-1"]
            ),
            "missing source metadata": lambda x: x["chapters"][0].pop(
                "sourceIds"
            ),
            "unknown claim class": lambda x: x["chapters"][0].update(
                claimClasses=["approved-proven"]
            ),
            "missing claim classes": lambda x: x["chapters"][0].update(
                claimClasses=[]
            ),
            "missing thematic rationale": lambda x: x["crosswalk"][
                "chapterMappings"][0].pop("themes"),
            "duplicate thematic reason": lambda x: x["crosswalk"][
                "chapterMappings"][0].update(themes=["same", "same"]),
            "unqualified source seed URL": lambda x: x["source_seeds"][0].update(
                url="javascript:unsafe"
            ),
            "duplicate source seeds": lambda x: x["source_seeds"].append(
                deepcopy(x["source_seeds"][0])
            ),
        }
        for label, mutate in mutations.items():
            with self.subTest(label=label):
                args = fixture()
                mutate(args)
                with self.assertRaises(AssertionError):
                    make_queue(**args)

    def test_no_recommendation_for_out_of_scope_course(self):
        args = fixture()
        args["crosswalk"]["chapterMappings"] = [
            x for x in args["crosswalk"]["chapterMappings"]
        ]
        # Preserve the number of chapters, but remove one course's only
        # thematic relevance by substituting another valid known course.
        for row in args["crosswalk"]["chapterMappings"]:
            if "Fictional course 12" in row["courseNames"]:
                row["courseNames"] = ["Fictional course 1"]
        with self.assertRaisesRegex(AssertionError, "no course-level candidates"):
            make_queue(**args)


if __name__ == "__main__":
    unittest.main()
