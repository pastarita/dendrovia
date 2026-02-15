```
+--------------------------------------------------------------+
|   feat/chronos-enrichment-zoo                                |
+--------------------------------------------------------------+
|                       ** MODERATE                             |
|                                                              |
|          pass  [PER-PALE]  pass                              |
|                mullet x 1                                    |
|                                                              |
|              [chronos] [shared]                              |
|                                                              |
|           files: 11 | +1008 / -211                           |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

Compact: ** [chronos][shared] mullet x1 pass/pass/pass/skip +1008/-211

## Summary

Adds the ability to point CHRONOS at any public GitHub repo by URL, clone it to a local cache, run the full 6-step parse pipeline, optionally enrich with DeepWiki AI documentation, update a persistent registry, and produce all structured artifacts downstream pillars consume. The pipeline produces complete valid output without DeepWiki — enrichment is purely additive.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| `runPipeline()` | Reusable 6-step pipeline extracted from `parse.ts` — git history, file inventory, AST parsing, hotspot detection, contributor profiling, assembly | Complete |
| `resolveRepo()` | Parses GitHub HTTPS/SSH/shorthand URLs and local paths; shallow-clones to `~/.chronos/repos/{owner}/{repo}`; refreshes cached repos | Complete |
| Clone caching | Skips clone if repo already cached; fetches + resets to remote HEAD when stale | Complete |
| `analyze` CLI | `bun run analyze <url> [output-dir] [--no-deepwiki] [--emit-events]` — full end-to-end analysis of any public repo | Complete |
| DeepWiki enrichment | Fetches AI-generated wiki structure and content via DeepWiki MCP (JSON-RPC); 24h cache at `~/.chronos/deepwiki/` | Complete |
| `enrichTopology()` | Merges DeepWiki data as optional `deepwiki` field on topology — absent when unavailable, never null | Complete |
| Registry | `~/.chronos/registry.json` tracks all analyzed repos with stats, head hash, timestamps, DeepWiki availability | Complete |
| `DeepWikiEnrichment` type | Added to `@dendrovia/shared` types and `TopologySchema` contract — optional field on `CodeTopology` | Complete |
| `parse.ts` backward compat | Slimmed to thin CLI wrapper calling `runPipeline()`; identical output, same invocation | Complete |

## Files Changed

```
packages/chronos/
  src/pipeline.ts                       — New: reusable 6-step pipeline (runPipeline, PipelineOptions, PipelineResult)
  src/resolver/RepoResolver.ts          — New: GitHub URL parsing, clone/cache, registry CRUD
  src/resolver/index.ts                 — New: re-exports from RepoResolver
  src/enrichment/DeepWikiFetcher.ts     — New: DeepWiki MCP fetcher with 24h file cache
  src/enrichment/TopologyEnricher.ts    — New: merge DeepWiki data into topology (additive)
  src/analyze.ts                        — New: CLI entry point for external repo analysis
  src/parse.ts                          — Slimmed to thin wrapper calling runPipeline()
  src/index.ts                          — Export pipeline, resolver, enrichment modules
  package.json                          — Add "analyze" script

packages/shared/
  src/types/index.ts                    — Add DeepWikiEnrichment interface; optional deepwiki? on CodeTopology
  src/contracts/index.ts                — Add optional deepwiki property to TopologySchema
```

## Commits

1. `8dbce97` feat(chronos,shared): enrich shared contracts and build Zoo playground
2. `eb0f0ec` feat(chronos): add GitHub URL analysis pipeline with DeepWiki enrichment

## Test Plan

- [x] `bun run parse` produces identical output (backward compatibility)
- [x] `bun test` — 159 tests pass, 0 failures
- [x] `bun run analyze .` — local path passthrough works
- [x] `bun run analyze facebook/react` — clones, parses 6996 files, writes to `~/.chronos/generated/facebook/react/`
- [x] `topology.json` has no `deepwiki` key when enrichment unavailable (absent, not null)
- [x] `~/.chronos/registry.json` updated after remote analysis
- [x] Second run of same repo hits cache (skip clone)
- [ ] `bun run analyze <repo-with-deepwiki>` — verify enrichment merges into topology
- [ ] ARCHITECTUS consumption — generated `tree` and `hotspots` match existing contract shapes
