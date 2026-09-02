# Research evidence engine validation notes

The runtime research evidence engine is intentionally deterministic and dependency-free. It uses promoted mechanism records and separates evidence quality from context applicability. It does not make network requests and does not store raw process data.

Manual smoke checks after loading the app should cover:

- `MM_RESEARCH_EVIDENCE.sourceCoverage()` returns 12 mechanisms, 12 promoted and at least 24 primary source links.
- `MM_RESEARCH_EVIDENCE.retrieve('cavity imbalance pressure fill')` ranks runner/gate/multicavity imbalance near the top.
- `MM_RESEARCH_EVIDENCE.retrieve('dryer moisture splay polycarbonate')` ranks moisture/drying/degradation near the top.
- `MM_RESEARCH_EVIDENCE.retrieve('hot runner heater duty valve gate cavity')` ranks hot-runner actual behaviour near the top.
- `verificationPlan(...)` always includes hypothesis, weakening evidence, alternative explanations, strongest next check, recovery criterion and safety boundary.
- Research UI does not expose assessment-answer support before grading.
- Local analytics and research-gap stores contain only bounded categorical fields.
