# Rules Index — Trigger-to-Rule Mapping

**Purpose:** Master routing table. When a trigger phrase is detected, consult the listed rules before acting.

---

## Git & Version Control

| Trigger | Rules to Consult |
|---------|------------------|
| Creating a PR | `PR_WORKFLOW.rules.md`, `PR_HERALDRY_COMPLETENESS.rules.md`, `PR_DESCRIPTION_CONTENT.rules.md` |
| "make a PR" / "prepare PR" | Same as above |
| "heterogeneous PR" | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` |
| "PR description" / "write PR" | `PR_DESCRIPTION_CONTENT.rules.md`, `PR_HERALDRY_COMPLETENESS.rules.md` |
| Creating a branch | `BRANCH_WORKFLOW.rules.md` |
| Committing code | `BRANCH_WORKFLOW.rules.md` |

## Diagrams & Visualization

| Trigger | Rules to Consult |
|---------|------------------|
| Creating a Mermaid diagram | `DIAGRAM_CONVENTIONS.rules.md` |
| Adding architecture diagrams | `DIAGRAM_CONVENTIONS.rules.md` |
| "style" in Mermaid context | `DIAGRAM_CONVENTIONS.rules.md` (accessibility) |

## Heraldry & Classification

| Trigger | Rules to Consult |
|---------|------------------|
| "coat of arms" / "heraldry" | `PR_HERALDRY_COMPLETENESS.rules.md` |
| "generate coat of arms" | `.claude/skills/heraldry/pr-heraldry/SKILL.md` |
| Magnitude classification | `PR_HERALDRY_COMPLETENESS.rules.md` |

---

## Skills (Complex Workflows)

| Skill | Location | Purpose |
|-------|----------|---------|
| `pr-workflow` | `.claude/skills/workflow/pr/SKILL.md` | Full PR creation workflow |
| `pr-heraldry` | `.claude/skills/heraldry/pr-heraldry/SKILL.md` | Coat of Arms generation |
| `pr-heterogeneous` | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` | Multi-feature-space PRs |

---

## Cross-Reference Audit

Every rule file MUST be reachable from this index AND from at least one skill file.

| Rule | Referenced by Skills |
|------|---------------------|
| `PR_WORKFLOW.rules.md` | pr-workflow, pr-heterogeneous |
| `PR_DESCRIPTION_CONTENT.rules.md` | pr-workflow, pr-heterogeneous, pr-heraldry |
| `PR_HERALDRY_COMPLETENESS.rules.md` | pr-workflow, pr-heraldry |
| `DIAGRAM_CONVENTIONS.rules.md` | pr-workflow |
| `BRANCH_WORKFLOW.rules.md` | pr-workflow |

---

_Version: 1.0.0_
_Created: 2026-02-12_
