# Branch Workflow Rules

**Trigger:** When creating branches, making commits, or managing scope within a branch.

---

## 1. Branch Naming

### Convention

```
{type}/{short-description}
```

| Type Prefix | Use Case | Example |
|-------------|----------|---------|
| `feat/` | New feature | `feat/chronos-git-parser` |
| `fix/` | Bug fix | `fix/hotspot-nan-scores` |
| `refactor/` | Code restructuring | `refactor/ast-parser-perf` |
| `docs/` | Documentation only | `docs/pr-heraldry-system` |
| `chore/` | Maintenance/tooling | `chore/update-dependencies` |
| `epic/` | Multi-PR initiative | `epic/chronos-implementation` |

### Rules

- Use kebab-case for the description portion
- Keep branch names under 50 characters
- Include pillar name when scope is pillar-specific

## 2. Commit Messages

### Conventional Commits Format

```
{type}({scope}): {subject}

{body}

{footer}
```

| Field | Required | Rule |
|-------|----------|------|
| type | Yes | One of: feat, fix, refactor, perf, docs, test, chore, style, ci, build |
| scope | Recommended | Package or module name: `chronos`, `shared`, `heraldry` |
| subject | Yes | Imperative mood, no period, under 72 chars |
| body | Optional | Explain "what" and "why", not "how" |
| footer | Optional | `BREAKING CHANGE:` or issue references |

### Examples

```
feat(chronos): implement hybrid GitParser via Bun.spawn
fix(heraldry): correct tincture assignment for shared domain
refactor(ast-parser): extract complexity calculation into separate module
docs(pr): add heraldry completeness governance document
```

## 3. Scope Drift Prevention

### Rules

- A branch should address ONE coherent concern
- If scope expands to touch 3+ unrelated domains, consider splitting
- Track drift by monitoring domain count in `git diff --stat`
- If a branch becomes heterogeneous, use the heterogeneous PR template

### Indicators of Scope Drift

| Signal | Action |
|--------|--------|
| Commit messages change topic repeatedly | Consider splitting branch |
| Files span 4+ unrelated packages | Evaluate if this should be multiple PRs |
| Branch has been alive for 2+ weeks | Check if smaller PRs can be extracted |
| Reviewer asks "why is X in this PR?" | Extract X to a separate branch |

---

## Cross-References

| Related Rule | Purpose |
|--------------|---------|
| `PR_WORKFLOW.rules.md` | PR creation process |
| `PR_DESCRIPTION_CONTENT.rules.md` | How branches map to PR descriptions |

---

_Version: 1.0.0_
_Created: 2026-02-12_
