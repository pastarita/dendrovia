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

_Version: 1.0.0_
_Created: 2026-02-12_
