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
            {"id": "QA-SOURCE-1", "type": "standard",
             "issuer": "Fictional standards body",
             "title": "Fictional reviewer reference",
             "url": "https://example.invalid/qa-only-source",
             "scope": "Synthetic course review only; no safety acceptance",
             "checked": "2026-09-14", "currentState": "published-confirmed"}
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
        self.assertEqual(chapter["declaredBookSourceDetails"], [{
            "sourceId": "QA-SOURCE-1", "sourceType": "standard",
            "issuer": "Fictional standards body",
            "title": "Fictional reviewer reference",
            "url": "https://example.invalid/qa-only-source",
            "scope": "Synthetic course review only; no safety acceptance",
            "checked": "2026-09-14",
            "declaredState": "published-confirmed",
            "reviewStatus": "DECLARED SOURCE ONLY — NOT independently rechecked"
        }])
        self.assertIn("Synthetic course review only", chapter["declaredBookSourceReferences"])
        no_refs = first["lessons"][1]["possibleBookModules"][0]
        self.assertEqual(no_refs["declaredBookSourceIds"], [])
        self.assertEqual(no_refs["declaredBookSourceDetails"], [])
        self.assertEqual(no_refs["declaredBookSourceReferences"], "")
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
        self.assertIn("Fictional reviewer reference", rows[0]["declaredBookSourceReferences"])
        self.assertIn("https://example.invalid/qa-only-source", rows[0]["declaredBookSourceReferences"])
        self.assertIn("2026-09-14", rows[0]["declaredBookSourceReferences"])
        self.assertIn("Synthetic course review only", rows[0]["declaredBookSourceReferences"])
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
            "source seed omits applicability scope": lambda x: x[
                "source_seeds"][0].pop("scope"),
            "source seed fabricates reviewer approval": lambda x: x[
                "source_seeds"][0].update(approved=True),
            "source status wrongly marked approved": lambda x: x[
                "source_seeds"][0].update(currentState="reviewed-and-approved"),
            "source seed missing checked date": lambda x: x[
                "source_seeds"][0].pop("checked"),
            "source seed has invented checked date": lambda x: x[
                "source_seeds"][0].update(checked="2026-15-99"),
            "source seed permits URL credentials": lambda x: x[
                "source_seeds"][0].update(url="https://user:pass@example.invalid/ref"),
            "source seed URL with extra fragment": lambda x: x[
                "source_seeds"][0].update(url="https://example.invalid/ref#fraud"),
            "source seed title hides control character": lambda x: x[
                "source_seeds"][0].update(title="unsafe\nlink"),
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


class ReviewPacketTests(unittest.TestCase):
    def test_single_lesson_packet_keeps_discovery_and_hold(self):
        from tools.new1_review_packet import render_packet
        args = fixture()
        queue = make_queue(**args)
        before = deepcopy(queue)
        result = render_packet(queue, 1)
        self.assertEqual(result, render_packet(queue, 1))
        self.assertTrue(result.startswith("# NEW1 review preparation — lesson 1"))
        self.assertIn("UNREVIEWED / HUMAN-ONLY", result)
        self.assertIn("NO PUBLIC LINKS OR LEARNING CREDIT", result)
        self.assertIn("Fictional course lesson 1", result)
        self.assertIn("Candidate 1: Fictional module 1", result)
        self.assertIn("QA-SOURCE-1", result)
        self.assertIn("https://example.invalid/qa-only-source", result)
        self.assertIn("NOT independently checked", result)
        self.assertIn("actual *published Book passages*", result)
        self.assertNotIn("approved exact lesson match", result.lower())
        self.assertEqual(queue, before)
        self.assertEqual(args["contract"]["reviewedLinks"], [])

    def test_missing_references_are_not_invented(self):
        from tools.new1_review_packet import render_packet
        result = render_packet(make_queue(**fixture()), 2)
        self.assertIn("NONE DECLARED — human verification required", result)
        self.assertNotIn("https://example.invalid/qa-only-source", result)
        self.assertIn("UNREVIEWED", result)

    def test_untrusted_metadata_cannot_inject_headings_html_or_links(self):
        from tools.new1_review_packet import render_packet
        args = fixture()
        args["lessons"][0]["title"] = "QA\n# Approved <script>run()</script>"
        args["chapters"][0]["title"] = "[Evil](javascript:bad) | Candidate"
        queue = make_queue(**args)
        result = render_packet(queue, 1)
        self.assertNotIn("\n# Approved", result)
        self.assertNotIn("<script>", result)
        self.assertNotIn("[Evil](javascript:bad)", result)
        self.assertIn("&lt;script&gt;", result)
        self.assertIn("UNREVIEWED", result)

    def test_packet_rejects_forged_authority_and_ambiguous_id(self):
        from tools.new1_review_packet import render_packet
        queue = make_queue(**fixture())
        for bad_id in (0, 121, True, "1"):
            with self.subTest(lesson=bad_id), self.assertRaises(AssertionError):
                render_packet(queue, bad_id)
        mutations = (
            lambda q: q.update(approvedPublicLinks=True),
            lambda q: q.update(exactLessonMatchesVerified=1),
            lambda q: q["lessons"][1].update(lessonId=1),
            lambda q: q["lessons"][0]["possibleBookModules"][0].update(
                reviewStatus="REVIEWED"),
            lambda q: q["lessons"][0]["possibleBookModules"][0].update(
                reviewer="imaginary approval"),
            lambda q: q["lessons"][0]["possibleBookModules"][0][
                "declaredBookSourceDetails"][0].update(reviewStatus="verified"),
            lambda q: q["lessons"][0]["possibleBookModules"][0].update(
                bookRuntimeFingerprint="sha256:stale"),
        )
        for mutate in mutations:
            bad = deepcopy(queue)
            mutate(bad)
            with self.assertRaises(AssertionError):
                render_packet(bad, 1)


class SourcePinnedPassageInspectionTests(unittest.TestCase):
    """Every successful packet reads real bytes pinned to the publication inventory."""

    def pinned_fixture(self):
        import tempfile
        from pathlib import Path
        from tools.new1_passage_inspection import AUTHORED_BATCHES, git_blob_sha1

        data = fixture()
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        root = Path(scratch.name)
        (root / "data").mkdir()

        chapters = []
        for original in data["chapters"]:
            chapters.append({
                "id": original["id"],
                "state": "technical-review",
                "applicability": "Synthetic QA only, not applicable to production.",
                "sourceIds": ["QA-SOURCE-1"],
                "sections": [
                    {"title": "Mechanism", "text": "Fictional text <script>alert(1)</script>."},
                    {"title": "Validation", "text": "No verified exact lesson comparison."},
                ],
            })

        for filename, rows in zip(AUTHORED_BATCHES, [
            chapters[:5], chapters[5:14], chapters[14:]
        ], strict=True):
            payload = {
                "schema": 1,
                "bookId": "mouldmaster-book",
                "status": ("technical-review-drafts" if filename == AUTHORED_BATCHES[-1]
                           else "technical-review"),
                "chapters": rows,
            }
            raw = json.dumps(payload, indent=2, ensure_ascii=False).encode()
            (root / "data" / filename).write_bytes(raw)
            data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][
                filename
            ] = git_blob_sha1(raw)

        queue = make_queue(**data)
        return data, queue, root

    def render(self, data, queue, root, lesson_id=1,
               chapter_id="fictional-book-1"):
        from tools.new1_passage_inspection import render_passages
        return render_passages(
            queue, lesson_id, chapter_id,
            lessons=data["lessons"], manifest_chapters=data["chapters"],
            publication=data["publication"], root=root,
        )

    def test_complete_source_bound_text_and_inert_display(self):
        data, queue, root = self.pinned_fixture()
        before = deepcopy(queue)
        text = self.render(data, queue, root)
        self.assertIn("HUMAN-ONLY", text)
        self.assertIn("Full canonical lesson JSON", text)
        self.assertIn("Fictional course lesson 1", text)
        self.assertIn("Exact section SHA-256: sha256:", text)
        self.assertIn("data/book-authored-foundations-v1.json", text)
        self.assertIn("Fictional text &lt;script&gt;alert(1)&lt;/script&gt;", text)
        self.assertNotIn("<script>alert(1)</script>", text)
        self.assertIn("UNREVIEWED", text)
        self.assertIn("No exact link, reviewer record", text)
        self.assertEqual(text, self.render(data, queue, root))
        self.assertEqual(queue, before)
        self.assertEqual(data["contract"]["reviewedLinks"], [])
        self.assertFalse(queue["approvedPublicLinks"])

    def test_source_byte_drift_fails_closed_even_with_same_chapter_ids(self):
        data, queue, root = self.pinned_fixture()
        file = root / "data" / "book-authored-foundations-v1.json"
        original = file.read_bytes()
        file.write_bytes(original.replace(b"Fictional text", b"Modified text", 1))
        with self.assertRaisesRegex(AssertionError, "differ from published fingerprint"):
            self.render(data, queue, root)

    def test_other_batch_drift_and_missing_batch_fail_closed(self):
        data, queue, root = self.pinned_fixture()
        for name in ("book-chapters-materials-machine-v1.json",
                     "book-authored-remaining-v1.json"):
            path = root / "data" / name
            original = path.read_bytes()
            path.write_bytes(original + b"\n")
            with self.assertRaisesRegex(AssertionError, "differ from published fingerprint"):
                self.render(data, queue, root)
            path.write_bytes(original)
        missing = root / "data" / "book-authored-remaining-v1.json"
        missing.unlink()
        with self.assertRaisesRegex(AssertionError, "missing authored Book batch"):
            self.render(data, queue, root)

    def test_cannot_pair_non_candidate_or_spoof_lesson_or_public_approval(self):
        data, queue, root = self.pinned_fixture()
        with self.assertRaisesRegex(AssertionError, "not even a course-level"):
            self.render(data, queue, root, chapter_id="fictional-book-2")
        with self.assertRaises(AssertionError):
            self.render(data, queue, root, lesson_id=True)
        forged_lesson = deepcopy(data)
        forged_lesson["lessons"][0]["title"] = "Forged lesson"
        with self.assertRaisesRegex(AssertionError, "differs from discovery packet"):
            self.render(forged_lesson, queue, root)
        forged_queue = deepcopy(queue)
        forged_queue["approvedPublicLinks"] = True
        with self.assertRaises(AssertionError):
            self.render(data, forged_queue, root)
        forged_publication = deepcopy(data)
        forged_publication["publication"]["version"] = "future"
        with self.assertRaisesRegex(AssertionError, "differs from discovery packet"):
            self.render(forged_publication, queue, root)

    def test_duplicate_authored_chapter_and_missing_passage_rejected(self):
        data, queue, root = self.pinned_fixture()
        from tools.new1_passage_inspection import git_blob_sha1
        path = root / "data" / "book-authored-remaining-v1.json"
        doc = json.loads(path.read_text())
        doc["chapters"][0]["id"] = "fictional-book-1"
        raw = json.dumps(doc).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][
            path.name
        ] = git_blob_sha1(raw)
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "duplicate/invalid authored Book chapter"):
            self.render(data, queue, root)

        data, queue, root = self.pinned_fixture()
        path = root / "data" / "book-authored-foundations-v1.json"
        doc = json.loads(path.read_text())
        doc["chapters"][0]["sections"] = []
        raw = json.dumps(doc).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][
            path.name
        ] = git_blob_sha1(raw)
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "missing or malformed passages"):
            self.render(data, queue, root)


    def alignment_fixture(self):
        """Synthetic published registries with deliberate declaration differences."""
        from tools.new1_passage_inspection import git_blob_sha1
        data, _, root = self.pinned_fixture()
        registry = {
            "schema": 1, "bookId": "mouldmaster-book",
            "parts": [{"chapters": data["chapters"]}],
            "sourceSeeds": data["source_seeds"],
        }
        evidence = {"schema": 1, "bookId": "mouldmaster-book",
                    "sourceSeeds": [{
                        "id": "QA-SOURCE-2", "type": "standard",
                        "issuer": "Another fictional body",
                        "title": "Synthetic only",
                        "url": "https://example.invalid/source-two",
                        "scope": "Fictional QA evidence only",
                        "checked": "2026-09-14", "currentState": "active",
                    }]}
        for name, doc in (("book-manifest-v1.json", registry),
                          ("book-evidence-registry-v1.json", evidence)):
            raw = json.dumps(doc, ensure_ascii=False).encode()
            (root / "data" / name).write_bytes(raw)
            data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][name] = (
                git_blob_sha1(raw)
            )
        return data, make_queue(**data), root

    def test_source_alignment_reports_real_declaration_differences_not_approvals(self):
        from tools.new1_book_source_alignment import build_alignment, render_summary
        data, queue, root = self.alignment_fixture()
        original = deepcopy(queue)
        report = build_alignment(queue, data["publication"], root)
        self.assertEqual(report["totalBookModules"], 46)
        # Every even synthetic manifest chapter has no source ID; its actual
        # authored chapter has QA-SOURCE-1. No automatic manifest edits.
        self.assertEqual(report["modulesWithDeclarationDifferences"], 23)
        self.assertEqual(report["modulesWithIdenticalDeclaredSourceIds"], 23)
        self.assertEqual(report["exactLessonMatchesVerified"], 0)
        self.assertFalse(report["approvedPublicLinks"])
        self.assertEqual(report["chapters"][0]["alignment"],
                         "SAME IDS — claims still unreviewed")
        self.assertEqual(report["chapters"][1]["manifestSourceIds"], [])
        self.assertEqual(report["chapters"][1]["authoredOnlySourceIds"], ["QA-SOURCE-1"])
        self.assertEqual(report["chapters"][0]["sharedSourceIds"], ["QA-SOURCE-1"])
        self.assertIn("NOT independently rechecked",
                      report["chapters"][1]["sourceDeclarations"][0]["evidenceStatus"])
        self.assertIn("23", render_summary(report))
        self.assertIn("QA-SOURCE-1", render_summary(report, "fictional-book-2"))
        with self.assertRaisesRegex(AssertionError, "unknown canonical"):
            render_summary(report, "not-a-book-module")
        self.assertEqual(queue, original)
        self.assertEqual(data["contract"]["reviewedLinks"], [])

    def test_source_alignment_rejects_manifest_and_evidence_byte_drift(self):
        from tools.new1_book_source_alignment import build_alignment
        for name in ("book-manifest-v1.json", "book-evidence-registry-v1.json"):
            with self.subTest(file=name):
                data, queue, root = self.alignment_fixture()
                path = root / "data" / name
                path.write_bytes(path.read_bytes() + b"\n")
                with self.assertRaisesRegex(AssertionError, "do not match published"):
                    build_alignment(queue, data["publication"], root)

    def test_source_alignment_rejects_unknown_source_and_duplicate_registry_id(self):
        from tools.new1_book_source_alignment import build_alignment
        from tools.new1_passage_inspection import git_blob_sha1
        data, _, root = self.alignment_fixture()
        path = root / "data" / "book-authored-foundations-v1.json"
        obj = json.loads(path.read_bytes())
        obj["chapters"][0]["sourceIds"] = ["QA-SOURCE-UNDECLARED"]
        raw = json.dumps(obj).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][path.name] = (
            git_blob_sha1(raw)
        )
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "outside pinned governance registries"):
            build_alignment(queue, data["publication"], root)

        data, _, root = self.alignment_fixture()
        path = root / "data" / "book-evidence-registry-v1.json"
        obj = json.loads(path.read_bytes())
        obj["sourceSeeds"][0]["id"] = "QA-SOURCE-1"
        raw = json.dumps(obj).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][path.name] = (
            git_blob_sha1(raw)
        )
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "duplicate source ID"):
            build_alignment(queue, data["publication"], root)

    def test_source_alignment_rejects_forged_approval_and_unsafe_urls(self):
        from tools.new1_book_source_alignment import build_alignment
        from tools.new1_passage_inspection import git_blob_sha1
        data, queue, root = self.alignment_fixture()
        bad_queue = deepcopy(queue)
        bad_queue["approvedPublicLinks"] = True
        with self.assertRaises(AssertionError):
            build_alignment(bad_queue, data["publication"], root)
        data, _, root = self.alignment_fixture()
        path = root / "data" / "book-evidence-registry-v1.json"
        obj = json.loads(path.read_bytes())
        obj["sourceSeeds"][0]["url"] = "https://bad:password@example.invalid/"
        raw = json.dumps(obj).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][path.name] = (
            git_blob_sha1(raw)
        )
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "unsafe declared source URL"):
            build_alignment(queue, data["publication"], root)


    def test_unsubmitted_worksheet_is_source_bound_and_all_decisions_blank(self):
        from tools.new1_human_review_worksheet import render_worksheet
        data, queue, root = self.alignment_fixture()
        before = deepcopy(queue)
        args = {
            "lessons": data["lessons"],
            "manifest_chapters": data["chapters"],
            "publication": data["publication"], "root": root,
        }
        result = render_worksheet(queue, 1, "fictional-book-1", **args)
        self.assertEqual(result, render_worksheet(queue, 1, "fictional-book-1", **args))
        self.assertIn("UNSUBMITTED human review worksheet", result)
        self.assertIn("ALL DECISIONS BLANK", result)
        self.assertIn("UNDECIDED — NO HUMAN REVIEW RECORDED", result)
        self.assertIn("authored source", result.lower())
        self.assertIn("### Section 1: Mechanism", result)
        self.assertIn("### Section 2: Validation", result)
        self.assertEqual(result.count("Instructional fit decision: "), 2)
        self.assertIn("QA-SOURCE-1", result)
        self.assertIn("HUMAN INPUT REQUIRED", result)
        self.assertIn("Fictional course lesson 1", result)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", result)
        self.assertNotIn("<script>alert(1)</script>", result)
        self.assertIn("No reviewedLinks record", result)
        self.assertEqual(data["contract"]["reviewedLinks"], [])
        self.assertEqual(queue, before)
        self.assertFalse(queue["approvedPublicLinks"])

    def test_worksheet_rejects_tampered_sources_and_out_of_scope_pair(self):
        from tools.new1_human_review_worksheet import render_worksheet
        data, queue, root = self.alignment_fixture()
        args = {
            "lessons": data["lessons"],
            "manifest_chapters": data["chapters"],
            "publication": data["publication"], "root": root,
        }
        with self.assertRaisesRegex(AssertionError, "not even a course-level"):
            render_worksheet(queue, 1, "fictional-book-2", **args)
        with self.assertRaises(AssertionError):
            render_worksheet(queue, True, "fictional-book-1", **args)
        forged = deepcopy(queue)
        forged["approvedPublicLinks"] = True
        with self.assertRaises(AssertionError):
            render_worksheet(forged, 1, "fictional-book-1", **args)
        reg = root / "data" / "book-evidence-registry-v1.json"
        reg.write_bytes(reg.read_bytes() + b"\n")
        with self.assertRaisesRegex(AssertionError, "do not match published"):
            render_worksheet(queue, 1, "fictional-book-1", **args)

    def test_worksheet_rejects_fake_source_approval_despite_rehashed_registry(self):
        from tools.new1_book_source_alignment import build_alignment
        from tools.new1_human_review_worksheet import render_worksheet
        from tools.new1_passage_inspection import git_blob_sha1
        data, _, root = self.alignment_fixture()
        path = root / "data" / "book-evidence-registry-v1.json"
        obj = json.loads(path.read_bytes())
        obj["sourceSeeds"][0]["currentState"] = "approved"
        raw = json.dumps(obj).encode()
        path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][path.name] = git_blob_sha1(raw)
        queue = make_queue(**data)
        with self.assertRaisesRegex(AssertionError, "invented approval"):
            build_alignment(queue, data["publication"], root)
        with self.assertRaisesRegex(AssertionError, "invented approval"):
            render_worksheet(
                queue, 1, "fictional-book-1",
                lessons=data["lessons"], manifest_chapters=data["chapters"],
                publication=data["publication"], root=root,
            )

    def test_worksheet_rejects_autogenerated_semantic_decision_and_unsafe_section(self):
        from tools.new1_human_review_worksheet import render_worksheet
        from tools.new1_passage_inspection import git_blob_sha1
        data, _, root = self.alignment_fixture()
        book_path = root / "data" / "book-authored-foundations-v1.json"
        obj = json.loads(book_path.read_bytes())
        obj["chapters"][0]["sections"][0]["reviewerApproval"] = "yes"
        raw = json.dumps(obj).encode()
        book_path.write_bytes(raw)
        data["publication"]["runtimeIntegrity"]["gitBlobSha1ByFile"][book_path.name] = git_blob_sha1(raw)
        queue = make_queue(**data)
        # Actual authoring content with unexpected review fields is not a
        # semantic-link approval. The worksheet still requires blank decisions.
        result = render_worksheet(
            queue, 1, "fictional-book-1",
            lessons=data["lessons"], manifest_chapters=data["chapters"],
            publication=data["publication"], root=root,
        )
        self.assertIn("UNDECIDED", result)
        self.assertIn("ALL DECISIONS BLANK", result)
        self.assertNotIn("reviewerApproval", result)


if __name__ == "__main__":
    unittest.main()
