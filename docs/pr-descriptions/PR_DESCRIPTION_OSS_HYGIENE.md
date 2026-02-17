# PR: Open Source Hygiene

## Coat of Arms

```
+--------------------------------------------------------------+
|   chore/oss-hygiene                                          |
+--------------------------------------------------------------+
|                    ** MODERATE                                |
|                                                              |
|          skip  [per-pale]  skip                              |
|          skip              skip                              |
|             hammer x3 / book x3                              |
|                                                              |
|              [docs | infra]                                  |
|                                                              |
|           files: 37 | +221 / -1                              |
+--------------------------------------------------------------+
|   "Foundation strengthened"                                  |
+--------------------------------------------------------------+
```

**Compact:** ** [docs|infra] hammer x3 / book x3 skip/skip/skip/skip +221/-1

---

## Summary

Adds the standard open source community and configuration files that were missing from the repository root. Also archives 31 older PR descriptions into a subfolder, fixes a duplicate field in package.json, and tracks a CONTRIBUTING.md that existed on disk but was never committed.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| PR description archive | Move 31 older PR descriptions into `docs/pr-descriptions/archive/` | Complete |
| CODE_OF_CONDUCT.md | Positively-framed conduct standards adapted from Contributor Covenant 2.1 | Complete |
| SECURITY.md | Private vulnerability reporting policy with response SLA | Complete |
| CONTRIBUTING.md | Track existing guide covering workflow, conventions, and pillar architecture | Complete |
| .editorconfig | 2-space indent, LF endings, UTF-8, trailing whitespace rules | Complete |
| .gitattributes | Line ending normalization, binary markers for images and bun.lockb | Complete |
| package.json cleanup | Remove duplicate `license` field, add `author` metadata | Complete |

## Files Changed

```
dendrovia/
  .editorconfig                              NEW   Editor formatting rules
  .gitattributes                             NEW   Line ending + binary detection
  CODE_OF_CONDUCT.md                         NEW   Community conduct standards
  CONTRIBUTING.md                            NEW*  Tracked (existed untracked)
  SECURITY.md                                NEW   Vulnerability reporting policy
  package.json                               MOD   Deduplicate license, add author
  docs/pr-descriptions/
    archive/
      PR_DESCRIPTION_ARCHITECTUS_...         MOV   31 files moved to archive/
      PR_DESCRIPTION_CHRONOS_...             MOV
      PR_DESCRIPTION_CROSS_PILLAR_...        MOV
      PR_DESCRIPTION_DENDRITE_...            MOV
      PR_DESCRIPTION_DEV_SERVER_...          MOV
      PR_DESCRIPTION_GENERATED_...           MOV
      PR_DESCRIPTION_IMAGINARIUM_...         MOV
      PR_DESCRIPTION_LUDUS_...               MOV
      PR_DESCRIPTION_MESH_...                MOV
      PR_DESCRIPTION_OCULUS_...              MOV
      PR_DESCRIPTION_OPERATUS_...            MOV
      PR_DESCRIPTION_ORNATE_...              MOV
      PR_DESCRIPTION_PLAYGROUND_...          MOV
      PR_DESCRIPTION_PRIMITIVES_...          MOV
      PR_DESCRIPTION_PROCEDURAL_...          MOV
      PR_DESCRIPTION_RECON_...               MOV
      PR_DESCRIPTION_SEGMENT_...             MOV
      PR_DESCRIPTION_SHARED_...              MOV
```

## Commits

1. `bebb519` chore(docs): archive 31 older PR descriptions into archive/ subfolder
2. `e034519` docs(community): add CODE_OF_CONDUCT.md
3. `0fb9181` docs(security): add SECURITY.md
4. `ae3ebfb` docs(community): track CONTRIBUTING.md
5. `0040b0c` chore(config): add .editorconfig for consistent formatting
6. `19c5102` chore(config): add .gitattributes for line ending normalization
7. `73120dd` fix(config): deduplicate license field and add author in package.json

## Test Plan

- [x] CODE_OF_CONDUCT.md uses only positive framing (no enumerated prohibited behaviors)
- [x] SECURITY.md contains reporting email, SLA, and supported versions
- [x] CONTRIBUTING.md matches existing project conventions (Bun, conventional commits, Castle Walls)
- [x] .editorconfig: 2-space indent, LF, UTF-8, markdown whitespace exemption
- [x] .gitattributes: `text=auto eol=lf`, bun.lockb marked binary
- [x] package.json: single `license` field, `author` present
- [ ] Verify no regressions in `bun install` after package.json change
- [ ] Confirm GitHub renders SECURITY.md in Security tab
- [ ] Confirm GitHub renders CODE_OF_CONDUCT.md in community profile
