# MouldMaster 100-pass data and assessment audit

Audit date: 24 August 2026

This register defines the 100 deterministic checks enforced by `qa_100_pass.py`. The purpose is to catch structural, technical, safety, answer-key, runtime-delivery and shipping regressions. It does not turn assessment distractors into operating instructions and it does not create universal machine or resin setpoints.

## Passes 1–10 — Core data structure

1. Core training file exists.
2. `window.MM_DATA` parses as JSON.
3. Exactly 12 courses are present.
4. Exactly 120 core lessons are present.
5. Course IDs are unique.
6. Lesson IDs are unique.
7. Every course maps to 10 lesson IDs.
8. Every mapped lesson ID exists.
9. Every lesson points to its owning course ID.
10. Every lesson course name matches its owning course.

## Passes 11–20 — Lesson content integrity

11. Every lesson has a title.
12. Lesson titles are unique.
13. Every lesson has a summary.
14. Every lesson has an introduction.
15. Every lesson has at least three objectives.
16. Every lesson has at least four key points.
17. Every lesson has an exercise.
18. Every lesson duration is a positive bounded value.
19. The curriculum contains Beginner through Expert progression.
20. Lesson content contains no TODO/TBD/Lorem placeholder text.

## Passes 21–30 — Defect database

21. At least 12 core defect records exist.
22. Defect names are unique.
23. Every defect has a symptom.
24. Every defect has at least four mechanisms.
25. Every defect has at least four checks.
26. Mechanisms are unique within each defect.
27. Checks are unique within each defect.
28. Key defect families are present.
29. Defect guidance does not instruct guard/interlock bypass.
30. Every defect check is non-empty.

## Passes 31–40 — Scenario drills

31. Eight core scenarios exist.
32. Core scenario titles are unique.
33. Every core scenario has four choices.
34. Every core scenario correct index is valid.
35. Choices are unique within each core scenario.
36. Every core scenario has a rationale.
37. Every core scenario has four feedback messages.
38. Correct-choice feedback is non-empty.
39. The training upgrade contains all eight additional scenario titles.
40. Runtime audit metadata records 16 total scenario drills.

## Passes 41–60 — Technical exam questions

41. Technical exam levels are Beginner, Intermediate and Advanced.
42. Each technical level contains 10 items.
43. The technical bank contains 30 items total.
44. Every technical question has text.
45. Every technical item has exactly four options.
46. Every technical correct-answer index is valid.
47. Options are unique within each technical item.
48. Every technical item has an explanation/rationale.
49. Every technical item has a reference label.
50. Every technical item has four option-feedback entries.
51. Every supplied technical source URL uses HTTPS.
52. Technical items are not marked as regional safety-critical items.
53. Technical question text is globally unique.
54. Technical items do not use “all/none of the above”.
55. Every keyed technical answer is non-empty.
56. Correct-option feedback agrees with the item rationale.
57. Correct-answer keys use all four option positions across the bank.
58. No keyed technical answer instructs safeguard defeat/bypass.
59. Normalised option text remains unique within each technical item.
60. Every technical tuple contains all required assessment fields.

## Passes 61–80 — Regional safety/compliance questions

61. Regional banks are exactly UK, US and NZ.
62. Every region contains Beginner, Intermediate and Advanced levels.
63. Every region/level contains three items.
64. The regional bank contains 27 items total.
65. Every regional question has text.
66. Every regional item has four options.
67. Every regional correct-answer index is valid.
68. Options are unique within each regional item.
69. Every regional item has an explanation/rationale.
70. Every regional item has a reference label.
71. Every regional item has an HTTPS source URL.
72. Every regional item has four option-feedback entries.
73. Every regional item is safety-critical.
74. Regional question text is globally unique.
75. Correct-option feedback agrees with the item rationale.
76. UK content distinguishes Great Britain PUWER from Northern Ireland legislation.
77. US content includes OSHA-approved State Plan jurisdiction awareness.
78. US content covers hazardous-energy control and the narrow minor-servicing exception.
79. NZ content includes HSWA and AS/NZS 4024 machinery-safeguarding context.
80. NZ content explicitly separates the 2026 amendment from its 1 April 2027 commencement.

## Passes 81–90 — Runtime answer and certification integrity

81. The runtime question-bank version is pinned.
82. The runtime question-bank version matches `version.json`.
83. Technical questions are normalised by the audited runtime path.
84. Regional questions are normalised by the audited runtime path.
85. Option shuffling carries the correct-answer flag and re-finds its new index.
86. Compare-All combines UK, US and NZ regional banks.
87. Compare-All exposes 16 questions; a selected region exposes 10.
88. Compare-All exposes 9 regional safety items; a selected region exposes 3.
89. Passing requires at least 80% and zero wrong safety-critical regional answers.
90. Answer review displays the correct answer and explanatory feedback after grading.

## Passes 91–100 — Shipping and separation of concerns

91. The 100-pass runtime audit metadata asset exists and declares 100 passes.
92. This 100-pass audit register exists.
93. The shell loads the audit asset after training QA and before reference data.
94. The service worker caches the audit asset for offline use.
95. The Windows desktop package includes the audit asset.
96. The desktop integrity generator hashes the audit asset.
97. Release QA syntax-checks the audit asset and runs `qa_100_pass.py`.
98. Open Desktop Build triggers on the audit files and runs `qa_100_pass.py`.
99. Microsoft Store MSIX QA runs `qa_100_pass.py`.
100. Reference/research runtime layers do not modify `activeExam` or `#examQuestions`.

## Source-status verification performed on 24 August 2026

- ISO lists ISO 20430:2020 as published and stage 90.93, confirmed after the 2025 systematic review.
- BSI lists BS EN ISO 20430:2020 as **Current, Under Review**.
- The Plastics Industry Association lists ANSI/PLASTICS B151.1-2017 as a published standard and an active project being reviewed to align with ISO 20430.
- New Zealand Legislation records assent of the Health and Safety at Work Amendment Act 2026 on 9 July 2026 and commencement on **1 April 2027**; WorkSafe states the changes take effect on that date.

These status checks support the assessment source metadata. Applicable law, current regulator guidance, machine/tool documentation, supplier data and approved site procedures remain controlling for real work.
