# Mobile cache coherence recovery — 25 August 2026

This hotfix follows the mobile mixed-cache startup report where an updated evidence layer could be paired with an older cached Material Behaviour Labs bundle.

The browser bootstrap now performs a one-time, release-keyed runtime coherence reset while online. It unregisters only service workers scoped to the current MouldMaster path, clears only `mouldmaster-static-*` caches, reloads once from the network, and then allows the current PWA shell to reinstall the offline copy.

Learner progress, notes, scores, certificates and other application data are not deleted by this reset. The strict 157/157 evidence approval release gate remains unchanged.
