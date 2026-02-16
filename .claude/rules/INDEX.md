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
| "land this" / "land it" / "let's land" | `.claude/skills/workflow/land/SKILL.md` |
| "recon" / "scan checkouts" / "branch inventory" | `.claude/skills/recon/cross-checkout-scan/SKILL.md` |

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
| `land` | `.claude/skills/workflow/land/SKILL.md` | Semantic commit segmentation + rebase + PR |
| `recon` | `.claude/skills/recon/cross-checkout-scan/SKILL.md` | Cross-checkout git state scanning |

---

## Castle Walls & Quality Gates

| Trigger | Rules to Consult |
|---------|------------------|
| Pre-commit hooks | `CASTLE_WALLS.rules.md` |
| Secret detection | `CASTLE_WALLS.rules.md` (Wall 1) |
| "expedition mode" / fast path | `CASTLE_WALLS.rules.md` (Expedition Mode) |
| Policy mode switching | `CASTLE_WALLS.rules.md` (Permission Policy Engine) |
| Certified exceptions | `CASTLE_WALLS.rules.md` (Secret Detection) |
| Pre-push / branch protection | `CASTLE_WALLS.rules.md`, `BRANCH_WORKFLOW.rules.md` |

---

## Cross-Reference Audit

Every rule file MUST be reachable from this index AND from at least one skill file.

| Rule | Referenced by Skills / Systems |
|------|-------------------------------|
| `PR_WORKFLOW.rules.md` | pr-workflow, pr-heterogeneous |
| `PR_DESCRIPTION_CONTENT.rules.md` | pr-workflow, pr-heterogeneous, pr-heraldry |
| `PR_HERALDRY_COMPLETENESS.rules.md` | pr-workflow, pr-heraldry |
| `DIAGRAM_CONVENTIONS.rules.md` | pr-workflow |
| `BRANCH_WORKFLOW.rules.md` | pr-workflow, land, recon, Castle Walls (pre-push) |
| `CASTLE_WALLS.rules.md` | Castle Walls hooks, policy engine |

---

_Version: 1.2.0_
_Updated: 2026-02-15_
