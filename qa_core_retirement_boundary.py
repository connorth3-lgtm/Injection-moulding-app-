#!/usr/bin/env python3
"""Adversarial regression for generated-core shadow retirement boundaries.

Run: python3 qa_core_retirement_boundary.py
No learner runtime or frozen recovery bytes are changed.
"""
from tools.externalize_core_scripts import (
    CORE_SHADOWED_RETIRE_NAMES,
    retire_shadowed_core_declarations,
)


def fixture(inject=""):
    first = "".join(
        f"function {name}(){{\n  return 'shadowed-legacy';\n}}\n"
        + (inject if name == "renderDashboard" else "")
        for name in CORE_SHADOWED_RETIRE_NAMES
    )
    active = "".join(
        f"function {name}(){{\n  return 'active-current';\n}}\n"
        for name in CORE_SHADOWED_RETIRE_NAMES
    )
    return first + active


def main():
    clean = retire_shadowed_core_declarations(fixture())
    for name in CORE_SHADOWED_RETIRE_NAMES:
        assert clean.count(f"function {name}(") == 1, name
    assert "shadowed-legacy" not in clean
    assert clean.count("active-current") == len(CORE_SHADOWED_RETIRE_NAMES)

    for injected in (
        "const hiddenRecord = { safe: false };\n",
        "let alteredEvidence = 1;\n",
        "var inheritedResult = true;\n",
        "class HiddenState {}\n",
        "if (true) { hiddenState(); }\n",
    ):
        try:
            retire_shadowed_core_declarations(fixture(injected))
        except (ValueError, AssertionError, SystemExit):
            continue
        raise AssertionError(f"retirement silently removed unexpected code: {injected!r}")
    print("PASS: core retirement preserves active bodies and rejects injected top-level statements")


if __name__ == "__main__":
    main()
