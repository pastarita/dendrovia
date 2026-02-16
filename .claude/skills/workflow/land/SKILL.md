# Skill: Landing Workflow

> Semantic commit segmentation → rebase → PR description → push

## Activation

**Trigger phrases:**
- "let's land this"
- "land it"
- "land the changes"
- "let's land the untracked files"
- "land this in convention"

## Purpose

Transforms a working tree of staged/unstaged/untracked changes into a well-segmented sequence of conventional commits, rebases onto the latest main, generates a PR description (via `pr-workflow`), and pushes the branch. The commit history produced should be parseable by a future agent to fully reconstruct the technical narrative of the work.

## Pre-Flight: Mandatory Reading

Before executing, read these rules:
- `.claude/rules/BRANCH_WORKFLOW.rules.md` — commit message format, branch naming
- `.claude/rules/PR_WORKFLOW.rules.md` — PR creation process
- `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` — description structure
- `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` — heraldic classification

## Workflow

### Phase 1: Survey

1. Run `git status` (never `-uall`), `git diff --stat HEAD`, `git log --oneline` on the branch
2. Identify the **feature branch** name; confirm we are NOT on main
3. Catalog all changes: modified files, new files, deleted files
4. Read the diff content to understand what each file contributes

### Phase 2: Semantic Segmentation

Decompose the working tree into the **minimum set of commits** such that:

- Each commit compiles independently (no broken intermediate states)
- Each commit has a single coherent purpose
- Dependencies are respected (foundational files committed before consumers)
- The sequence tells a readable story from infrastructure → feature → integration

**Commit ordering heuristics:**
1. **Exports / API surface** — changes that enable downstream consumers (e.g., adding `export`)
2. **Data layer** — types, constants, registries, schemas
3. **Core components** — new standalone components/modules
4. **Integration** — wiring components into existing code (layouts, pages, routes)
5. **Governance / Tooling** — skills, rules, CI, scripts

**Commit message format** (per `BRANCH_WORKFLOW.rules.md`):
```
{type}({scope}): {subject}
```

- `type`: feat, fix, refactor, perf, docs, test, chore, style, ci, build
- `scope`: package or module name (e.g., `ui`, `playgrounds`, `skills`)
- `subject`: imperative mood, no period, under 72 chars, technically dense

**Quality bar for messages:**
- A reader seeing ONLY the commit log should understand the full architecture of the change
- Terse but specific — prefer "add pillar-domain affinity matrix with 6×6 scoring" over "add data"
- Reference the pattern, not the action — prefer "extract shared DomainNav" over "move code"

### Phase 3: Commit Execution

For each planned commit:
1. Stage ONLY the files belonging to that commit (`git add <specific files>`)
2. Commit with the planned message using HEREDOC format
3. Verify with `git status` between commits to confirm clean staging

**Never use `git add -A` or `git add .`** — always stage specific files.

### Phase 4: Rebase (Conditional)

1. `git fetch origin main`
2. Check if main has new commits: `git log HEAD..origin/main --oneline`
3. If yes: `git rebase origin/main` (resolve conflicts if any)
4. If no: skip rebase

### Phase 5: Push

1. `git push origin HEAD` (or `git push -u origin HEAD` if no upstream)
2. If rejected due to rebase divergence, confirm with user before force-pushing

### Phase 6: PR Description

Invoke the **pr-workflow** skill:
1. Read all mandatory pre-flight rules
2. Gather metadata from the full commit range on this branch
3. Generate Coat of Arms via pr-heraldry sub-skill
4. Write description to `docs/pr-descriptions/PR_DESCRIPTION_{NAME}.md`
5. Commit and push the description file

## Output

The branch is pushed with:
- N granular commits (semantically segmented)
- Rebased on latest main (if applicable)
- PR description file committed
- Ready for `gh pr create` or manual PR on GitHub

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| One giant commit with all changes | Segment by purpose and dependency order |
| Generic messages ("update files") | Technically specific messages |
| Stage everything with `git add .` | Stage specific files per commit |
| Skip rebase | Always fetch and check for divergence |
| Amend previous commits | Create new commits; history is append-only |
| Commit secrets or .env files | Check staged files before each commit |

## Cross-References

| Related | Purpose |
|---------|---------|
| `pr-workflow` SKILL | PR description generation (Phase 6) |
| `pr-heraldry` SKILL | Coat of Arms classification |
| `BRANCH_WORKFLOW.rules.md` | Commit message format |
| `CASTLE_WALLS.rules.md` | Pre-commit quality gates |

---

_Version: 1.0.0_
_Created: 2026-02-15_
