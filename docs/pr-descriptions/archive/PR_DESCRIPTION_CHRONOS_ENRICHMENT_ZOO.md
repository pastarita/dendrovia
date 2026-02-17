```
+--------------------------------------------------------------+
|   feat/chronos-enrichment-zoo                                |
+--------------------------------------------------------------+
|                        *** MAJOR                             |
|                                                              |
|          pass  [PER-CHEVRON]  pass                           |
|                 mullet x 1                                   |
|                                                              |
|           [shared] [chronos] [app]                           |
|                                                              |
|           files: 21 | +1710 / -20                            |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

Compact: *** [shared][chronos][app] mullet x1 pass/pass/pass/skip +1710/-20

## Summary

Enriches the shared contract surface so downstream pillars receive CHRONOS's full classification data (13 commit types, scope, breaking flag, confidence) instead of collapsed booleans, adds repository metadata and language distribution to topology output, and builds the Zoo playground as an 8-section catalog that validates every enriched field at request time.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Shared type enrichment | `CommitType`, `TemporalCoupling`, `RepositoryMetadata`, `LanguageDistribution`, `ContributorSummary` added to shared types | Complete |
| `ParsedCommit` extension | `type`, `scope`, `isBreaking`, `confidence` as backward-compatible optional fields | Complete |
| `CodeTopology` extension | `repository`, `languageDistribution`, `contributorSummary`, `temporalCouplings` optional fields | Complete |
| TopologySchema contract | JSON Schema updated with all enriched properties | Complete |
| `toCommit()` enrichment | Preserves full `ClassifiedCommit` data instead of collapsing to booleans | Complete |
| `extractRepositoryMetadata()` | New function fetching remote URL, branch info, counts via git CLI | Complete |
| `buildLanguageDistribution()` | Aggregates file counts and LOC by language with percentages | Complete |
| `buildContributorSummary()` | Tallies archetype distribution and identifies top contributor | Complete |
| Pipeline integration | `parse.ts` calls new extractors and passes metadata to `buildTopology()` | Complete |
| Zoo landing page | Section grid with 8 cards showing live counts from generated data | Complete |
| Overview page | Repository metadata cards, language distribution bars, contributor summary | Complete |
| Files page | Sortable/filterable table with complexity color-coding and language tags | Complete |
| Commits page | Timeline grouped by date with type/scope/confidence badges and breaking indicators | Complete |
| Hotspots page | Risk-ranked file list with churn x complexity visualization | Complete |
| Contributors page | NPC archetype cards with facet bar charts and type distributions | Complete |
| Couplings page | Temporal coupling pairs ranked by strength with progress bars | Complete |
| Complexity page | Per-function drill-down with expandable file rows | Complete |
| Contract page | Validates all enriched fields exist and are well-formed (ALL PASS) | Complete |

## Files Changed

```
packages/shared/
  src/types/index.ts                  — Add CommitType, TemporalCoupling, RepositoryMetadata, LanguageDistribution, ContributorSummary; extend ParsedCommit + CodeTopology
  src/contracts/index.ts              — Add enriched properties to TopologySchema

packages/chronos/
  src/parser/GitParser.ts             — Enrich toCommit(); add extractRepositoryMetadata()
  src/builder/TopologyBuilder.ts      — Add buildLanguageDistribution(), buildContributorSummary(); enrich buildTopology() output
  src/builder/ContributorProfiler.ts  — Import CommitType from shared
  src/analyzer/HotspotDetector.ts     — Import TemporalCoupling from shared
  src/parse.ts                        — Call extractRepositoryMetadata(); pass metadata to buildTopology()
  src/index.ts                        — Export new functions

apps/playground-chronos/
  lib/load-data.ts                    — Server-side JSON loader for generated/ artifacts
  app/zoos/page.tsx                   — Zoo landing page with 8 section cards + live counts
  app/zoos/overview/page.tsx          — Repository metadata + language distribution + contributor summary
  app/zoos/files/page.tsx             — File catalog server component
  app/zoos/files/files-table.tsx      — Client: sortable/filterable file table
  app/zoos/commits/page.tsx           — Commit timeline server component
  app/zoos/commits/commit-list.tsx    — Client: filterable commit list with type badges
  app/zoos/hotspots/page.tsx          — Risk-ranked hotspot list
  app/zoos/contributors/page.tsx      — NPC archetype cards with facets
  app/zoos/couplings/page.tsx         — Temporal coupling pairs
  app/zoos/complexity/page.tsx        — Complexity drill-down server component
  app/zoos/complexity/complexity-drilldown.tsx — Client: expandable function-level complexity
  app/zoos/contract/page.tsx          — Contract field validator
```

## Commits

1. `8dbce97` feat(chronos,shared): enrich shared contracts and build Zoo playground

## Test Plan

- [x] `bun test` in `packages/chronos/` — 159 tests pass, 0 failures
- [x] `bun run parse` regenerates enriched JSON with all new fields
- [x] TypeScript compilation clean (shared + chronos, excluding pre-existing Bun type stubs)
- [x] All 9 Zoo pages return HTTP 200 on `:3011`
- [x] `/zoos/contract` shows ALL PASS for enriched field validation
- [x] `/zoos/commits` renders type badges (bug-fix, feature, merge, docs, etc.)
- [x] `/zoos/overview` shows RepositoryMetadata + language distribution bars
- [x] Generated `topology.json` contains `repository` (object), `languageDistribution`, `contributorSummary`, `temporalCouplings`
- [x] All commits in generated JSON have `type`, `scope`, `isBreaking`, `confidence` fields
