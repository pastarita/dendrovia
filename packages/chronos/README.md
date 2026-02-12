# CHRONOS - The Archaeologist

> **Philosophy:** "The Broken Pottery Approach - We do not pretend to tell the objective history. We present artifacts. The player's quest is to piece them together."

## Responsibility

CHRONOS is responsible for **parsing any codebase** and extracting game-ready metadata:

1. **Git History Analysis** - Commits, authors, branches, merges
2. **AST Parsing** - Code structure, complexity, dependencies
3. **Metrics Calculation** - Hotspots, churn rate, risk scores
4. **Topology Generation** - File tree structure for world generation

## Output Artifacts

All outputs are written to `generated/` and consumed by IMAGINARIUM:

- `topology.json` - Complete codebase structure
- `commits.json` - Git history with classifications
- `hotspots.json` - High-churn/high-complexity areas
- `bugs.json` - Detected bug fixes (for quest generation)

## Cognitive Boundaries

**Dependencies:**
- ✅ None (first pillar in the build pipeline)

**Consumers:**
- IMAGINARIUM (reads topology to generate shaders)
- LUDUS (reads commits/bugs to generate quests)

**Interface:**
- Emits `GameEvents.PARSE_COMPLETE` when analysis finishes
- All data is static JSON (no runtime communication)

## Steering Heuristic

> "Reward the discovery of 'Why,' not just 'What.' A quest is completed not by killing the bug, but by finding the Commit Message that explains the fix."

## Key Features

### 1. Git History Parser

Uses `isomorphic-git` to extract:
- Commit messages (classified as bug/feature/refactor)
- Author contributions (for NPC generation)
- File change patterns (for hotspot detection)

### 2. AST Parser

Uses `ts-morph` (TypeScript) and `tree-sitter` (polyglot) to extract:
- Function/class definitions
- Cyclomatic complexity
- Import/export relationships
- Documentation comments

### 3. Squash Merge Handling

**Problem:** Squash merges erase granular history.

**Solution:** Treat them as "Boss Fights"
- A squash merge becomes a "Titan" enemy
- Requires multi-stage analysis (heuristics + LLM)
- Narrative: "The Records are Fragmented here"

### 4. Hotspot Detection

Combines:
- Churn rate (# of commits touching a file)
- Complexity (cyclomatic complexity)
- Size (lines of code)

Formula: `riskScore = churnRate * log(complexity) * sqrt(loc)`

## Usage

```bash
# Parse the current repository
bun run parse

# Parse a specific directory
bun run parse --path /path/to/repo

# Output to custom location
bun run parse --output ./custom-generated
```

## Implementation Status

- [ ] Git history parser (isomorphic-git)
- [ ] Commit classifier (bug/feature/refactor regex)
- [ ] AST parser (ts-morph for TypeScript)
- [ ] Complexity calculator
- [ ] Hotspot detector
- [ ] Topology generator
- [ ] Author/contributor extractor

## Future Enhancements

- [ ] LLM-based commit classification (fallback when regex fails)
- [ ] Polyglot support (tree-sitter for non-TS languages)
- [ ] Dependency graph analysis (for "quest chains")
- [ ] Code smell detection (for "corruption" areas)
