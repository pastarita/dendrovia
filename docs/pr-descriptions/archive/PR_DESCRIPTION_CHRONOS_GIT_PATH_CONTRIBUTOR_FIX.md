```
+--------------------------------------------------------------+
|   feat/chronos-enrichment-zoo                                |
+--------------------------------------------------------------+
|                       * MINOR                                |
|                                                              |
|          pass  [PER-PALE]  pass                              |
|                cross x 2                                     |
|                                                              |
|              [chronos] [app]                                 |
|                                                              |
|           files: 6 | +54 / -8                                |
+--------------------------------------------------------------+
|   "Correctio fundamentum"                                    |
+--------------------------------------------------------------+
```

Compact: * [chronos][app] cross x2 pass/pass/pass/skip +54/-8

## Summary

Fixes two data quality issues found during pipeline review of `facebook/react`: git paths containing special characters (UTF-8 en-dashes) were ingested with shell-level quoting artifacts, creating phantom tree nodes; and contributor profiles were missing `uniqueFilesTouched` and `topCommitType` fields that downstream consumers expect.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Git path unquoting | `listFilesAtHead` now decodes git's quoted-path format (octal escapes for non-ASCII bytes) back to clean UTF-8 | Complete |
| Contributor `topCommitType` | New field surfacing the dominant commit type per contributor for LUDUS NPC generation | Complete |
| Rename `filesOwned` → `uniqueFilesTouched` | More descriptive field name; all references updated (profiler, tests, playground) | Complete |

## Files Changed

```
packages/chronos/
  src/parser/GitParser.ts                   — Add unquoteGitPath() to strip git's octal-escaped quoted paths
  src/builder/ContributorProfiler.ts        — Add topCommitType field; rename filesOwned → uniqueFilesTouched
  __tests__/contributor-profiler.test.ts     — Update test to use uniqueFilesTouched
  __tests__/topology-builder.test.ts         — Update mock to include topCommitType and uniqueFilesTouched

apps/playground-chronos/
  app/zoos/contributors/page.tsx             — Update display label from filesOwned to uniqueFilesTouched
```

## Commits

1. `eb0f0ec` feat(chronos): add GitHub URL analysis pipeline with DeepWiki enrichment
2. `9bea4bf` docs(pr): add PR description for CHRONOS analyze pipeline
3. *(pending)* fix(chronos): decode git quoted paths and add topCommitType to contributor profiles

## Test Plan

- [x] `bun test` — 773 tests pass, 0 failures
- [x] `bun run analyze facebook/react` — phantom `"compiler` node eliminated (606 → 599 dirs)
- [x] En-dash fixture file now correctly parsed under `compiler/` tree (4418 → 4419 parseable)
- [x] `contributors.json` — all profiles have `uniqueFilesTouched` (number) and `topCommitType` (string)
- [x] Old `filesOwned` field returns `undefined` (fully removed)
- [x] `bun run parse` backward compatibility preserved
