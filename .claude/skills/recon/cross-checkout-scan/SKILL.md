# Cross-Checkout Recon Skill

_Version: 2.3.0_
_Updated: 2026-02-16_

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
| `--stash-deep` | Expand stash entries to show top files, packages, and full message |

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

### Step 1b: Stash Archaeology

For each checkout with stashes, gather per-stash metadata:

```bash
cd {checkout_path}

# List all stash entries with metadata
git stash list --format='%gd|%gs|%ci'

# For each stash entry (stash@{0}, stash@{1}, ...):
git stash show stash@{N} --stat --format=''
git stash show stash@{N} --shortstat
git log -1 --format='%D' $(git rev-parse stash@{N}^)  # source branch
```

Record per-stash:
- `ref`: stash ref (e.g., `stash@{0}`)
- `message`: stash message (e.g., "WIP on feat/quest-wiring: abc1234")
- `source_branch`: branch the stash was created on (parsed from message or parent)
- `age`: human-readable age
- `age_iso`: ISO timestamp
- `file_count`: number of files in stash
- `insertions`: lines added
- `deletions`: lines removed
- `significant_files`: top 5 files by change size (terse: path only)
- `packages_touched`: list of packages/ and apps/ subdirs affected

#### Stash Classification (4-tier)

| Tier | Condition | Icon |
|------|-----------|------|
| minor | file_count < 5 AND insertions < 50 | `~` |
| notable | file_count 5-20 OR insertions 50-200 | `*` |
| major | file_count 21-100 OR insertions 201-1000 | `**` |
| critical | file_count > 100 OR insertions > 1000 | `***` |

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
│  Stash:   {stash_count} entries / (empty)     ← when no stashes
│  Stash:   {stash_count} entries              ← when stashes present (see Stash Rendering below)
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

#### Stash Rendering

**Terse mode (default):** Each stash entry shown on one line with classification, stats, source branch, and age:

```
│  Stash:   2 entries
│    stash@{0} *** critical — 551 files +15872/-12177 (feat/quest-wiring) 3d ago
│    stash@{1} ~ minor — 2 files +8/-3 (main) 1w ago
```

**Deep mode (`--stash-deep`):** Each stash entry expanded with source, message, packages, and top files:

```
│  Stash:   stash@{0} *** critical — 551 files +15872/-12177
│    Source:   feat/quest-wiring (3 days ago)
│    Message:  WIP on feat/quest-wiring: abc1234 initial layout
│    Packages: apps/dendrovia-quest, apps/playground-*, packages/ui
│    Top files:
│      apps/dendrovia-quest/app/page.tsx (+639)
│      packages/ui/src/pillar-nav.tsx (+69)
│      packages/ui/src/domain-nav.tsx (+189)
│      packages/ui/src/domain-registry.tsx (+145)
│      apps/playground-architectus/app/layout.tsx (+85)
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
      "stashes": [],
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
    },
    "ARCHITECTUS": {
      "stash_count": 1,
      "stashes": [
        {
          "ref": "stash@{0}",
          "message": "WIP on feat/quest-wiring: abc1234",
          "source_branch": "feat/quest-wiring",
          "age": "3 days ago",
          "age_iso": "2026-02-13T10:00:00-08:00",
          "file_count": 551,
          "insertions": 15872,
          "deletions": 12177,
          "classification": "critical",
          "significant_files": ["apps/dendrovia-quest/app/page.tsx", "packages/ui/src/pillar-nav.tsx", "packages/ui/src/domain-nav.tsx", "packages/ui/src/domain-registry.tsx", "apps/playground-architectus/app/layout.tsx"],
          "packages_touched": ["apps/dendrovia-quest", "packages/ui"]
        }
      ]
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
| Any stash classified `major` or `critical` | `{PILLAR} has a {classification} stash ({file_count} files, {age}) — recover to branch immediately` |
| Any stash older than 7 days | `{PILLAR} stash@{N} is {age} old — likely orphaned, review and commit or drop` |
| Stash source_branch matches open PR | `{PILLAR} stash may belong to PR #{n} ({title}) — check for missing work` |
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

## UI Integration Spec: ReconProvider

This section defines the interface between the recon CLI skill and the playground HUD system. Recon produces a static JSON artifact; a React provider consumes it and surfaces status in every playground sidebar.

### Artifact: `generated/recon.json`

When `/recon --json` is invoked, Step 7 output SHOULD also be written to `generated/recon.json` at the monorepo root. This follows the same pattern as CHRONOS (`generated/topology.json`).

The file uses the JSON schema defined in Step 7. It is overwritten on each scan.

```
generated/
├── topology.json       ← CHRONOS output
├── commits.json        ← CHRONOS output
├── complexity.json     ← CHRONOS output
└── recon.json          ← Recon output (new)
```

### Provider: `packages/ui/src/recon/ReconProvider.tsx`

Follows the OculusProvider pattern (`packages/oculus/src/OculusProvider.tsx`):

```typescript
interface ReconContextValue {
  data: ReconData | null;
  loading: boolean;
  stale: boolean;           // true if file is >10 minutes old
  refresh: () => void;      // triggers re-read from disk
}

interface ReconData {
  timestamp: string;
  checkouts: Record<string, CheckoutStatus>;
  shared_drift: SharedDriftReport;
  maturity_scorecard: MaturityScorecard;
  branches: BranchInventory;
  recommendations: string[];
}

interface CheckoutStatus {
  branch: string;
  age: string;
  behind: number;
  modified_count: number;
  untracked_count: number;
  stash_count: number;
  stashes: StashEntry[];
  pr: { number: number; title: string; url: string } | null;
  aligned: boolean;
  shared_drift: { tree_hash: string; shared_behind_count: number; drift_group: string };
  maturity: { test_coverage: AxisScore; event_completeness: AxisScore; playground_density: AxisScore; pr_documentation: AxisScore; overall: number };
}

interface StashEntry {
  ref: string;
  message: string;
  source_branch: string;
  age: string;
  age_iso: string;
  file_count: number;
  insertions: number;
  deletions: number;
  classification: 'minor' | 'notable' | 'major' | 'critical';
  significant_files: string[];
  packages_touched: string[];
}

interface AxisScore {
  ratio: number;
  score: number;     // 0-3
  label: string;     // "gap" | "weak" | "adequate" | "strong"
}
```

**Loading strategy:**
- In dev mode: fetch from `/generated/recon.json` (static file served by Next.js)
- Poll interval: 60 seconds (recon data changes infrequently)
- Mark as `stale` if `timestamp` is >10 minutes old
- `refresh()` forces immediate re-fetch

### Hook: `packages/ui/src/recon/useReconStatus.ts`

```typescript
// Full recon data
function useReconStatus(): ReconContextValue;

// Single checkout (for pillar-specific views)
function useCheckoutStatus(pillar: string): CheckoutStatus | null;

// Current pillar (auto-detected from port or env)
function useCurrentPillarStatus(): CheckoutStatus | null;
```

**Pillar auto-detection:** Each playground runs on a known port (3011-3016). The hook reads `window.location.port` and maps to the pillar name:

| Port | Pillar |
|------|--------|
| 3010 | _(dendrovia-quest, shows all)_ |
| 3011 | ARCHITECTUS |
| 3012 | CHRONOS |
| 3013 | IMAGINARIUM |
| 3014 | LUDUS |
| 3015 | OCULUS |
| 3016 | OPERATUS |

### Component: `packages/ui/src/recon/ReconStatusBar.tsx`

A compact sidebar widget intended for the shared layout footer area. Renders differently based on context:

**In pillar playground (port 3011-3016):** Shows current pillar status only.

```
┌─────────────────────────────┐
│ 📜 CHRONOS                  │
│ feat/recon-skill-v2  ● PR#— │
│ shared: ●current  ↓0        │
│ ●●● ●○○ ●●● ●●●   2.5      │
│ [scan] [detail]             │
└─────────────────────────────┘
```

**In dendrovia-quest (port 3010):** Shows all 6 pillars as compact rows.

```
┌─────────────────────────────┐
│ Recon Status                │
│ 📜 CHR main         ●● 2.5 │
│ 🎨 IMG main         ●● 2.0 │
│ 🏛️ ARC refactor/..  ⚠ 2.0 │
│ 🎮 LUD main         ●● 2.0 │
│ 👁️ OCU main         ●● 2.0 │
│ 💾 OPE feat/..      ●● 2.0 │
│ [full scan]                 │
└─────────────────────────────┘
```

**Status indicators:**
- `●` green = branch fresh, shared current, aligned
- `●` yellow = minor drift or slightly behind
- `⚠` amber = misaligned, stale, or shared drift >3
- `●` red = critical (>20 behind, test coverage gap)

**Action triggers:**
- `[scan]` copies `/recon` to clipboard (user pastes into Claude Code)
- `[detail]` expands `ReconDetailPanel` as a modal overlay
- `[full scan]` copies `/recon --json` to clipboard

### Component: `packages/ui/src/recon/ReconDetailPanel.tsx`

Expandable modal showing the full dashboard sections:
- Shared Contract Drift groups
- Merge Conflict Predictions
- Pillar Maturity Scorecard (the table from Step 11)
- Recommendations list
- Branch Inventory summary

Uses the existing `Panel` and `OrnateFrame` primitives from `packages/oculus/src/components/primitives`.

### Sidebar Mount Point

**Pre-PillarNav refactor** (current state): Each playground's `layout.tsx` has an inline sidebar. The mount point is the footer `div` with `marginTop: "auto"`:

```tsx
<div style={{ marginTop: "auto" }}>
  <ReconStatusBar />                    {/* ← insert here */}
  <a href="http://localhost:3010">🌳 Dendrovia Quest</a>
</div>
```

**Post-PillarNav refactor** (after `refactor/pillar-nav-shared-component` merges): The shared `PillarNav` component owns the sidebar. `ReconStatusBar` is added once in `PillarNav`, available to all 7 apps automatically.

### Dependency Direction

```
generated/recon.json          (artifact, no package dependency)
       │
       ▼
packages/ui/src/recon/        (provider + components)
  imports: @dendrovia/shared  (for ReconData types)
  imports: packages/oculus    (for Panel, OrnateFrame primitives)
       │
       ▼
apps/playground-*/            (consumers via layout.tsx)
  imports: @dendrovia/ui      (for ReconProvider, ReconStatusBar)
```

No circular dependencies. Types flow from `shared` → `ui` → `apps`.

### Future: EventBus Integration

Once the recon HUD is interactive, it can participate in the EventBus system:

| Event | Direction | Payload |
|-------|-----------|---------|
| `recon:scan:requested` | UI → CLI | `{ pillar?: string, flags?: string[] }` |
| `recon:data:updated` | artifact → UI | `{ timestamp: string }` |
| `recon:drift:detected` | UI → OCULUS | `{ pillar: string, behind: number }` |

These events would be added to `GameEvents` in `packages/shared/src/events/EventBus.ts` when the UI components are built.

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.claude/rules/BRANCH_WORKFLOW.rules.md` | Branch naming conventions referenced for alignment checks |
| `packages/oculus/src/OculusProvider.tsx` | Provider pattern reference for ReconProvider |
| `packages/oculus/src/store/useOculusStore.ts` | Zustand store pattern reference |
| `packages/oculus/src/components/HUD.tsx` | HUD layout pattern (four-corner + center) |
| `packages/oculus/src/components/primitives/` | Panel, OrnateFrame components for ReconDetailPanel |
| `packages/ui/` | Target package for ReconProvider components |

---

_Version: 2.3.0_
_Updated: 2026-02-16_
