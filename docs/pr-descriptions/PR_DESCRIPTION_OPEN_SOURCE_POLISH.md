# PR: Open-Source Polish — MIT License, Metadata, Templates, URL Fixes

## Coat of Arms

```
+--------------------------------------------------------------+
|   chore/open-source-polish                                   |
+--------------------------------------------------------------+
|                      MINOR                                   |
|                                                              |
|          skip  [⚫ INFRA]  skip                               |
|                  🔨 hammer x 1                               |
|                                                              |
|           [infra • oculus • app • operatus]                  |
|                                                              |
|               files: 12 | +200 / -209                        |
+--------------------------------------------------------------+
|   "Tools of the trade"                                       |
+--------------------------------------------------------------+
```

**Compact:** `*` [infra • oculus • app • operatus] 🔨x1 skip/skip +200/-209

---

## Summary

This PR prepares Dendrovia for open-source release by switching to MIT license, adding comprehensive repository metadata, establishing pillar-aware issue templates, and fixing hardcoded localhost URLs across the UI packages. The changes improve contributor experience, enable proper local/production URL handling, and establish GitHub issue/PR workflows that integrate with the heraldry system.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| MIT License | Replaced Apache 2.0 with MIT (simplified from 202 to ~21 lines) | Complete |
| Repository Metadata | Added license, repository URLs, homepage, bugs tracker, and keywords to root package.json | Complete |
| Issue Templates | Created pillar-aware bug report and feature request templates with YAML frontmatter | Complete |
| PR Template | Added pull request template referencing heraldry Coat of Arms system | Complete |
| Dev URL Helper | New `devUrl()` utility returns localhost in dev, relative paths in production | Complete |
| UI Package Polish | Replaced 3 hardcoded localhost URLs in pillar-nav and domain-nav with `devUrl()` | Complete |
| Quest App URLs | Fixed PILLAR_SERVERS config and Hub page URLs to use local `devUrl()` helper | Complete |
| Multiplayer Fix | Corrected WebSocket default URL in MultiplayerClient | Complete |

## Files Changed

```
/
├── LICENSE ⚖️
│   └── Replaced Apache 2.0 with MIT license (text shrunk from 202 to ~21 lines)
├── package.json 📦
│   └── Added root metadata: license, repository, homepage, bugs, keywords
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml 🐛 [NEW]
│   │   │   └── Pillar-aware bug report with severity levels
│   │   ├── feature_request.yml ✨ [NEW]
│   │   │   └── Pillar-aware feature request with priority and complexity
│   │   └── config.yml ⚙️ [NEW]
│   │       └── Enables blank issues + discussions link
│   └── pull_request_template.md 📝 [NEW]
│       └── PR template referencing heraldry Coat of Arms system
├── packages/
│   ├── ui/
│   │   └── src/
│   │       ├── dev-urls.ts 🆕 [NEW]
│   │       │   └── Helper: `devUrl(port, path)` returns localhost in dev, relative in prod
│   │       ├── pillar-nav.tsx 🔧
│   │       │   └── Replaced 3 hardcoded localhost URLs with `devUrl()`
│   │       └── domain-nav.tsx 🔧
│   │           └── Replaced hardcoded localhost with `devUrl()`
│   └── operatus/
│       └── src/multiplayer/
│           └── MultiplayerClient.ts 🌐
│               └── Fixed WebSocket default URL
└── apps/
    └── dendrovia-quest/
        └── app/
            ├── hub/
            │   └── page.tsx 🏠
            │       └── Added local devUrl helper, fixed URLs
            └── page.tsx 🏡
                └── Fixed PILLAR_SERVERS localhost URL
```

## Commits

1. `7915e95` chore: open-source polish — MIT license, metadata, templates, URL fixes

## Test Plan

### License & Metadata
- [x] Verify LICENSE file contains MIT license text
- [x] Confirm package.json includes all repository metadata fields
- [x] Check keywords accurately describe the project

### Issue Templates
- [ ] Create a new issue on GitHub
- [ ] Verify bug_report.yml renders with pillar dropdown
- [ ] Verify feature_request.yml renders with pillar, priority, and complexity fields
- [ ] Confirm config.yml enables blank issues option

### PR Template
- [ ] Open a new pull request on GitHub
- [ ] Verify template loads with Coat of Arms section
- [ ] Confirm all mandatory sections are present

### Dev URL Helper
- [ ] Run `bun run dev` in packages/ui
- [ ] Verify pillar-nav links point to localhost:5173, etc. in dev mode
- [ ] Build for production: `bun run build`
- [ ] Verify built output uses relative paths instead of localhost

### Quest App URLs
- [ ] Run `bun run dev` in apps/dendrovia-quest
- [ ] Navigate to Hub page
- [ ] Verify domain navigation links work correctly
- [ ] Check PILLAR_SERVERS config on homepage

### Multiplayer
- [ ] Inspect MultiplayerClient.ts WebSocket initialization
- [ ] Verify default URL is no longer hardcoded to invalid localhost

---

## Notes

### Why MIT License?
The Apache 2.0 license (202 lines) was overly verbose for a project of this nature. MIT provides equivalent open-source protections with vastly improved readability and is the de facto standard for frontend/game projects.

### Issue Template Design
Templates use YAML frontmatter for structured data and pillar-aware dropdowns. This allows GitHub to categorize issues by affected pillar (CHRONOS, IMAGINARIUM, ARCHITECTUS, LUDUS, OCULUS, OPERATUS) and route them appropriately.

### Dev URL Pattern
The `devUrl()` helper solves the hardcoded localhost problem by detecting `process.env.NODE_ENV` and returning `http://localhost:{port}{path}` in development or just `{path}` in production. This pattern can be extended to other packages as needed.

---

_Created: 2026-02-16_
_Magnitude: MINOR (`*`)_
_Domains: infra • oculus • app • operatus_
