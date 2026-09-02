# Main branch protection contract

`main` is the production source branch and must be protected by a GitHub ruleset or classic branch protection.

Required controls:

- no direct pushes to `main`; changes arrive through pull requests;
- required pull-request review before merge;
- dismiss stale approvals when new commits are pushed;
- require branches to be up to date before merge;
- require conversation resolution;
- block force pushes and branch deletion;
- apply the rule to repository administrators as well as contributors;
- require the repository's release-critical CI checks before merge.

Release-critical checks are the current equivalents of:

- MouldMaster Release QA
- MouldMaster Maturity Hardening v2
- Connected Process Data QA
- Research Utilisation QA
- Question Quality 50-Pass
- Mobile Browser QA
- Open Desktop Build
- Production Observability QA
- Real Site Pilot Preflight

The scheduled/manual `Main Branch Protection Audit` workflow queries GitHub's live branch and ruleset state and fails while `main` is not protected. It intentionally does not run on pull requests because protection is a repository-admin setting rather than a property of a candidate commit.

This file is a contract, not the protection itself. A repository administrator must enable the GitHub rule. The application and CI must never report the rule as enabled based only on this document.
