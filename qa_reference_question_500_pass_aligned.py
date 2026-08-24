from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parent
ORIGINAL = Path.read_text
EXTENSION = ROOT / "reference-assessment-links.js"

if not EXTENSION.exists():
    raise AssertionError("reference-assessment-links.js missing")
extension_text = ORIGINAL(EXTENSION, encoding="utf-8")


def read_with_live_reference_extension(path, *args, **kwargs):
    value = ORIGINAL(path, *args, **kwargs)
    if Path(path).name == "reference-sources.js":
        return value + "\n" + extension_text
    return value


Path.read_text = read_with_live_reference_extension
try:
    runpy.run_path(str(ROOT / "qa_reference_question_500_pass.py"), run_name="__main__")
finally:
    Path.read_text = ORIGINAL
