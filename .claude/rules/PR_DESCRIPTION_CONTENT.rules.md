# PR Description Content Rules

**Trigger:** When writing or reviewing PR description content.

---

## Mandatory Sections

Every PR description MUST contain these sections in order:

| Section | Required | Notes |
|---------|----------|-------|
| Coat of Arms | Yes | Level 1 (Synthetic) rendering |
| Compact line | Yes | Single-line summary below Coat of Arms |
| Summary | Yes | 1-3 sentences |
| Features | Yes | Table or bulleted list |
| Files Changed | Yes | Tree structure with descriptions |
| Commits | Yes | Numbered list with conventional format |
| Test Plan | Yes | Checkboxes |
| Architecture | Major/Epic only | Mermaid diagrams mandatory for major+ |

## Coat of Arms Requirements

The Coat of Arms block MUST include:

1. **Branch name** (top)
2. **Magnitude** with symbol (trivial/minor/moderate/major/epic)
3. **Supporters** with status (typecheck, lint, test, build)
4. **Primary charge** with count (mapped from commit types)
5. **Domain(s)** in brackets
6. **File count** and **line delta** (+added / -removed)
7. **Motto** (bottom, Latin with optional translation)
8. **Compact line** immediately below the box

## Prohibited Content

| Content | Reason |
|---------|--------|
| "Generated with Claude" | Attribution prohibited |
| "Co-Authored-By: Claude" | Attribution prohibited |
| Time estimates / durations | Predictions are unreliable |
| ASCII box-drawing diagrams | Use Mermaid instead |
| Placeholder text (TBD, TODO) | Descriptions must be complete |
| Raw diff output | Summarize changes, don't paste diffs |

Exception: The Coat of Arms itself uses ASCII box-drawing (`+`, `|`, `-`) as its rendering format at Level 1. This is intentional and exempt from the diagram prohibition.

## Diagram Requirements

- All architecture/flow diagrams MUST use Mermaid syntax
- All Mermaid `style` directives MUST include explicit `color:` for text accessibility
- See `DIAGRAM_CONVENTIONS.rules.md` for the complete color reference
- Never use reserved keywords (`end`, `start`, `graph`) as Mermaid node IDs

## Section Content Guidelines

### Summary
- 1-3 sentences establishing what changed and why
- No implementation details (those go in Features)
- Should answer: "What would a reviewer need to know first?"

### Features
- Each feature gets a row with: name, description, status (complete/partial/WIP)
- Group by subsystem or module when there are many

### Files Changed
- Tree structure showing directory hierarchy
- Each file gets a brief annotation of what changed
- Group by module/package

### Commits
- Numbered list
- Each entry: `{hash (short)} {conventional message}`
- Order: chronological (oldest first)

### Test Plan
- Checkbox list of verification steps
- Include both automated and manual checks
- Mark which checks have been performed

---

## Cross-References

| Related Rule | Purpose |
|--------------|---------|
| `PR_HERALDRY_COMPLETENESS.rules.md` | Full heraldic taxonomy |
| `DIAGRAM_CONVENTIONS.rules.md` | Mermaid accessibility rules |
| `PR_WORKFLOW.rules.md` | Process rules |

## Skills

| Skill | Location |
|-------|----------|
| `pr-workflow` | `.claude/skills/workflow/pr/SKILL.md` |
| `pr-heraldry` | `.claude/skills/heraldry/pr-heraldry/SKILL.md` |

---

_Version: 1.0.0_
_Created: 2026-02-12_
