---
name: pr-workflow
description: Generate a complete PR description with heraldic Coat of Arms classification
disable-model-invocation: true
---

# PR Workflow Skill

_Version: 1.0.0_
_Created: 2026-02-12_

## Purpose

Orchestrates the complete PR description creation workflow: gather metadata, classify, generate heraldry, write structured description file.

## Activation

- "create PR"
- "PR description"
- "prepare PR"
- "write PR"

## Pre-Flight: Mandatory Reading

| Document | Purpose |
|----------|---------|
| `.claude/rules/PR_WORKFLOW.rules.md` | Process rules and prohibitions |
| `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` | Content structure requirements |
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic taxonomy |
| `.claude/rules/DIAGRAM_CONVENTIONS.rules.md` | Mermaid accessibility |
| `.claude/rules/BRANCH_WORKFLOW.rules.md` | Branch/commit conventions |

## Workflow Steps

### Step 1: Gather Metadata

```bash
# Branch info
git branch --show-current
git log --oneline main..HEAD

# Diff statistics
git diff --stat main..HEAD
git diff --shortstat main..HEAD

# Commit details
git log --format='%h %s' main..HEAD
```

Record: branch name, commit count, file count, lines added/removed, commit messages.

### Step 2: Detect PR Type

| Condition | Route To |
|-----------|----------|
| Commits span 2+ distinct feature spaces | pr-heterogeneous SKILL |
| Maintenance/chore batch only | ROUTINE_OPERATIONS_TEMPLATE |
| Strategic/directional work | DIRECTION_ALIGNMENT_PR_TEMPLATE |
| Single coherent feature | Continue with this skill (standard) |

### Step 3: Classify Domains

Map changed files to domains using file path patterns:

| Pattern | Domain |
|---------|--------|
| `packages/chronos/` | chronos |
| `packages/imaginarium/` | imaginarium |
| `packages/architectus/`, `packages/dendrovia-engine/` | architectus |
| `packages/ludus/` | ludus |
| `packages/oculus/`, `packages/ui/` | oculus |
| `packages/operatus/`, `scripts/` | operatus |
| `packages/shared/` | shared |
| `apps/` | app |
| `docs/` | docs |
| `turbo.json`, `.github/`, config files | infra |

### Step 4: Generate Coat of Arms

Invoke the heraldry sub-policy (see `.claude/skills/heraldry/pr-heraldry/SKILL.md`):

1. Count commit types for charges
2. Compute magnitude score
3. Determine shield division from domain count
4. Assign tinctures
5. Select motto
6. Render at Level 1 (Synthetic)

### Step 5: Write PR Description

Output to `docs/pr-descriptions/PR_DESCRIPTION_{NAME}.md` using the canonical template below.

### Step 6: Push Description

Stage and commit the PR description file, push the branch.

---

## Canonical Template

```markdown
# PR: {Title}

## Coat of Arms

+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|          {supporter-L}  [SHIELD]  {supporter-R}              |
|                   {charge} x {count}                         |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+

**Compact:** {magnitude-sym} [{domain}] {charge}x{n} {supporters} +{a}/-{r}

---

## Summary

{1-3 sentences: what changed and why}

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| {name} | {what it does} | Complete |

## Architecture

{Mermaid diagrams for major/epic PRs — see DIAGRAM_CONVENTIONS.rules.md}

## Files Changed

{Tree structure with annotations}

## Commits

1. `{hash}` {conventional message}
2. ...

## Test Plan

- [ ] {verification step}
- [ ] {verification step}
```

---

## Specialized Templates

For non-standard PR types, route to:

| Type | Template Location |
|------|-------------------|
| Heterogeneous | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` |
| Routine Operations | `docs/pr-descriptions/templates/ROUTINE_OPERATIONS_TEMPLATE.md` |
| Direction Alignment | `docs/pr-descriptions/templates/DIRECTION_ALIGNMENT_PR_TEMPLATE.md` |
| Cross-Checkout Scan | `docs/pr-descriptions/templates/CROSS_CHECKOUT_SCAN_TEMPLATE.md` |

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.claude/rules/PR_WORKFLOW.rules.md` | Process rules |
| `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` | Content requirements |
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic taxonomy |
| `.claude/rules/DIAGRAM_CONVENTIONS.rules.md` | Diagram accessibility |
| `.claude/skills/heraldry/pr-heraldry/SKILL.md` | Heraldry generation |
| `.claude/skills/workflow/pr-heterogeneous/SKILL.md` | Multi-space PRs |
