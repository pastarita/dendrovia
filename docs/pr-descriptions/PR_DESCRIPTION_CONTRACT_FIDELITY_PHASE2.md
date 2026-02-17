# PR: Contract Fidelity — Phase 2

## Coat of Arms

```
+--------------------------------------------------------------+
|   refactor/contract-fidelity-phase2                          |
+--------------------------------------------------------------+
|                     ** MODERATE **                            |
|                                                              |
|        pass  [SHIELD per-cross]  skip                        |
|                  bend x 2                                    |
|               mullet x 1                                     |
|                                                              |
|        [shared · chronos · ludus · imaginarium · app]        |
|                                                              |
|           files: 25 | +117 / -192                            |
+--------------------------------------------------------------+
|   "Refined through change"                                   |
+--------------------------------------------------------------+
```

**Compact:** ** [shared·chronos·ludus·imaginarium·app] bend×2 mullet×1 pass/skip/pass/skip +117/-192

---

## Summary

Phase 2 of contract fidelity: deduplicates ContributorProfile types that existed in both CHRONOS and shared, populates the hollow `ParsedFile.author` field via a git-log last-committer heuristic, and removes the deprecated `isBugFix`/`isFeature` boolean flags from the `ParsedCommit` contract in favor of the 13-value `CommitType` enum.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| ContributorProfile dedup | Delete 42 lines of local type defs in ContributorProfiler.ts, import from `@dendrovia/shared` | Complete |
| ParsedFile.author population | New `getFileAuthors()` in GitParser.ts batch-extracts last committer per file; pipeline Step 3.5 enriches all parsed files | Complete |
| isBugFix/isFeature removal | Consumers migrated to `commit.type === 'bug-fix'`/`'feature'`, `commitFlags()` deleted, boolean fields removed from type/Zod/JSON Schema | Complete |
| ParsedCommit.type promoted | `type` field changed from optional to required across type definition and Zod schema | Complete |

## Files Changed

```
packages/shared/
├── src/types/index.ts          — remove isBugFix/isFeature, promote type to required
├── src/schemas.ts              — remove booleans from TopologyCommitZod, type now required
└── src/contracts/index.ts      — remove from JSON Schema

packages/chronos/
├── src/builder/ContributorProfiler.ts  — delete local types, re-export from shared
├── src/builder/TopologyBuilder.ts      — import ContributorProfile from shared
├── src/parser/GitParser.ts             — add getFileAuthors(), remove commitFlags usage
├── src/classifier/CommitClassifier.ts  — delete commitFlags() function
├── src/pipeline.ts                     — add Step 3.5 file-author enrichment
├── src/index.ts                        — update exports
├── __tests__/commit-classifier.test.ts — delete commitFlags test block
├── __tests__/topology-builder.test.ts  — remove boolean flags from factory
├── __tests__/hotspot-detector.test.ts  — same
└── __tests__/contributor-profiler.test.ts — same

packages/ludus/
├── src/quest/QuestGenerator.ts         — isBugFix → type === 'bug-fix'
├── src/encounter/EncounterSystem.ts    — same pattern (3 sites)
├── tests/game-systems.test.ts          — migrate mock factories + assertions
└── tests/integration-e2e.test.ts       — same

packages/imaginarium/
├── src/pipeline/MockTopology.ts        — replace random booleans with type enum
├── __tests__/mycology/taxonomy.test.ts — update inline commit mocks
├── __tests__/mycology/lore.test.ts     — same
└── __tests__/mycology/network.test.ts  — same

apps/
├── playground-ludus/.../QuestGenerator.tsx    — remove boolean flags from mock data
├── playground-ludus/.../EncounterScanner.tsx  — same
├── playground-oculus/.../FrameSpecimen.tsx    — isFeature → type === 'feature'
└── playground-oculus/.../mock-upstream.ts     — remove boolean flags
```

## Commits

1. `2332246` refactor(chronos): deduplicate ContributorProfile types — import from @dendrovia/shared
2. `058e9ff` feat(chronos): populate ParsedFile.author via git log last-committer heuristic
3. `591c6aa` refactor(shared): remove deprecated isBugFix/isFeature from ParsedCommit contract

## Test Plan

- [x] `bunx tsc --noEmit -p packages/chronos/tsconfig.json` — no new type errors after N3
- [x] `bun test --filter chronos` — 192 pass after N3 and N4
- [x] `bunx tsc --noEmit -p packages/shared/tsconfig.json` — clean after N5
- [x] `bun test` full suite — 982 pass, 3 fail (all pre-existing: 2 in catalog.test.ts, 1 in integration-e2e archaeology)
- [x] `grep -r 'isBugFix\|isFeature' --include='*.ts' --include='*.tsx'` — zero remaining references
- [ ] `bun run parse` in packages/chronos — verify topology.json files[].author populated
- [ ] Verify generated JSON no longer contains isBugFix/isFeature fields
