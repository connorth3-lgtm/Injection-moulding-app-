"""Negative/positive regressions for the offline tracked-file hygiene gate."""
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools import repository_hygiene as hygiene  # noqa: E402


class RepositoryHygieneTests(unittest.TestCase):
    def test_case_collision_detected_on_case_sensitive_checkouts(self):
        findings = hygiene.path_findings([
            ("docs/Introduction.md", "100644"),
            ("docs/introduction.md", "100644"),
        ])
        self.assertTrue(any("case-colliding" in value for value in findings))

    def test_symlinks_and_nonportable_names_fail(self):
        findings = hygiene.path_findings([
            ("data/../secrets.json", "100644"),
            ("src/module.js", "120000"),
            ("qa/invalid. ", "100644"),
        ])
        self.assertTrue(any("unsafe or non-portable" in value for value in findings))
        self.assertTrue(any("unexpected tracked Git mode" in value for value in findings))

    def test_secrets_and_unreviewed_binary_rejected(self):
        findings = hygiene.path_findings([
            (".env.production", "100644"),
            ("tools/id_ed25519", "100644"),
            ("src/unreviewed-installer.exe", "100644"),
        ])
        self.assertEqual(len(findings), 3)

    def test_historically_audited_binary_is_not_deleted(self):
        self.assertEqual(hygiene.path_findings([
            ("MouldMasterAcademy.exe", "100644"),
            ("audit/source-freshness/2026-08-26-run-32916120936/source-freshness-reports.zip", "100644"),
        ]), [])

    def test_duplicate_runtime_json_must_match_canonical_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            original = root / "data" / "book-manifest-v1.json"
            mirror = root / "src" / "domains" / "learning" / "book-data" / "book-manifest-v1.json"
            original.parent.mkdir(parents=True)
            mirror.parent.mkdir(parents=True)
            original.write_text('{"schemaVersion":1}\n', encoding="utf-8")
            mirror.write_text(original.read_text(encoding="utf-8"), encoding="utf-8")
            names = [(original.relative_to(root).as_posix(), "100644"),
                     (mirror.relative_to(root).as_posix(), "100644")]
            self.assertEqual(hygiene.content_findings(root, names)[0], [])
            mirror.write_text('{"schemaVersion":2}\n', encoding="utf-8")
            problems, _ = hygiene.content_findings(root, names)
            self.assertTrue(any("canonical/published data drift" in value for value in problems))

    def test_renamed_regional_material_mirror_has_explicit_canonical_origin(self):
        deployed = "src/domains/learning/book-data/book-material-regional-evidence-v1.json"
        canonical = "data/asian-aus-nz-material-grade-extraction-wave2-v1.json"
        self.assertEqual(hygiene.mirror_pairs({deployed}), [(canonical, deployed)])
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            p = root / deployed
            c = root / canonical
            p.parent.mkdir(parents=True)
            c.parent.mkdir(parents=True)
            c.write_text('{"schemaVersion":1}', encoding="utf-8")
            p.write_text(c.read_text(encoding="utf-8"), encoding="utf-8")
            self.assertEqual(hygiene.content_findings(root, [(deployed, "100644"), (canonical, "100644")])[0], [])

    def test_runtime_mirror_cannot_orphan_its_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "src/domains/learning/book-data/manifest.json"
            path.parent.mkdir(parents=True)
            path.write_text("{}", encoding="utf-8")
            problems, _ = hygiene.content_findings(root, [
                ("src/domains/learning/book-data/manifest.json", "100644")
            ])
            self.assertTrue(any("has no canonical source" in value for value in problems))

    def test_qa_checks_all_json_and_rejects_malformed_documents(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "data/example.json"
            path.parent.mkdir()
            path.write_text("{broken", encoding="utf-8")
            problems, _ = hygiene.content_findings(root, [("data/example.json", "100644")])
            self.assertTrue(any("invalid tracked JSON" in value for value in problems))

    def test_workflow_actions_require_immutable_sha(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / ".github/workflows/ci.yml"
            path.parent.mkdir(parents=True)
            path.write_text("steps:\n  - uses: actions/checkout@v4\n", encoding="utf-8")
            entries = [(".github/workflows/ci.yml", "100644")]
            problems, _ = hygiene.content_findings(root, entries)
            self.assertTrue(any("unlocked GitHub Action" in value for value in problems))
            path.write_text("steps:\n  - uses: actions/checkout@" + "a" * 40 + "\n", encoding="utf-8")
            problems, _ = hygiene.content_findings(root, entries)
            self.assertEqual(problems, [])

    def test_private_key_block_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            file = root / "src/accidental.txt"
            file.parent.mkdir()
            file.write_text("-----BEGIN " + "PRIVATE KEY-----\nsensitive test fixture", encoding="utf-8")
            issues, _ = hygiene.content_findings(root, [("src/accidental.txt", "100644")])
            self.assertTrue(any("embedded private-key" in value for value in issues))

    def test_ignore_rules_fail_closed_on_missing_credentials_patterns(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".gitignore").write_text("/node_modules/\n", encoding="utf-8")
            missing = hygiene.ignore_findings(root, {".gitignore"})
            self.assertTrue(any(".env.*" in value for value in missing))
            all_rules = sorted(hygiene.REQUIRED_IGNORE_MARKERS)
            (root / ".gitignore").write_text("\n".join(all_rules) + "\n", encoding="utf-8")
            self.assertEqual(hygiene.ignore_findings(root, {".gitignore"}), [])
            self.assertTrue(hygiene.ignore_findings(root, set()))

    def test_index_parser_does_not_split_on_whitespace_in_file_path(self):
        output = (
            b"100644 " + b"a" * 40 + b" 0\tdocs/a file.md\0" +
            b"100755 " + b"b" * 40 + b" 0\ttools/ci.sh\0"
        )
        with mock.patch.object(hygiene.subprocess, "check_output", return_value=output):
            found = hygiene.tracked(Path("/anywhere"))
        self.assertEqual(found, [
            ("docs/a file.md", "100644"),
            ("tools/ci.sh", "100755"),
        ])


if __name__ == "__main__":
    unittest.main()
