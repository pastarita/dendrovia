# Heterogeneous PR Skill

_Version: 1.0.0_
_Created: 2026-02-12_

## Purpose

Handle PRs that span 2+ distinct feature spaces — producing a unified description with per-space Coat of Arms and divided shield.

## Activation

- "heterogeneous PR"
- "multi-space PR"
- Detected automatically when commits span 2+ distinct directory trees with different purposes

## Pre-Flight: Mandatory Reading

| Document | Purpose |
|----------|---------|
| `.claude/rules/PR_WORKFLOW.rules.md` | Process rules |
| `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` | Content requirements |
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic taxonomy (Section 9: Heterogeneous) |
| `.claude/skills/workflow/pr/SKILL.md` | Base PR workflow |

## Detection Criteria

A PR is heterogeneous when:

- Commits span 2+ distinct directory trees with different purposes
- Conventional commit scopes differ significantly
- The PR narrative requires multiple "Summary" explanations
- Feature spaces could reasonably be separate PRs

## Workflow Steps

### Step 1: Identify Feature Spaces

Group commits by their primary concern. Assign Roman numeral indices:

| Index | Convention |
|-------|-----------|
| I | First space (by commit order) |
| II | Second space |
| III | Third space |
| IV+ | Additional spaces |

### Step 2: Generate Unified Coat of Arms

Use a divided shield showing all spaces:

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|     +------------------+   +------------------+              |
|     | I {Space A}      |   | II {Space B}     |             |
|     | {charge}x{n}     |   | {charge}x{n}    |             |
|     | [{domain}]       |   | [{domain}]       |             |
|     +------------------+   +------------------+              |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+
```

### Step 3: Create Feature Space Index

| Index | Short Name | Full Name | Domain | Commits |
|-------|------------|-----------|--------|---------|
| I | {short} | {full} | {domain} | {n} |
| II | {short} | {full} | {domain} | {n} |

### Step 4: Document Cross-Space Dependencies

| From | To | Dependency Type |
|------|----|-----------------|
| I {Space A} | II {Space B} | Types shared |

### Step 5: Write Per-Space Sections

For each space:
- Per-space Coat of Arms (single domain, plain shield)
- Per-space Summary
- Per-space Features table

### Step 6: Unified Sections

After all per-space sections:
- Files Changed (all spaces, grouped by space)
- Commits (all spaces, chronological)
- Test Plan (unified checkboxes)

---

## Template

```markdown
# PR: {Unified Title}

## Coat of Arms (Unified)

{Divided shield with all spaces}

## Feature Space Index

| Index | Short Name | Full Name | Domain |
|-------|------------|-----------|--------|

## Cross-Space Dependencies

| From | To | Type |
|------|----|------|

---

## I. {Space A Name}

### Coat of Arms (Space I)

{Per-space heraldry}

### Summary

{Space-specific summary}

### Features

| Feature | Description | Status |
|---------|-------------|--------|

---

## II. {Space B Name}

### Coat of Arms (Space II)

{Per-space heraldry}

### Summary

{Space-specific summary}

### Features

| Feature | Description | Status |
|---------|-------------|--------|

---

## Files Changed (All Spaces)

{Unified tree}

## Commits (All Spaces)

1. ...

## Test Plan

- [ ] ...
```

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.claude/skills/workflow/pr/SKILL.md` | Base PR workflow |
| `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` | Content requirements |
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Heterogeneous shield division (Section 9) |
