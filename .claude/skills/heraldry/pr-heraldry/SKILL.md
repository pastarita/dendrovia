---
name: pr-heraldry
description: Generate a heraldic Coat of Arms for a PR — magnitude, domain, charges, supporters, motto
disable-model-invocation: true
---

# PR Heraldry Skill — Coat of Arms Generation

_Version: 1.0.0_
_Created: 2026-02-12_

## Purpose

Generate a complete heraldic Coat of Arms for a PR, classifying it by magnitude, domain, charges, and validation status.

## Activation

- "generate coat of arms"
- "PR heraldry"
- "classify this PR"

## Pre-Flight: Mandatory Reading

| Document | Purpose |
|----------|---------|
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Full taxonomy |
| `lib/heraldry/types.ts` | Type definitions |

## Workflow Steps

### Step 1: Gather Raw Data

```bash
git branch --show-current
git log --format='%h|%s' main..HEAD
git diff --stat main..HEAD
git diff --shortstat main..HEAD
```

### Step 2: Detect Domains

Map each changed file to a domain:

| File Pattern | Domain | Tincture |
|-------------|--------|----------|
| `packages/chronos/` | chronos | Amber `#c77b3f` |
| `packages/imaginarium/` | imaginarium | Purpure `#A855F7` |
| `packages/architectus/` | architectus | Azure `#3B82F6` |
| `packages/ludus/` | ludus | Gules `#EF4444` |
| `packages/oculus/`, `packages/ui/` | oculus | Vert `#22C55E` |
| `packages/operatus/`, `scripts/` | operatus | Sable `#1F2937` |
| `packages/shared/` | shared | Or `#FFD700` |
| `apps/` | app | Argent `#E5E7EB` |
| `docs/` | docs | Tenne `#CD853F` |
| Config/CI files | infra | Gules `#EF4444` |

### Step 3: Count Charges

Parse commit messages for conventional commit types:

```
feat → mullet (star)
fix → cross
refactor → bend (diagonal)
perf → eagle
docs → book
test → scales
chore → hammer
infra → tower
style → chevron
```

Count occurrences. Primary charge = most frequent.

For non-conventional commits, use keyword detection:
- Contains "fix", "bug", "patch" → cross
- Contains "add", "implement", "create" → mullet
- Contains "refactor", "restructure", "clean" → bend
- Contains "doc", "readme" → book
- Contains "test", "spec" → scales
- Default → hammer

### Step 4: Compute Magnitude

```
score = 0
score += min(ceil(fileCount / 5), 5)
score += min(ceil(lineCount / 200), 5)
score += min(domainCount, 4)
if breaking changes: score += 3
if new dependencies: score += 1
if migrations: score += 2
if schema changes: score += 2
```

| Score | Magnitude | Symbol |
|-------|-----------|--------|
| 0-4 | TRIVIAL | `+` |
| 5-8 | MINOR | `*` |
| 9-12 | MODERATE | `**` |
| 13-18 | MAJOR | `***` |
| 19+ | EPIC | `****` |

### Step 5: Determine Shield Division

| Domain Count | Division |
|-------------|----------|
| 1 | plain |
| 2 | per-pale |
| 3 | per-chevron |
| 4 | per-quarterly |
| 5-7 | party-per-cross |
| 8 | gyronny |

### Step 6: Check Supporters

Run validation commands (or note as skipped):

```bash
bun run check-types  # typecheck
bun run lint         # lint
bun test             # tests
bun run build        # build
```

Record: pass / FAIL / WARN / skip

### Step 7: Select Motto

1. Look up primary charge in motto table
2. Use magnitude to select register (formal/standard/casual)
3. If no match, use "Iterandum est"

### Step 8: Render Level 1 (Synthetic)

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|          {typecheck}  [{tincture}]  {lint}                   |
|                   {charge} x {count}                         |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+

Compact: {mag-sym} [{domain}] {charge}x{n} {supporters} +{a}/-{r}
```

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Full heraldic taxonomy |
| `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` | Where heraldry appears |
| `lib/heraldry/types.ts` | TypeScript type definitions |
| `lib/heraldry/analyzer.ts` | Automated analysis logic |
