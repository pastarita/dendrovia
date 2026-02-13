# PR Workflow Rules

**Trigger:** When creating a pull request, preparing a PR description, or pushing a branch for review.

---

## Process

### 1. Branch Preparation

- Ensure all changes are committed with conventional commit messages
- Verify the branch is pushed to the remote
- Confirm CI checks pass locally where possible

### 2. PR Description Creation

1. Gather metadata: `git log`, `git diff --stat`, `git diff --shortstat`
2. Detect PR type (standard, heterogeneous, routine, directional)
3. Generate Coat of Arms (invoke heraldry sub-policy)
4. Write description file to `docs/pr-descriptions/PR_DESCRIPTION_{NAME}.md`
5. Push the description file

### 3. PR Type Detection

| Condition | PR Type | Template |
|-----------|---------|----------|
| Single coherent feature domain | Standard | `pr-workflow SKILL.md` |
| 2+ distinct feature spaces | Heterogeneous | `pr-heterogeneous SKILL.md` |
| Maintenance/chore batch | Routine Operations | `ROUTINE_OPERATIONS_TEMPLATE.md` |
| Strategic/directional work | Direction Alignment | `DIRECTION_ALIGNMENT_PR_TEMPLATE.md` |
| Cross-checkout inventory | Cross-Checkout Scan | `CROSS_CHECKOUT_SCAN_TEMPLATE.md` |

### 4. Prohibitions

- **NEVER** use `gh` CLI or GitHub CLI commands to create PRs
- **NEVER** include "Generated with Claude" or "Co-Authored-By: Claude" attribution
- **NEVER** include time estimates or duration predictions
- **NEVER** use ASCII box-drawing for architecture diagrams (use Mermaid)
- **ALWAYS** create the description file first, then the user creates the PR on GitHub

### 5. Output Location

All PR description files go to:
```
docs/pr-descriptions/PR_DESCRIPTION_{FEATURE_NAME}.md
```

Use SCREAMING_SNAKE_CASE for `{FEATURE_NAME}`, derived from the branch name or primary feature.

---

## Cross-References

| Related Rule | Purpose |
|--------------|---------|
| `PR_DESCRIPTION_CONTENT.rules.md` | Content structure and prohibitions |
| `PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic taxonomy and classification |
| `DIAGRAM_CONVENTIONS.rules.md` | Mermaid diagram accessibility |
| `BRANCH_WORKFLOW.rules.md` | Branch naming and commit conventions |

## Skills

| Skill | Location |
|-------|----------|
| `pr-workflow` | `.claude/skills/workflow/pr/SKILL.md` |
| `pr-heraldry` | `.claude/skills/heraldry/pr-heraldry/SKILL.md` |
| `pr-heterogeneous` | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` |

---

_Version: 1.0.0_
_Created: 2026-02-12_
