# Castle Walls Rules — Pre-Commit Quality Gates

**Governs:** Castle Walls hook system, permission policy engine, secret detection, expedition mode

---

## Wall System

### Wall Numbering

| Wall | Purpose | Enforcement |
|------|---------|-------------|
| 0 | Context protection (branch, stash) | Advisory |
| 1 | Secret detection | **BLOCKING** |
| 2 | Static analysis (typecheck, lint) | Advisory |
| 2.5 | Dependency validation | Advisory |
| 2.7 | Runtime/shebang compliance | Advisory |
| 3 | Test suite (10s timeout) | Advisory |
| 7 | Large file/asset warnings | Advisory |

### Graduation Protocol

Walls start as advisory and graduate to blocking when:
- False positive rate < 1% over 30 days
- CI enforces the same check
- Team consensus reached

### Expedition Mode

Branches with `expedite` in the name skip advisory walls. Wall 1 (secrets) and Wall 7 (assets) always run.

---

## Permission Policy Engine

### Three Tiers

| Tier | Mechanism | Hook Point | Timeout |
|------|-----------|------------|---------|
| 1 | Deterministic pattern match | PreToolUse | 5s |
| 2 | LLM classifier (Haiku) | PermissionRequest | 30s |
| 3 | Human fallback | Terminal prompt | — |

### Policy Modes

| Mode | File | Use Case |
|------|------|----------|
| default | `modes/default.yaml` | Standard development |
| testing | `modes/testing.yaml` | Test execution sessions |
| rendover | `modes/rendover.yaml` | Visual verification |
| deployment | `modes/deployment.yaml` | Locked-down production prep |

### Mode Switching

```bash
.claude/hooks/switch-mode.sh testing    # Switch to testing mode
.claude/hooks/switch-mode.sh            # Show current mode
```

---

## Secret Detection

### Certified Exceptions

False positives are managed via string-based exceptions in `.castle-walls/certified-exceptions.yaml`.

**Never add:**
- Real API keys or secrets
- Blanket file type exclusions
- Entire directory exclusions

**Always add:**
- Exact string + reason + approval date
- Category classification
- Source URL when available

### Bypass Protocol

```bash
SKIP_SECRET_CHECK=1 git commit -m "docs: bypass (documented reason)"
```

Every bypass MUST be documented in the commit message.

---

## Stash Anti-Pattern

### Why Stashes Are Prohibited

Stashes are invisible context lost between agentic sessions:
- They have no branch association visible in `git branch` or `git log`
- They don't appear in GitHub, PR diffs, or CI pipelines
- They silently accumulate and are easily forgotten across sessions
- Large stashes (100+ files) represent significant work at risk of loss

### Tier 1 Block Coverage

The Tier 1 policy engine blocks **stash creation** commands across all 4 modes:
- `git stash` (bare command)
- `git stash push`, `git stash save`, `git stash create`
- `git stash --keep-index`, `git stash --patch`, and other creation flags

The following **stash inspection and recovery** commands remain allowed:
- `git stash list` — view existing stashes (read-only)
- `git stash show` — inspect stash contents
- `git stash pop`, `git stash apply` — recover stash contents
- `git stash drop` — clean up after recovery
- `git stash branch` — pop stash to a new branch (preferred recovery)

### Recovery Workflow

Instead of stashing, use branch-based workflows:

```bash
# Instead of: git stash && git checkout other-branch
# Do:
git checkout -b wip/current-work
git add -A && git commit -m 'wip: save in progress work'
git checkout other-branch

# To recover existing stashes:
git stash branch feat/recovered-work    # Pop to a new branch (preferred)
# Or:
git stash show -p                       # Review contents first
git stash apply                         # Apply without dropping
git add -A && git commit -m 'feat: recover stashed work'
git stash drop                          # Clean up
```

### Cross-References

- **Recon skill** (`.claude/skills/recon/cross-checkout-scan/SKILL.md`): Stash archaeology surfaces stash metadata during cross-checkout scans
- **Pre-commit hook** (`.husky/pre-commit`): Wall 0 warns when stashes are detected and provides recovery guidance

---

## Files

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Castle Walls main script |
| `.husky/pre-push` | Branch protection gates |
| `.husky/post-rebase` | Cache invalidation |
| `.claude/hooks/tier1-gatekeeper.py` | Deterministic gatekeeper |
| `.claude/hooks/tier2-llm-gatekeeper.py` | LLM classifier |
| `.claude/hooks/decision-logger.py` | Audit trail |
| `.claude/hooks/switch-mode.sh` | Mode switcher |
| `.claude/policies/modes/*.yaml` | Policy definitions |
| `.castle-walls/certified-exceptions.yaml` | Safe strings registry |
| `.gitleaks.toml` | Gitleaks custom rules |

---

_Version: 1.1.0_
_Updated: 2026-02-16_
