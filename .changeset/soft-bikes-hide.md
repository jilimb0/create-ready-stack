---
"create-ready-stack": minor
---

feat: v0.3.0 product readiness — landing page, packaging, upgrade --apply, version centralization

- Landing page: replaced "grammY" references with "@tgwrapper/core", version badge synced to package.json
- Node engine lowered from >=26 to >=22 for broader adoption
- Packaging: removed stale templates/ from files, fixed .npmignore to include bin/, added LICENSE
- Upgrade command: --apply flag now actually overwrites selected files (was dry-run only)
- Version centralization: all generators import from src/config/versions.ts instead of hardcoded strings
- CI: updated workflows to Node 22, added GitHub Pages deployment for landing page, cleaned up release.yml
- Coverage: added tests for upgrade command (164 total, all passing, thresholds met)
