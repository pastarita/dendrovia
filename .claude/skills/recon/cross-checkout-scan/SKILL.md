# Cross-Checkout Recon Skill

_Version: 2.1.0_
_Created: 2026-02-15_

## Purpose

Performs cross-checkout git state reconnaissance across all six Dendrovia pillar checkouts. Gathers branch status, stash state, commit freshness, PR linkage, alignment metadata, shared contract drift, merge conflict predictions, and pillar maturity scores, then renders an actionable dashboard. Supports JSON output and automated stale branch cleanup.

## Activation

- "recon"
- "scan checkouts"
- "branch inventory"
- "checkout status"

## Arguments

| Argument | Effect |
|----------|--------|
| `--json` | Output structured JSON instead of ASCII dashboard |
| `--auto-clean` | List stale/orphaned branches with confirmation before deleting |
| `--checkout={name}` | Scan only the named checkout (e.g., `--checkout=CHRONOS`) |

## Pre-Flight: Mandatory Reading

| Document | Purpose |
|----------|---------|
| `.claude/rules/BRANCH_WORKFLOW.rules.md` | Branch naming conventions and scope rules |

---

## Configuration

### Checkout Paths

| Pillar | Path |
|--------|------|
| CHRONOS | `/Users/Patmac/denroot/CHRONOS/dendrovia` |
| IMAGINARIUM | `/Users/Patmac/denroot/IMAGINARIUM/dendrovia` |
| ARCHITECTUS | `/Users/Patmac/denroot/ARCHITECTUS/dendrovia` |
| LUDUS | `/Users/Patmac/denroot/LUDUS/dendrovia` |
| OCULUS | `/Users/Patmac/denroot/OCULUS/dendrovia` |
| OPERATUS | `/Users/Patmac/denroot/OPERATUS/dendrovia` |

### Pillar-to-Branch Alignment Prefixes

| Pillar | Expected Branch Keywords |
|--------|--------------------------|
| CHRONOS | `chronos`, `chrono` |
| IMAGINARIUM | `imaginarium`, `imaginar` |
| ARCHITECTUS | `architectus`, `architect`, `engine`, `dendrit` |
| LUDUS | `ludus`, `game`, `quest` |
| OCULUS | `oculus`, `ui`, `nav`, `visual` |
| OPERATUS | `operatus`, `infra`, `ops`, `deploy` |

### Thresholds

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Freshness (behind origin/main) | 20 commits | Balance between noise and actionable staleness |
| Auto-expand diff threshold | 10 files | Show individual files when diff is large |
| Drift detail expansion | 3 commits behind on shared/ | Tree hash by default; file-level diff when significantly behind |

### Event Contract Map

Expected event subscriptions per pillar (derived from `GameEvents` in `packages/shared/src/events/EventBus.ts`):

| Pillar | Expected Inbound Events |
|--------|------------------------|
| ARCHITECTUS | `encounter:triggered`, `damage:dealt` (from LUDUS) |
| LUDUS | `player:moved`, `branch:entered`, `node:clicked`, `collision:detected` (from ARCHITECTUS), `spell:cast`, `item:used` (from OCULUS) |
| OCULUS | `health:changed`, `mana:changed`, `quest:updated`, `combat:started`, `combat:ended`, `combat:turn:start`, `combat:turn:end`, `spell:resolved`, `status:applied`, `status:expired`, `experience:gained`, `level:up`, `loot:dropped` (from LUDUS) |
| OPERATUS | `parse:complete`, `topology:generated` (from CHRONOS), `shaders:compiled`, `palette:generated`, `mycology:cataloged` (from IMAGINARIUM) |
| CHRONOS | _(build-time only, no runtime inbound events)_ |
| IMAGINARIUM | `parse:complete`, `topology:generated` (from CHRONOS, build-time) |

### Maturity Scorecard Axes

| Axis | Metric | Computation |
|------|--------|-------------|
| Test Coverage | test files / source files | `find packages/{pillar} -name '*.test.*' -o -name '*.spec.*' \| wc -l` / `find packages/{pillar}/src -name '*.ts' -o -name '*.tsx' \| wc -l` |
| Event Completeness | subscribed events / expected inbound events | Grep for `subscribe`, `EventBus.on`, `useEvent` in pillar src, match against Event Contract Map |
| Playground Density | playground pages / source files | `find apps/playground-{pillar}/app -name 'page.tsx' \| wc -l` / source file count |
| PR Documentation | PR description count | `ls docs/pr-descriptions/ \| grep -i {pillar} \| wc -l` |

---

## Workflow Steps

### Step 1: Gather Checkout State

For each checkout path (or only the specified `--checkout`), run the following git commands:

```bash
# Navigate to checkout
cd {checkout_path}

# Current branch
git branch --show-current

# Working tree status (modified + untracked counts)
git status --porcelain

# Stash entries
git stash list

# Last commit age on current branch
git log -1 --format='%cr|%ci'

# Fetch latest remote state (quiet)
git fetch origin --quiet 2>/dev/null

# Commits behind origin/main
git rev-list --count HEAD..origin/main 2>/dev/null

# Diff stat against main
git diff --stat main..HEAD 2>/dev/null

# Untracked files list
git ls-files --others --exclude-standard
```

Record for each checkout:
- `branch`: current branch name
- `age`: human-readable last commit time (e.g., "2 hours ago")
- `age_iso`: ISO timestamp of last commit
- `behind`: integer count of commits behind origin/main
- `modified_count`: number of modified/staged files
- `untracked_count`: number of untracked files
- `untracked_files`: list of untracked file paths
- `stash_count`: number of stash entries
- `diff_files`: list of changed files vs main
- `diff_file_count`: number of files changed vs main

### Step 2: PR Linkage

Run a single GitHub CLI query to fetch all open PRs:

```bash
gh pr list --repo pastarita/dendrovia --state open --json headRefName,number,title,url 2>/dev/null
```

Then match each checkout's branch name against the `headRefName` field.

Record for each checkout:
- `pr_number`: PR number (or null)
- `pr_title`: PR title (or null)
- `pr_url`: PR URL (or null)

If `gh` is unavailable, note "gh CLI not available" and continue.

### Step 3: Branch-to-Pillar Alignment

For each checkout, check if the branch name contains any of the expected keywords for that pillar (from the alignment table above).

Rules:
- `main` and `master` are always considered aligned (universal branches)
- Branch keywords are matched case-insensitively against the full branch name
- A branch is "aligned" if it contains at least one expected keyword
- A branch is "misaligned" if it contains none of the expected keywords and is not `main`/`master`

Record for each checkout:
- `aligned`: boolean
- `alignment_note`: e.g., "on-pillar" or "branch doesn't mention {pillar}"

### Step 4: Classify Untracked Files

For each untracked file, categorize it:

| Pattern | Classification |
|---------|---------------|
| `generated/`, `dist/`, `node_modules/`, `.turbo/`, `*.log`, `*.tsbuildinfo` | Build artifact |
| `*.bak`, `*.orig`, `*.swp`, `*.swo`, `.DS_Store`, `Thumbs.db`, `*~` | Editor/OS leftover |
| Everything else | Potentially significant |

Record for each checkout:
- `untracked_artifacts`: count of build artifacts
- `untracked_leftovers`: count of editor/OS leftovers
- `untracked_significant`: list of potentially significant files

### Step 5: Stale Branch Detection

Run from any one checkout (branches are shared via remote):

```bash
# Merged remote branches (candidates for deletion)
git branch -r --merged origin/main | grep -v 'origin/main' | grep -v 'origin/HEAD'

# Local branches with no remote tracking
git branch -vv | grep -v '\[origin/' | grep -v '^\*'
```

Also check across all checkouts for local-only branches:

```bash
# In each checkout
git branch --list | grep -v '^\*' | while read branch; do
  git branch -r --list "origin/$branch" | grep -q . || echo "$branch (orphaned)"
done
```

Record:
- `stale_remotes`: list of merged remote branches
- `orphaned_locals`: list of local branches with no remote
- `active_features`: list of non-main, non-merged remote branches

### Step 6: Render Dashboard

If `--json` flag is NOT set, render an ASCII dashboard:

```
╔══════════════════════════════════════════════════════════════╗
║  DENDROVIA CROSS-CHECKOUT RECON — {date}                    ║
╠══════════════════════════════════════════════════════════════╣

┌─ {PILLAR} ───────────────────────────────────────────────────
│  Branch:  {branch}
│  Age:     {age}
│  Behind:  {behind} commits {freshness_note}
│  Status:  {modified_count} modified, {untracked_count} untracked
│  Stash:   {stash_count} entries / (empty)
│  PR:      {pr_info}
│  Align:   {alignment_icon} {alignment_note}
│
│  {expanded_diff if diff_file_count > 10}
│  {untracked_classification if untracked_significant > 0}
└──────────────────────────────────────────────────────────────
```

Repeat for all 6 checkouts (or the single `--checkout`).

Then append summary sections:

```
┌─ BRANCH INVENTORY ───────────────────────────────────────────
│  Stale remotes (merged):  {count}
│  Orphaned locals:         {count}
│  Active feature branches: {count}
└──────────────────────────────────────────────────────────────

┌─ RECOMMENDATIONS ────────────────────────────────────────────
│  • {actionable recommendation}
│  • ...
└──────────────────────────────────────────────────────────────
```

#### Freshness Notes

| Behind Count | Note |
|-------------|------|
| 0 | `(fresh)` |
| 1-19 | _(no note)_ |
| 20+ | `⚠ STALE — consider rebasing` |

#### Alignment Icons

| Status | Icon |
|--------|------|
| Aligned | `✓ on-pillar` |
| Misaligned | `⚠ branch doesn't mention {pillar}` |
| main/master | `✓ on main` |

#### Diff Expansion

When `diff_file_count > 10`, expand the list:

```
│  Diff:    {n} files changed (expanded below)
│    {file_path_1}
│    {file_path_2}
│    ...
```

When `diff_file_count <= 10`, show compact:

```
│  Diff:    {n} files changed
```

#### Untracked Classification

When significant untracked files exist:

```
│  Untracked:
│    {file} (build artifact)
│    {file} (potentially significant)
│    {file} (editor leftover)
```

### Step 7: JSON Output

When `--json` flag IS set, output the same data as structured JSON:

```json
{
  "timestamp": "2026-02-15T12:00:00Z",
  "checkouts": {
    "CHRONOS": {
      "path": "/Users/Patmac/denroot/CHRONOS/dendrovia",
      "branch": "main",
      "age": "2 hours ago",
      "age_iso": "2026-02-15T10:00:00-08:00",
      "behind": 0,
      "modified_count": 0,
      "untracked_count": 0,
      "stash_count": 0,
      "pr": null,
      "aligned": true,
      "alignment_note": "on main",
      "diff_file_count": 0,
      "diff_files": [],
      "untracked": {
        "artifacts": [],
        "leftovers": [],
        "significant": []
      },
      "shared_drift": {
        "tree_hash": "6a271a0c...",
        "shared_behind_count": 0,
        "shared_missing_commits": [],
        "drift_group": "current"
      },
      "maturity": {
        "test_coverage": { "ratio": 0.41, "score": 3, "label": "strong" },
        "event_completeness": { "ratio": 0.25, "score": 1, "label": "weak" },
        "playground_density": { "ratio": 0.94, "score": 3, "label": "strong" },
        "pr_documentation": { "count": 5, "score": 3, "label": "strong" },
        "overall": 2.5
      }
    }
  },
  "shared_drift": {
    "groups": [
      {
        "label": "current",
        "tree_hash": "6a271a0c...",
        "checkouts": ["LUDUS", "OCULUS", "OPERATUS"],
        "behind": 0
      },
      {
        "label": "1 behind",
        "tree_hash": "d1065985...",
        "checkouts": ["CHRONOS", "IMAGINARIUM"],
        "behind": 1,
        "missing_commits": ["10b584a feat(shared): add typed payload interfaces"]
      }
    ],
    "conflict_predictions": [
      {
        "file": "packages/shared/src/events/EventBus.ts",
        "branches": ["feat/operatus-event-contract-hardening", "refactor/pillar-nav-shared-component"],
        "note": "One branch adds events, the other removes onAny()"
      }
    ]
  },
  "maturity_scorecard": {
    "axes": ["test_coverage", "event_completeness", "playground_density", "pr_documentation"],
    "pillars": {
      "CHRONOS": { "test_coverage": 3, "event_completeness": 1, "playground_density": 3, "pr_documentation": 3, "overall": 2.5 }
    },
    "lowest_signals": [
      { "pillar": "OCULUS", "axis": "test_coverage", "detail": "3% (1/32 files)" }
    ]
  },
  "branches": {
    "stale_remotes": [],
    "orphaned_locals": [],
    "active_features": []
  },
  "recommendations": []
}
```

### Step 8: Auto-Clean Mode

When `--auto-clean` flag IS set, after rendering the dashboard (or JSON):

1. **List candidates** — Show all stale remote branches and orphaned local branches:
   ```
   ┌─ AUTO-CLEAN CANDIDATES ──────────────────────────────────────
   │  Stale remotes (merged into main):
   │    origin/feat/old-feature
   │    origin/fix/resolved-bug
   │
   │  Orphaned locals (no remote tracking):
   │    experiment/scratch
   └──────────────────────────────────────────────────────────────
   ```

2. **Ask for confirmation** — Present the list and ask the user to confirm before any deletion. This is a destructive operation and MUST have explicit consent.

3. **Delete confirmed branches:**
   ```bash
   # Remote branches
   git push origin --delete {branch_name}

   # Local branches (safe delete — will refuse if not merged)
   git branch -d {branch_name}
   ```

4. **Prune remotes** across all checkouts:
   ```bash
   # In each checkout
   cd {checkout_path} && git remote prune origin
   ```

5. **Show before/after summary:**
   ```
   ┌─ AUTO-CLEAN RESULTS ──────────────────────────────────────────
   │  Deleted remotes: {count}
   │  Deleted locals:  {count}
   │  Pruned remotes:  {count} checkouts
   └──────────────────────────────────────────────────────────────
   ```

### Step 9: Shared Contract Drift Detection

Compare the state of `packages/shared/` across all 6 checkouts to detect version skew.

**Phase 1 — Tree Hash Comparison (always runs):**

```bash
# For each checkout
cd {checkout_path}
git log -1 --format='%H %cr' -- packages/shared/
git rev-parse HEAD:packages/shared/ 2>/dev/null
```

Group checkouts by their `packages/shared/` tree hash. Identical hashes = identical shared code. Different hashes = drift.

Record:
- `shared_tree_hash`: git tree object hash for packages/shared/
- `shared_last_commit`: hash of the most recent commit touching shared/
- `shared_last_age`: human-readable age of that commit
- `drift_group`: group label (e.g., "current", "1 behind", "2 behind")

**Phase 2 — Commits Behind on Shared (always runs):**

```bash
# For each checkout, count shared/ commits missing vs origin/main
cd {checkout_path}
git log --oneline HEAD..origin/main -- packages/shared/ | wc -l
git log --oneline HEAD..origin/main -- packages/shared/
```

Record:
- `shared_behind_count`: number of commits behind on packages/shared/
- `shared_missing_commits`: list of commit subjects missing

**Phase 3 — File-Level Diff (conditional, only when shared_behind_count > 3):**

```bash
cd {checkout_path}
git diff HEAD..origin/main -- packages/shared/
```

When a checkout is >3 commits behind on shared/, auto-expand to show the actual file-level differences. This reveals whether the drift is additive (new types/events added) or breaking (signatures changed, exports removed).

**Dashboard rendering:**

```
┌─ SHARED CONTRACT DRIFT ─────────────────────────────────────
│
│  packages/shared/ tree comparison:
│
│  Group A (current):       LUDUS, OCULUS, OPERATUS
│    tree: 6a271a0c
│    latest: 10b584a feat(shared): add typed payload interfaces
│
│  Group B (1 behind):      CHRONOS, IMAGINARIUM
│    tree: d1065985
│    missing: 10b584a feat(shared): add typed payload interfaces
│
│  Group C (2 behind):      ARCHITECTUS
│    tree: 0ed3b34b
│    missing:
│      10b584a feat(shared): add typed payload interfaces
│      ff3761a feat(shared): add EventBus.onAny()
│    expanded diff:                              ← auto-expand (>3 behind)
│      events/EventBus.ts  +15 -0 (onAny method)
│      events/EventBus.ts  +22 -0 (OPERATUS payloads)
│
└──────────────────────────────────────────────────────────────
```

### Step 10: Merge Conflict Prediction

Scan all open remote branches for overlapping modifications to `packages/shared/`.

```bash
# List files changed in shared/ on each open branch vs main
for branch in $(git branch -r --no-merged origin/main | grep -v HEAD); do
  echo "=== $branch ==="
  git diff --name-only origin/main...$branch -- packages/shared/ 2>/dev/null
done
```

If two or more open branches modify the same file within `packages/shared/`, flag a potential merge conflict.

Record:
- `conflict_candidates`: list of `{ branchA, branchB, files: [...] }` tuples

**Dashboard rendering:**

```
┌─ MERGE CONFLICT PREDICTIONS ────────────────────────────────
│
│  ⚠ Potential conflict on packages/shared/src/events/EventBus.ts:
│    • feat/operatus-event-contract-hardening (adding events)
│    • refactor/pillar-nav-shared-component (removing onAny)
│
│  No other shared/ conflicts detected.
└──────────────────────────────────────────────────────────────
```

If no conflicts are predicted, show:

```
│  ✓ No shared/ merge conflicts predicted.
```

### Step 11: Pillar Maturity Scorecard

Compute four maturity axes for each pillar using the configuration in the Maturity Scorecard Axes table.

**Data gathering (run from any checkout on main or closest to main):**

```bash
# For each pillar in (chronos, imaginarium, architectus, ludus, oculus, operatus):

# Test coverage ratio
SRC_COUNT=$(find packages/{pillar}/src -name '*.ts' -o -name '*.tsx' 2>/dev/null | wc -l)
TEST_COUNT=$(find packages/{pillar} -name '*.test.*' -o -name '*.spec.*' 2>/dev/null | wc -l)

# Playground page density
PAGE_COUNT=$(find apps/playground-{pillar}/app -name 'page.tsx' 2>/dev/null | wc -l)

# Event completeness
EVENT_FILES=$(grep -rl 'subscribe\|EventBus\.on\|useEvent' packages/{pillar}/src/ --include='*.ts' --include='*.tsx' 2>/dev/null)
# Parse subscribed event names from those files, compare against Event Contract Map

# PR description coverage
PR_COUNT=$(ls docs/pr-descriptions/ | grep -i {pillar} | wc -l)
```

**Scoring:**

| Axis | Score Thresholds |
|------|-----------------|
| Test Coverage | `●●●` ≥ 30%, `●●○` ≥ 15%, `●○○` ≥ 5%, `○○○` < 5% |
| Event Completeness | `●●●` ≥ 80%, `●●○` ≥ 50%, `●○○` ≥ 25%, `○○○` < 25% |
| Playground Density | `●●●` ≥ 60%, `●●○` ≥ 30%, `●○○` ≥ 15%, `○○○` < 15% |
| PR Documentation | `●●●` ≥ 4 PRs, `●●○` ≥ 2, `●○○` = 1, `○○○` = 0 |

**Dashboard rendering:**

```
┌─ PILLAR MATURITY SCORECARD ──────────────────────────────────
│
│              Tests   Events  Playgnd  PRDocs   Overall
│  CHRONOS     ●●●     ●○○     ●●●      ●●●      ●●◐
│  IMAGINARIUM ●●●     ●●○     ●○○      ●○○      ●●○
│  ARCHITECTUS ●●○     ●●●     ●○○      ●○○      ●●○
│  LUDUS       ●●○     ●●○     ●●○      ●●●      ●●○
│  OCULUS      ○○○     ●●●     ●●●      ●●○      ●●○
│  OPERATUS    ●○○     ●●●     ●●●      ●●○      ●●○
│
│  Legend: ●●● strong  ●●○ adequate  ●○○ weak  ○○○ gap
│
│  Lowest signals:
│    • OCULUS test coverage: 3% (1/32 files) — critical gap
│    • IMAGINARIUM playground density: 17% (8/46 files)
│    • OPERATUS test coverage: 12% (3/26 files)
└──────────────────────────────────────────────────────────────
```

**Overall score** = average of the four axis scores (where `●●●`=3, `●●○`=2, `●○○`=1, `○○○`=0), rendered with half-fill `◐` for fractional values.

---

## Recommendations Engine

Generate actionable recommendations based on the gathered data:

| Condition | Recommendation |
|-----------|---------------|
| `behind >= 20` | `{PILLAR} is {n} commits behind — consider rebasing` |
| `aligned == false` | `{PILLAR} branch may be misaligned with pillar scope` |
| `stash_count > 0` | `{PILLAR} has {n} stashed changes — review or drop` |
| `untracked_significant > 0` | `{PILLAR} has {n} significant untracked files — stage or gitignore` |
| `stale_remotes > 3` | `{n} stale remote branches — consider running with --auto-clean` |
| `modified_count > 0` and no PR | `{PILLAR} has uncommitted work with no open PR` |
| `shared_behind_count > 0` | `{PILLAR} is {n} commits behind on packages/shared/ — pull to sync contracts` |
| `conflict_candidates` not empty | `⚠ Potential merge conflict: {branchA} and {branchB} both modify {file}` |
| Test coverage `○○○` | `{PILLAR} test coverage is critically low ({ratio}%) — add tests before expanding features` |
| Event completeness `○○○` | `{PILLAR} is missing expected event subscriptions — check Event Contract Map` |
| Playground density `○○○` | `{PILLAR} has low playground coverage ({ratio}%) — add interactive verification pages` |
| PR documentation `○○○` | `{PILLAR} has no PR descriptions — implementation history is undocumented` |
| Any axis `○○○` across 3+ pillars | `Systemic gap in {axis} — consider a dedicated hardening sprint` |

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.claude/rules/BRANCH_WORKFLOW.rules.md` | Branch naming conventions referenced for alignment checks |

---

_Version: 2.1.0_
_Created: 2026-02-15_
