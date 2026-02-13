# Castle Walls: Codebase Context System Setup

_Version: 1.0.0_
_Created: 2026-02-12_

> A comprehensive guide for implementing a tiered pre-commit quality gate system with agentic workflow awareness, policy-driven permission engines, secret detection, certified exception registries, and stack-specific enforcement conventions — generalized so any codebase can adopt, style, and extend the system.

---

## Table of Contents

1. [Pre-Implementation Inquiry and Contemplation](#1-pre-implementation-inquiry-and-contemplation)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Styling Your Castle Walls](#3-styling-your-castle-walls)
4. [File Structure and Hook Organization](#4-file-structure-and-hook-organization)
5. [Implementing the Wall System](#5-implementing-the-wall-system)
6. [The Permission Policy Engine](#6-the-permission-policy-engine)
7. [Secret Detection and Certified Exceptions](#7-secret-detection-and-certified-exceptions)
8. [Stack-Oriented Configuration](#8-stack-oriented-configuration)
9. [Expedition Mode and Bypass Conventions](#9-expedition-mode-and-bypass-conventions)
10. [Agentic Workflow Integration](#10-agentic-workflow-integration)
11. [Pre-Push Gates and Branch Protection](#11-pre-push-gates-and-branch-protection)
12. [Observability, Audit Trails, and Telemetry](#12-observability-audit-trails-and-telemetry)
13. [Runbook and Troubleshooting Patterns](#13-runbook-and-troubleshooting-patterns)
14. [Extension, Graduation, and Roadmap Patterns](#14-extension-graduation-and-roadmap-patterns)
15. [Verification and Self-Test](#15-verification-and-self-test)

---

## 1. Pre-Implementation Inquiry and Contemplation

Before writing a single line of hook code, a codebase must undergo a structured inquiry to determine **which walls are meaningful**, **what enforcement posture is appropriate**, and **where the highest-value quality gates live** for the specific technology stack, team topology, and development workflow in use.

### 1.1 The Contemplation Questions

Answer these questions before designing your wall system:

#### Stack Identity

| Question | Why It Matters | Example Answer |
|----------|---------------|----------------|
| What language(s) does the codebase use? | Determines which static analysis walls are relevant | TypeScript, Python, Rust |
| What package manager(s) are in use? | Determines dependency validation wall design | pnpm, pip, cargo |
| What test framework(s) are active? | Determines test wall timeout and invocation | Vitest, pytest, cargo test |
| What linter/formatter is canonical? | Determines lint wall command | Biome, ESLint, Ruff, rustfmt |
| Does the codebase have a type system? | Determines whether a typecheck wall exists | TypeScript strict, mypy, Rust compiler |
| What CI/CD platform is used? | Determines remote mirroring strategy | GitHub Actions, GitLab CI, Buildkite |
| Are there agentic workflows (Claude Code, Cursor, etc.)? | Determines Wall 0 design (stash/context protection) | Claude Code with hooks |

#### Risk Profile

| Question | Why It Matters | Example Answer |
|----------|---------------|----------------|
| Does the codebase handle secrets (API keys, credentials)? | Determines whether secret detection is BLOCKING | Yes — Stripe, Neon, Anthropic keys |
| Are there database schemas that can be destructively altered? | Determines DB safety patterns in policy | Yes — Drizzle migrations |
| Is there a deployment pipeline that can be triggered accidentally? | Determines deployment lockout rules | Yes — Vercel auto-deploy on push |
| Do multiple contributors share branches? | Determines force-push and rebase policies | Mostly solo, occasional pairing |
| Are binary/large files a concern? | Determines large file warning wall | Yes — 3D models, screenshots |

#### Enforcement Posture

| Question | Why It Matters | Example Answer |
|----------|---------------|----------------|
| Should type errors block commits? | Determines advisory vs blocking for static analysis | Advisory now, blocking at v1.0 |
| Should test failures block commits? | Determines test wall enforcement level | Advisory (tests run in CI too) |
| What is the acceptable pre-commit duration? | Determines timeout budgets per wall | < 30 seconds total |
| Is there a "fast path" need for trivial commits? | Determines expedition mode design | Yes — typo fixes, doc updates |
| Should there be a policy engine for agentic tool use? | Determines whether to implement the 3-tier permission system | Yes — Claude Code hooks |

### 1.2 The Contemplation Matrix

Score each prospective wall on three dimensions:

```
              VALUE                      FRICTION                    COMPLEXITY
         (What does it              (How much does it           (How hard is it
          prevent?)                  slow developers?)           to implement?)

HIGH     Secret leaks               > 15 seconds per commit     Custom tooling needed
         Data destruction           Frequent false positives    External service deps
         Main branch corruption     Blocks most commits         Complex configuration

MEDIUM   Type regressions           5-15 seconds per commit     Standard tool integration
         Lint drift                 Occasional false positives  Some configuration
         Dependency confusion       Blocks some commits         File-based rules

LOW      Style inconsistency        < 5 seconds per commit      One-line check
         Naming violations          Rare false positives        Built-in tool flag
         Stale context warnings     Never blocks                Pure advisory output
```

**The Implementation Rule:**

> Implement walls where `VALUE` exceeds `FRICTION + COMPLEXITY`. A wall that prevents a secret leak (catastrophic value) is worth 15 seconds of friction. A wall that enforces semicolons (low value) is not worth 5 seconds of friction if it blocks commits.

### 1.3 The Blocking-Advisory Spectrum

Every wall must be classified on the enforcement spectrum:

```
BLOCKING ←————————————————————————————————————→ ADVISORY

Secrets  │  Static Analysis  │  Tests  │  Style  │  Stash/Branch
  ████████   ░░░░░░░░░░░░░░░   ░░░░░░   ░░░░░░    ░░░░░░░░░░

Legend:
  ████ = Blocks commit (exit 1)
  ░░░░ = Warns but allows commit (exit 0)
```

**Graduation pattern:** Walls start advisory and graduate to blocking as confidence in the check grows and false positive rate drops below a threshold (typically < 1%).

### 1.4 Documenting the Inquiry

Create a file in your codebase that records your contemplation answers:

```
docs/INFRA/{system-name}/
├── CONTEMPLATION.md            # Answers to inquiry questions
├── WALL_DESIGN_DECISIONS.md    # Why each wall exists and its enforcement level
└── GRADUATION_CRITERIA.md      # When advisory walls become blocking
```

This artifact serves as the **design rationale** for future contributors who ask "why does this wall exist?" or "why isn't this wall blocking?"

---

## 2. System Architecture Overview

### 2.1 The Castle Metaphor

The system uses a **castle defense metaphor** where each quality gate is a "wall" that incoming commits must pass through:

```mermaid
flowchart TB
    subgraph COMMIT["Incoming Commit"]
        C1["git commit -m 'feat: ...'"]
    end

    subgraph WALLS["Castle Walls (Pre-Commit)"]
        direction TB
        W0["Wall 0: Context Protection"]
        W1["Wall 1: Secret Detection"]
        W2["Wall 2: Static Analysis"]
        W25["Wall 2.5: Dependency Validation"]
        W27["Wall 2.7: Runtime Compliance"]
        W3["Wall 3: Test Suite"]
        W7["Wall 7: Asset Boundaries"]
    end

    subgraph GATES["Pre-Push Gates"]
        G1["Branch Protection"]
        G2["Naming Convention"]
        G3["PR Readiness"]
    end

    subgraph POLICY["Permission Policy Engine"]
        T1["Tier 1: Deterministic"]
        T2["Tier 2: LLM Classifier"]
        T3["Tier 3: Human Fallback"]
    end

    C1 --> W0 --> W1 --> W2 --> W25 --> W27 --> W3 --> W7
    W7 -->|"exit 0"| PASS["Commit Accepted"]
    W1 -->|"secrets found"| BLOCK["Commit Blocked (exit 1)"]

    PASS -->|"git push"| G1 --> G2 --> G3 --> PUSHED["Branch Pushed"]
    G1 -->|"push to main"| PUSHBLOCK["Push Blocked (exit 1)"]

    T1 -->|"no match"| T2
    T2 -->|"YELLOW"| T3

    style W1 fill:#dc2626,stroke:#991b1b,color:#ffffff
    style BLOCK fill:#dc2626,stroke:#991b1b,color:#ffffff
    style PUSHBLOCK fill:#dc2626,stroke:#991b1b,color:#ffffff
    style PASS fill:#22c55e,stroke:#166534,color:#000000
    style PUSHED fill:#22c55e,stroke:#166534,color:#000000
    style W0 fill:#fef3c7,stroke:#d97706,color:#000000
    style W2 fill:#fef3c7,stroke:#d97706,color:#000000
    style W25 fill:#fef3c7,stroke:#d97706,color:#000000
    style W27 fill:#fef3c7,stroke:#d97706,color:#000000
    style W3 fill:#fef3c7,stroke:#d97706,color:#000000
    style W7 fill:#fef3c7,stroke:#d97706,color:#000000
    style T1 fill:#1e3a5f,stroke:#3b82f6,color:#ffffff
    style T2 fill:#3c6b63,stroke:#22c55e,color:#ffffff
    style T3 fill:#c77b3f,stroke:#d97706,color:#000000
```

### 2.2 Two Enforcement Domains

The system operates across two orthogonal enforcement domains:

| Domain | Mechanism | When It Fires | Scope |
|--------|-----------|---------------|-------|
| **Git Hooks** (Castle Walls) | Shell scripts in `.husky/` | On `git commit`, `git push`, `git rebase` | All developers, all commits |
| **Permission Policy Engine** | Python hooks in `.claude/hooks/` | On agentic tool invocations (Claude Code) | AI-assisted development sessions only |

These are complementary — Git hooks guard the repository boundary; the policy engine guards the tool-use boundary within agentic sessions.

### 2.3 Wall Numbering Convention

Walls are numbered with deliberate gaps to allow insertion without renumbering:

| Wall | Purpose | Enforcement | Typical Duration |
|------|---------|-------------|-----------------|
| **0** | Context protection (branch, stash) | Advisory | < 1s |
| **1** | Secret detection | **BLOCKING** | 1-3s |
| **2** | Static analysis (typecheck, lint) | Advisory | 5-15s |
| **2.5** | Dependency validation | Advisory | 1-2s |
| **2.7** | Runtime/shebang compliance | Advisory | < 1s |
| **3** | Unit test suite | Advisory | 5-10s (with timeout) |
| **4-6** | Reserved for future walls | — | — |
| **7** | Large file / asset warnings | Advisory | < 1s |

The fractional numbering (2.5, 2.7) allows inserting domain-specific walls between major categories without breaking existing documentation or scripts that reference wall numbers.

---

## 3. Styling Your Castle Walls

### 3.1 Visual Identity System

Castle Walls output is a developer-facing product — it runs on every commit and shapes the developer experience. Its visual identity should be intentional, not accidental.

#### The Banner

Every invocation begins with a banner that identifies the system, version, and mode:

```
╔════════════════════════════════════════════════════════════════╗
║           CASTLE WALLS v{VERSION} - Pre-Commit Quality Gates    ║
╚════════════════════════════════════════════════════════════════╝
```

Design the banner to:
- Identify the system name (your equivalent of "Castle Walls")
- Show the version (critical for debugging "which checks ran?")
- Optionally show the mode (expedition, standard, deployment)

#### Per-Wall Output Format

Each wall follows a consistent output pattern:

```
▸ WALL {N}: {Wall Name}...
  ▸ Running {sub-check}...
  ✓ {sub-check} passed                    ← Success
  ⚠ {sub-check} issues found (advisory)   ← Advisory warning
  🚨 BLOCKED: {description}                ← Blocking failure
```

**Symbols:**

| Symbol | Meaning | When to Use |
|--------|---------|-------------|
| `▸` | Section/sub-section leader | Start of wall, start of sub-check |
| `✓` | Pass | Check completed successfully |
| `⚠` | Advisory warning | Issues found but not blocking |
| `🚨` | Blocking failure | Commit will be rejected |
| `○` | Skipped | Check was not applicable or bypassed |

#### The Summary Report

After all walls complete, print a summary dashboard:

```
════════════════════════════════════════════════════════════════
Castle Walls Complete ({DURATION}s)

WALL 0 (Branch/Stash): ✓ Passed [ADVISORY]
WALL 1 (Secrets):      ✓ Passed [BLOCKING]
WALL 2 (TypeCheck):    ⚠ Warnings [ADVISORY]
WALL 2 (Lint):         ⚠ Warnings [ADVISORY]
WALL 2.5 (Deps):       ○ Skipped (no dep files)
WALL 2.7 (Shebang):    ○ Skipped (no scripts)
WALL 3 (Tests):        ✓ Passed [ADVISORY]

✓ Duration within target: {N}s / {TARGET}s
════════════════════════════════════════════════════════════════
```

### 3.2 Color and Formatting Conventions

Terminal output uses ANSI escape codes sparingly. Prefer Unicode symbols over colors for accessibility in terminals that don't support ANSI:

| Concept | Primary Indicator | Fallback |
|---------|-------------------|----------|
| Success | `✓` (green if ANSI available) | `PASS` |
| Warning | `⚠` (yellow if ANSI available) | `WARN` |
| Failure | `🚨` (red if ANSI available) | `FAIL` |
| Skipped | `○` | `SKIP` |
| Info | `▸` | `>` |

### 3.3 Box-Drawing Convention

Use box-drawing characters for emphasis blocks (blocking failures, expedition mode, branch protection):

```
╔═══════════════════════════════════════════╗
║  Header text                              ║
╠═══════════════════════════════════════════╣
║  Body text                                ║
╚═══════════════════════════════════════════╝
```

Reserve box-drawing for:
- System banners
- Blocking failure messages (these MUST be visually distinct)
- Mode announcements (expedition mode, deployment lockdown)
- Recovery instructions (step-by-step guides)

Do NOT use box-drawing for routine advisory warnings — this dilutes its signal value.

### 3.4 Recovery Instructions Pattern

When a wall blocks or warns, always provide actionable recovery:

```
  🚨 BLOCKED: {What happened}

  To fix:
  ────────────────────────────────────────
  1. {First specific action}
  2. {Second specific action}
  3. {Third specific action}
  ────────────────────────────────────────

  Emergency bypass (use sparingly, document in commit):
    {BYPASS_COMMAND}
```

The recovery section is not optional. A gate that blocks without explaining how to unblock is a gate that developers will disable entirely.

### 3.5 Duration Tracking

Always measure and report wall duration:

```bash
START_TIME=$(date +%s)
# ... run all walls ...
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $DURATION -gt $TARGET ]; then
    echo "⚠ Castle Walls took ${DURATION}s (target: <${TARGET}s)"
    echo "  Consider optimizing slow checks or moving to CI"
else
    echo "✓ Duration within target: ${DURATION}s / ${TARGET}s"
fi
```

This creates self-monitoring — the hook warns when it becomes too slow, before developers start bypassing it.

---

## 4. File Structure and Hook Organization

### 4.1 Directory Layout

```
project-root/
├── .husky/                              # Git hooks (Husky-managed)
│   ├── pre-commit                       # Castle Walls main script
│   ├── pre-push                         # Branch protection + PR readiness
│   └── post-rebase                      # Cache/dependency sync
│
├── .claude/                             # Claude Code integration
│   ├── hooks/                           # Permission policy hooks
│   │   ├── tier1-gatekeeper.py          # Deterministic pattern matching
│   │   ├── tier2-llm-gatekeeper.py      # LLM-based classification
│   │   ├── decision-logger.py           # PostToolUse audit logger
│   │   ├── switch-mode.sh               # Mode switching CLI
│   │   └── logs/                        # Audit trail
│   │       ├── decisions.jsonl          # All decisions logged
│   │       ├── tier1-errors.log         # Tier 1 error log
│   │       └── tier2-errors.log         # Tier 2 error log
│   │
│   ├── policies/                        # Policy definitions
│   │   ├── .active-mode                 # Current mode file (e.g., "default")
│   │   ├── modes/                       # Mode YAML files
│   │   │   ├── default.yaml             # Standard development
│   │   │   ├── testing.yaml             # Test-focused mode
│   │   │   ├── rendover.yaml            # Visual verification mode
│   │   │   └── deployment.yaml          # Locked-down mode
│   │   └── corpus/                      # LLM context
│   │       └── compiled-policy.md       # Policy corpus for Tier 2
│   │
│   ├── settings.json                    # Claude Code tool permissions
│   └── settings.local.json              # Hook wiring + local overrides
│
├── .castle-walls/                       # Castle Walls configuration
│   └── certified-exceptions.yaml        # Safe strings registry
│
├── .gitleaks.toml                       # Gitleaks custom rules
│
├── docs/
│   ├── INFRA/{system-name}/             # System documentation
│   │   ├── DIDACTIC_RETROSPECTIVE.md    # Architecture analysis
│   │   └── CERTIFIED_EXCEPTIONS_RATIONALE.md
│   └── OPERATIONS/
│       └── RUNBOOK.md                   # Troubleshooting guide
│
└── scripts/
    ├── dependency-validator.ts           # Dependency validation logic
    └── find-css-shorthand-conflicts.ts   # Domain-specific checker
```

### 4.2 Separation of Concerns

Each file has exactly one responsibility:

| File | Responsibility | Trigger | Can Block? |
|------|---------------|---------|------------|
| `.husky/pre-commit` | Quality gates on commit | `git commit` | Yes (Wall 1 only) |
| `.husky/pre-push` | Branch protection on push | `git push` | Yes (main protection) |
| `.husky/post-rebase` | Cache invalidation | `git rebase` | No |
| `.claude/hooks/tier1-gatekeeper.py` | Fast allow/deny by pattern | Claude Code PreToolUse | Yes |
| `.claude/hooks/tier2-llm-gatekeeper.py` | LLM classification for ambiguous requests | Claude Code PermissionRequest | Yes |
| `.claude/hooks/decision-logger.py` | Audit trail of all tool uses | Claude Code PostToolUse | No (observation only) |
| `.castle-walls/certified-exceptions.yaml` | False positive management | Referenced by Wall 1 | No (data only) |
| `.claude/policies/modes/*.yaml` | Rule definitions per mode | Referenced by Tier 1 | No (data only) |

### 4.3 The Independence Principle

**Hooks must be self-contained.** A pre-commit hook should NOT depend on:

- `node_modules/` (may not be installed)
- Runtime services (database, API server)
- Network connectivity (for offline development)
- Language-specific package managers being functional

This is why Tier 1 uses a custom minimal YAML parser instead of requiring `pyyaml`:

```python
# Falls back to line-by-line parsing if pyyaml is not installed
try:
    import yaml
    return yaml.safe_load(f) or {}
except ImportError:
    pass  # Use built-in parser
```

And why Wall 1 uses `grep` patterns before optionally invoking `gitleaks`:

```bash
# Layer 1: Quick patterns (no dependencies)
SECRET_PATTERNS='(sk-proj-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|...)'

# Layer 2: Gitleaks (only if installed)
if command -v gitleaks >/dev/null 2>&1; then
    gitleaks protect --staged --no-banner --redact
fi
```

---

## 5. Implementing the Wall System

### 5.1 Wall 0: Context Protection (Advisory)

**Purpose:** Prevent context loss in agentic and human workflows.

**Checks:**
1. **Direct-to-main detection** — Warns when committing to `main` or `master`
2. **Stash detection** — Warns when stashes exist (invisible context loss risk)
3. **PR description branch verification** — Hints when a staged PR description may have a stale branch name

**Why it matters for agentic workflows:** AI coding assistants lose context between sessions. A stash created in one session is invisible in the next — the agent will re-implement work that already exists in the stash. Committing (even as `wip:`) is always safer than stashing.

```bash
# Stash detection with recovery instructions
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
if [ "$STASH_COUNT" -gt 0 ]; then
    echo "  ⚠ WARNING: $STASH_COUNT stash(es) detected!"
    echo "  Stashes are invisible context lost between agentic sessions."
    echo ""
    echo "  Recover and segment into meaningful commits:"
    echo "    git stash show -p              # Review stash contents"
    echo "    git stash apply                # Apply WITHOUT dropping"
    echo "    git add -p                     # Interactive staging by hunk"
    echo "    git commit -m 'feat(): ...'    # Commit logical group"
    echo "    git stash drop                 # Clean up after all committed"
fi
```

### 5.2 Wall 1: Secret Detection (Blocking)

**Purpose:** Prevent credentials from entering the repository.

**This is the only wall that should start as BLOCKING.** Credential leaks are catastrophic and irreversible — once a secret enters git history, it must be rotated regardless of whether the commit is reverted.

**Two-layer architecture:**

| Layer | Dependencies | Speed | Coverage |
|-------|-------------|-------|----------|
| Layer 1: Pattern matching | None (pure shell) | < 1s | High-confidence patterns |
| Layer 2: Gitleaks | `gitleaks` binary | 1-3s | Comprehensive (entropy + patterns) |

**Pattern design principle:** Only match high-confidence patterns that are extremely unlikely to produce false positives:

```bash
# HIGH confidence patterns (very low false positive rate)
SECRET_PATTERNS='(
  sk-proj-[a-zA-Z0-9]{20,}|         # OpenAI project keys
  sk-ant-api[0-9]+-[a-zA-Z0-9-]{20,}|  # Anthropic API keys
  ghp_[a-zA-Z0-9]{36}|              # GitHub personal access tokens
  gho_[a-zA-Z0-9]{36}|              # GitHub OAuth tokens
  AKIA[0-9A-Z]{16}|                 # AWS access key IDs
  sk_live_[a-zA-Z0-9]{20,}|         # Stripe live keys
  sk_test_[a-zA-Z0-9]{20,}|         # Stripe test keys
  whsec_[a-zA-Z0-9]{20,}|           # Webhook secrets
  signkey-[a-z]+-[a-zA-Z0-9]{10,}   # Signing keys
)'
```

**Do NOT pattern-match:**
- Generic "password" strings (too many false positives in documentation)
- Short tokens (< 16 characters — too ambiguous)
- Environment variable names (`API_KEY=` without the value)

### 5.3 Wall 2: Static Analysis (Advisory)

**Purpose:** Catch type errors and lint violations before commit.

```bash
echo "▸ WALL 2: Static Analysis..."

# TypeScript Type Check
echo "  ▸ Running TypeScript type check..."
if bun run typecheck 2>/dev/null; then
    echo "  ✓ Type check passed"
else
    echo "  ⚠ Type errors found (advisory)"
    TYPECHECK_STATUS=1
fi

# Linting
echo "  ▸ Running linter..."
if bun run lint 2>/dev/null; then
    echo "  ✓ Lint passed"
else
    echo "  ⚠ Lint errors found (advisory)"
    LINT_STATUS=1
fi
```

**Graduation criteria:** Graduate from advisory to blocking when:
- False positive rate < 1% over 30 days
- Team consensus that the check is stable
- CI also enforces the same check (defense in depth)

### 5.4 Wall 2.5: Dependency Validation (Advisory)

**Purpose:** Prevent installation of blocked, renamed, or semantically confused packages.

This wall was born from an incident where `fuse` (a FUSE filesystem library) was installed instead of `fuse.js` (a fuzzy search library), causing silent failures across multiple developer machines.

**Implementation pattern:**

```bash
# Quick check: scan package.json diff for blocked packages
BLOCKED_PKGS='(fuse|eslint|prettier|react-flow|reactflow|event-stream)'
if git diff --cached package.json | grep -E "^\+.*\"($BLOCKED_PKGS)\"" > /dev/null; then
    echo "  ⚠ WARNING: Blocked package detected in package.json!"
fi

# Full check: run validator script if available
if command -v bun >/dev/null && [ -f "scripts/dependency-validator.ts" ]; then
    bun scripts/dependency-validator.ts --json
fi
```

**Key design:** Maintain a canonical registry of approved packages with semantic collision detection:

```typescript
// lib/dependency-validation/canonical-registry.ts
"fuse.js": {
  name: "fuse.js",
  status: "canonical",
  semanticSimilars: ["fuse", "fusejs"],  // These trigger warnings
  category: "search",
  purpose: "Fuzzy search library",
}
```

### 5.5 Wall 2.7: Runtime Compliance (Advisory)

**Purpose:** Enforce runtime conventions across executable scripts.

In a codebase standardized on `bun`, scripts must use `#!/usr/bin/env bun` — not `tsx`, `ts-node`, or other runtimes. This wall catches drift.

```bash
for file in $SCRIPT_FILES_STAGED; do
    SHEBANG=$(head -n 1 "$file")
    if echo "$SHEBANG" | grep -q '^#!/usr/bin/env' && ! echo "$SHEBANG" | grep -q 'bun'; then
        echo "  ⚠ Non-standard shebang in $file"
        echo "    Current:  $SHEBANG"
        echo "    Expected: #!/usr/bin/env bun"
    fi
done
```

**Generalization:** Replace `bun` with your runtime. The pattern applies to any codebase that standardizes on a single runtime:

| Stack | Expected Shebang | Blocked Alternatives |
|-------|------------------|---------------------|
| Bun | `#!/usr/bin/env bun` | `tsx`, `ts-node`, `node` |
| Deno | `#!/usr/bin/env deno` | `node`, `bun` |
| Python | `#!/usr/bin/env python3` | `python`, `python2` |
| Node | `#!/usr/bin/env node` | `ts-node` (use `--loader`) |

### 5.6 Wall 3: Test Suite (Advisory)

**Purpose:** Catch regressions before commit.

**Critical design decision: the timeout.**

```bash
# Run tests with a STRICT timeout
if timeout 10 bun run test --run 2>/dev/null; then
    echo "  ✓ Unit tests passed"
else
    echo "  ⚠ Unit test failures (advisory)"
fi
```

Pre-commit tests MUST have a timeout. Without it, a hanging test blocks the commit process indefinitely with no recovery path except killing the terminal. A 10-second timeout means:
- Fast unit tests run and report
- Slow integration tests are skipped (they belong in CI)
- Hanging tests fail gracefully

### 5.7 Wall 7: Asset Boundary Warnings (Advisory)

**Purpose:** Warn when staging files that exceed size thresholds.

```bash
for f in $(git diff --cached --name-only --diff-filter=ACM); do
    SIZE=$(git cat-file -s ":$f" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 512000 ]; then  # 500 KB
        KB=$(echo "$SIZE" | awk '{printf "%.1f", $1/1024}')
        echo "  ⚠ Large file: ${KB} KB  ${f}"
    fi
done
```

---

## 6. The Permission Policy Engine

### 6.1 Three-Tier Architecture

For codebases with agentic workflows (Claude Code, Cursor, etc.), a permission policy engine provides runtime governance over tool invocations:

```mermaid
flowchart LR
    subgraph REQUEST["Tool Request"]
        REQ["Agent wants to run 'git push origin main'"]
    end

    subgraph TIER1["Tier 1: Deterministic"]
        T1["Pattern match against YAML policy"]
    end

    subgraph TIER2["Tier 2: LLM Classifier"]
        T2["Claude Haiku classifies GREEN/YELLOW/RED"]
    end

    subgraph TIER3["Tier 3: Human"]
        T3["Developer approves/denies in terminal"]
    end

    REQ --> TIER1
    TIER1 -->|"DENY: matches blocked pattern"| DENIED["Blocked"]
    TIER1 -->|"ALLOW: matches grant pattern"| ALLOWED["Permitted"]
    TIER1 -->|"No match (passthrough)"| TIER2
    TIER2 -->|"GREEN"| ALLOWED
    TIER2 -->|"RED"| DENIED
    TIER2 -->|"YELLOW"| TIER3

    style DENIED fill:#dc2626,stroke:#991b1b,color:#ffffff
    style ALLOWED fill:#22c55e,stroke:#166534,color:#000000
    style TIER1 fill:#1e3a5f,stroke:#3b82f6,color:#ffffff
    style TIER2 fill:#3c6b63,stroke:#22c55e,color:#ffffff
    style TIER3 fill:#c77b3f,stroke:#d97706,color:#000000
```

### 6.2 Tier 1: Deterministic Gatekeeper

**File:** `.claude/hooks/tier1-gatekeeper.py`
**Hook type:** `PreToolUse`
**Timeout:** 5 seconds
**Dependencies:** None (pure Python 3)

**How it works:**
1. Read active mode from `.claude/policies/.active-mode`
2. Load corresponding YAML policy from `.claude/policies/modes/{mode}.yaml`
3. Extract command from tool input
4. Check against `blocked` patterns (deny takes priority)
5. Check against `grants` patterns (allow if matched)
6. If no match, return empty `{}` (passthrough to Tier 2)

**Policy YAML structure:**

```yaml
version: 1
mode: default
description: Standard development permissions

blocked:
  - pattern: "rm -rf /[^t]"
    reason: "Prevent destructive filesystem operations"
    source: "CLAUDE.md:Safety Protocol"
  - pattern: "git push origin main"
    reason: "Never push directly to main"
    source: "BRANCH_WORKFLOW.rules.md"

grants:
  bash:
    - pattern: "pnpm (build|test|lint|typecheck)"
      reason: "Standard build/test commands"
      source: "settings.json:allow"
    - pattern: "git (status|diff|log|branch|fetch)"
      reason: "Read-only git operations"
      source: "settings.json:allow"
  read:
    - pattern: ".*"
      reason: "Read access is generally safe"
  write:
    - pattern: ".*"
      reason: "Write access controlled by tool-level permissions"
```

**Design decisions:**
- Blocked rules checked FIRST (deny takes priority over allow)
- Patterns use regex syntax (`|` for alternation, `.*` for wildcard)
- Source field traces each rule to its origin document
- On any error, passthrough (never block on hook failure)

### 6.3 Tier 2: LLM Classifier

**File:** `.claude/hooks/tier2-llm-gatekeeper.py`
**Hook type:** `PermissionRequest`
**Timeout:** 30 seconds
**Dependencies:** `anthropic` SDK (optional — falls back to YELLOW)

**How it works:**
1. Load compiled policy corpus (markdown document with classified examples)
2. Build system prompt with corpus + classification instructions
3. Call Claude Haiku with the tool request description
4. Parse JSON response: `{"classification": "GREEN|YELLOW|RED", "reason": "...", "source": "..."}`
5. Log decision to `decisions.jsonl`

**Fallback safety:** If the API key is missing, SDK is not installed, response fails to parse, or any exception occurs — return YELLOW (passthrough to human). The system never blocks on its own failures.

### 6.4 Policy Modes

Multiple policy modes allow different enforcement postures for different contexts:

| Mode | Use Case | Grants Posture | Restrictions |
|------|----------|----------------|-------------|
| `default` | Normal development | Standard build/test/git | Block destructive ops |
| `testing` | Test execution sessions | Broad test commands, browser automation | Same destructive blocks |
| `rendover` | Visual verification | All browser commands, dev server | Same destructive blocks |
| `deployment` | Production prep | Read-only git, validation only | Block ALL pushes, no dep changes |

**Switching modes:**

```bash
# Switch to testing mode
.claude/hooks/switch-mode.sh testing

# Switch back to default
.claude/hooks/switch-mode.sh default

# Check current mode
cat .claude/policies/.active-mode
```

### 6.5 Compiled Policy Corpus

The Tier 2 LLM classifier needs context about what's allowed and what's not. This context lives in a single compiled markdown file:

```markdown
# Lanternade Codebase Policy Corpus

## 1. Git Operations
1.1 Push to main branch → RED (always blocked)
1.2 Force push → RED (unless user explicitly requests)
1.3 Read-only git (status, diff, log) → GREEN
1.4 Standard workflow (add, commit, checkout) → GREEN
...

## Classification Guide
GREEN: Safe, routine, well-understood operations
YELLOW: Ambiguous, needs human judgment, first-time patterns
RED: Destructive, irreversible, violates documented policy
```

### 6.6 Wiring Hooks in Claude Code

Configure hooks in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": { "tool_name": "Bash|Edit|Write|NotebookEdit" },
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/tier1-gatekeeper.py",
            "timeout": 5000
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": {},
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/tier2-llm-gatekeeper.py",
            "timeout": 30000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": { "tool_name": "Bash|Edit|Write" },
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/decision-logger.py",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

---

## 7. Secret Detection and Certified Exceptions

### 7.1 The False Positive Problem

Documentation files, example configurations, and test fixtures frequently contain strings that look like secrets but aren't:

```markdown
# Example: Authenticate with AWS
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE    ← This IS the official AWS example key
export AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/...  ← This IS the official AWS example secret
```

Blocking these creates a choice: exempt all documentation (dangerous) or handle every false positive manually (unsustainable).

### 7.2 String-Based Exceptions (Not Path-Based)

**The solution:** Certify specific strings as safe, NOT entire file types.

```yaml
# BAD: Path-based exception (v1.0 approach — too permissive)
path_exceptions:
  - pattern: '\.md$'  # Exempts ALL markdown — a real secret in docs slips through!

# GOOD: String-based exception (v2.0 approach — precise)
certified_strings:
  - string: "AKIAIOSFODNN7EXAMPLE"
    category: aws_example
    reason: "Official AWS documentation example key - not a real key"
    source: "https://docs.aws.amazon.com/IAM/latest/UserGuide/"
    approved_date: "2026-01-14"
```

**The philosophy:**
1. Don't exempt file types — any file can contain a leak
2. Do exempt specific strings — allowlist known-safe examples
3. Minimal path exceptions — only for files that define patterns (config, lockfiles, the hook itself)

### 7.3 Certified Exception Registry Structure

```yaml
# .castle-walls/certified-exceptions.yaml

version: "2.0.0"
last_updated: "2026-01-14"

certified_strings:
  # Category: aws_example
  - string: "AKIAIOSFODNN7EXAMPLE"
    category: aws_example
    reason: "Official AWS documentation example key"
    approved_date: "2026-01-14"

  # Category: placeholder
  - string: "your-api-key-here"
    category: placeholder
    reason: "Instructional placeholder"
    approved_date: "2026-01-14"

  # Category: db_example
  - string: "postgresql://user:password@"
    category: db_example
    reason: "Generic example showing connection string format"
    approved_date: "2026-01-14"

  # Category: pattern_documentation
  - string: "AKIA[0-9A-Z]{16}"
    category: pattern_documentation
    reason: "Regex pattern showing what we detect - not an actual key"
    approved_date: "2026-01-14"

path_exceptions:
  - pattern: '\.example$'
    reason: ".example files contain placeholders by design"
  - pattern: '\.gitleaks\.toml$'
    reason: "Gitleaks config contains patterns being configured"
  - pattern: 'pnpm-lock\.yaml$'
    reason: "Lock files contain hashes, not secrets"
  - pattern: 'certified-exceptions\.yaml$'
    reason: "This registry file defines safe strings"
  - pattern: '\.husky/pre-commit$'
    reason: "Pre-commit hook contains pattern definitions"

audit_log:
  - date: "2026-01-14"
    action: "v2.0 - Switch from path-based to string-based exceptions"
    reason: "Prevent accidental secret leaks in markdown files"
```

### 7.4 Adding New Exceptions

**Protocol:**
1. Document the exact string and why it is known-safe
2. Add to `certified_strings` in the registry YAML
3. Update the `SAFE_STRINGS` grep pattern in the pre-commit hook
4. Record in the `audit_log` section
5. Commit the change with PR review

**Never add:**
- Real API keys or secrets
- Patterns that could match real secrets
- Blanket file type exclusions (`.md$`, `.ts$`)
- Entire directory exclusions

### 7.5 Gitleaks Integration

For comprehensive coverage beyond pattern matching, integrate Gitleaks:

```toml
# .gitleaks.toml
[extend]
useDefault = true

[allowlist]
paths = [
  '\.env\.example$',
  '__tests__/',
  '\.test\.ts$',
  'pnpm-lock\.yaml$',
]
regexes = [
  'AKIAIOSFODNN7EXAMPLE',
  'sk-proj-\.\.\.',
  'password123',
]

# Custom rules for your stack
[[rules]]
id = "neon-connection-string"
description = "Neon PostgreSQL connection string"
regex = '''postgresql://[^:]+:[^@]+@ep-[a-z]+-[a-z]+-[a-z0-9]+\..*\.neon\.tech'''
secretGroup = 0
entropy = 3.5
tags = ["database", "critical"]

[[rules]]
id = "your-saas-api-key"
description = "Your SaaS service API key"
regex = '''ssk_[a-zA-Z0-9]{32,}'''
secretGroup = 0
tags = ["auth", "critical"]
```

---

## 8. Stack-Oriented Configuration

### 8.1 Adapting Walls to Your Stack

The wall system must be configured for the specific technology stack. The following matrix maps common stacks to wall implementations:

#### TypeScript / Node.js / Bun

| Wall | Command | Notes |
|------|---------|-------|
| Wall 2 (TypeCheck) | `bun run typecheck` or `npx tsc --noEmit` | Use `tsconfig.json` paths |
| Wall 2 (Lint) | `bun run lint` or `npx biome check` | Biome preferred over ESLint |
| Wall 2.5 (Deps) | `bun scripts/dependency-validator.ts` | Custom validator |
| Wall 2.7 (Shebang) | Check for `#!/usr/bin/env bun` | Standardize on one runtime |
| Wall 3 (Tests) | `timeout 10 bun run test --run` | Vitest with `--run` for non-watch |

#### Python

| Wall | Command | Notes |
|------|---------|-------|
| Wall 2 (TypeCheck) | `mypy --strict .` or `pyright` | Type stub coverage matters |
| Wall 2 (Lint) | `ruff check .` | Ruff preferred over flake8 |
| Wall 2.5 (Deps) | `pip-audit` or custom validator | Check for known vulnerabilities |
| Wall 2.7 (Shebang) | Check for `#!/usr/bin/env python3` | Prevent python2 drift |
| Wall 3 (Tests) | `timeout 30 pytest --timeout=10` | Per-test timeouts too |

#### Rust

| Wall | Command | Notes |
|------|---------|-------|
| Wall 2 (TypeCheck) | `cargo check` | The compiler IS the type checker |
| Wall 2 (Lint) | `cargo clippy -- -D warnings` | Treat warnings as errors in CI |
| Wall 2.5 (Deps) | `cargo audit` | Built-in vulnerability checking |
| Wall 2.7 (Shebang) | N/A | Compiled language, no shebangs |
| Wall 3 (Tests) | `timeout 30 cargo test` | Can be slow for large projects |

#### Go

| Wall | Command | Notes |
|------|---------|-------|
| Wall 2 (TypeCheck) | `go vet ./...` | Static analysis |
| Wall 2 (Lint) | `golangci-lint run` | Aggregated linter |
| Wall 2.5 (Deps) | `go mod verify` | Module verification |
| Wall 2.7 (Shebang) | N/A | Compiled language |
| Wall 3 (Tests) | `timeout 30 go test ./... -short` | Use `-short` for pre-commit |

### 8.2 Conditional Execution

Run walls only when relevant files are staged:

```bash
# Only run TypeScript checks if .ts/.tsx files are staged
TS_FILES_STAGED=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)
if [ -n "$TS_FILES_STAGED" ]; then
    echo "▸ WALL 2: Static Analysis..."
    # ... run type check and lint
else
    echo "▸ WALL 2: Static Analysis (skipped - no TS files staged)"
fi

# Only run dependency validation if package files are staged
DEP_FILES_STAGED=$(echo "$STAGED_FILES" | grep -E '(package\.json|pnpm-lock\.yaml)' || true)
if [ -n "$DEP_FILES_STAGED" ]; then
    echo "▸ WALL 2.5: Dependency Validation..."
fi
```

### 8.3 Domain-Specific Walls

Beyond the standard walls, codebases benefit from domain-specific checks. These use fractional numbering to slot between standard walls:

| Wall | Domain | Example Check |
|------|--------|---------------|
| 2.1 | CSS/Styling | Shorthand/longhand conflict detection |
| 2.3 | SQL/Migrations | Schema change review requirements |
| 2.5 | Dependencies | Package validation (standard) |
| 2.7 | Runtime | Shebang compliance (standard) |
| 2.9 | Security | OWASP pattern scanning |

---

## 9. Expedition Mode and Bypass Conventions

### 9.1 Expedition Mode

For trivial, manually-verified commits (typo fixes, documentation tweaks), provide a fast path that skips advisory walls:

```bash
# Detect expedition mode from branch name
if echo "$CURRENT_BRANCH" | grep -qi "expedite"; then
    EXPEDITION_MODE=1
fi
```

**When expedition mode is active:**
- Wall 0 (Branch/Stash): SKIPPED
- Wall 1 (Secrets): STILL RUNS (never skip security)
- Wall 2 (Static Analysis): SKIPPED
- Wall 2.5 (Dependencies): SKIPPED
- Wall 2.7 (Shebang): SKIPPED
- Wall 3 (Tests): SKIPPED
- Wall 7 (Large Files): STILL RUNS (advisory, minimal cost)

**Activation:** Branch names containing `expedite` (case-insensitive):
- `expedite/quick-fix`
- `fix/expedite-typo`
- `docs/expedite-readme`

**Expedition mode outputs a distinct banner:**

```
╔════════════════════════════════════════════════════════════════╗
║       ⚡ EXPEDITION MODE - User-Approved Fast Path ⚡          ║
╠════════════════════════════════════════════════════════════════╣
║  Only Wall 1 (Secrets) will run. Advisory walls skipped.      ║
╚════════════════════════════════════════════════════════════════╝
```

### 9.2 Environment Variable Bypasses

For specific walls, provide targeted bypass flags:

| Bypass | Effect | When to Use |
|--------|--------|-------------|
| `SKIP_SECRET_CHECK=1` | Skip Wall 1 (secrets) | Confirmed false positive ONLY |
| `SKIP_TESTS=1` | Skip Wall 3 (tests) | Tests broken by upstream, fix in progress |
| `--no-verify` | Skip ALL hooks | Emergency only — document in commit |

**Every bypass must be documented in the commit message:**

```bash
# GOOD: Bypass with documentation
SKIP_SECRET_CHECK=1 git commit -m "docs: add AWS example key (false positive bypass)"

# BAD: Silent bypass
SKIP_SECRET_CHECK=1 git commit -m "update docs"
```

---

## 10. Agentic Workflow Integration

### 10.1 Why Agentic Workflows Need Special Walls

AI coding assistants (Claude Code, Cursor, etc.) have unique failure modes that human developers don't:

| Failure Mode | Human Risk | Agent Risk | Mitigation |
|-------------|-----------|-----------|------------|
| Commit to wrong branch | Low (humans check) | **High** (agents lose context) | Wall 0: branch detection |
| Forget about stashes | Medium | **Critical** (agents can't see stashes) | Wall 0: stash warning |
| Install wrong package | Low (humans read names) | **High** (agents may confuse similar names) | Wall 2.5: semantic collision |
| Run destructive commands | Low (humans hesitate) | **High** (agents execute without pause) | Policy engine: Tier 1 blocks |
| Scope drift across branches | Low (humans track context) | **High** (agents continue on current branch) | Wall 0 + branch workflow rules |

### 10.2 Hook Type Mapping

Claude Code provides three hook points that map to the permission tiers:

| Hook Point | Fires When | Use For |
|-----------|-----------|---------|
| `PreToolUse` | Before a tool is invoked | Tier 1: Fast allow/deny by pattern |
| `PermissionRequest` | When tool needs permission | Tier 2: LLM classification |
| `PostToolUse` | After a tool completes | Decision logging (audit trail) |

### 10.3 The Audit Trail

Every tool invocation is logged to `decisions.jsonl`:

```json
{
  "timestamp": "2026-02-12T14:30:00Z",
  "tier": 2,
  "tool_name": "Bash",
  "tool_input_summary": "git push origin main",
  "classification": "RED",
  "reason": "Direct push to main is always blocked",
  "source_policy": "Section 1.1",
  "mode": "default",
  "session_id": "abc123"
}
```

This log enables:
- **Post-mortem analysis** after incidents
- **Policy tuning** based on real usage patterns
- **Compliance auditing** for sensitive codebases
- **Training data** for improving Tier 2 classifications

---

## 11. Pre-Push Gates and Branch Protection

### 11.1 Protected Branch Enforcement

The pre-push hook provides BLOCKING protection for protected branches:

```bash
PROTECTED_BRANCHES="main master"

for protected in $PROTECTED_BRANCHES; do
    if [ "$current_branch" = "$protected" ]; then
        echo "🚫 PUSH TO '$protected' BLOCKED"
        echo ""
        echo "REQUIRED WORKFLOW:"
        echo "  1. git checkout -b feat/your-feature-name"
        echo "  2. git push origin feat/your-feature-name"
        echo "  3. Create a PR on GitHub"
        exit 1
    fi
done
```

### 11.2 Branch Naming Validation

Advisory check for naming convention compliance:

```bash
valid_prefixes="feat/ fix/ docs/ refactor/ infra/ test/ chore/ proto/"
is_valid=false

for prefix in $valid_prefixes; do
    case "$current_branch" in
        $prefix*) is_valid=true; break ;;
    esac
done

if [ "$is_valid" = false ]; then
    echo "⚠ Branch '$current_branch' doesn't follow naming convention"
    echo "  Recommended: feat/, fix/, docs/, refactor/, infra/, test/, chore/"
fi
```

### 11.3 PR Readiness Reminders

On first push of a new branch, remind about PR conventions:

```bash
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)

if [ -z "$upstream" ] || [ "$upstream" = "@{u}" ]; then
    echo "╔═══════════════════════════════════╗"
    echo "║  New branch push detected          ║"
    echo "╠═══════════════════════════════════╣"
    echo "║  Create PR description file first: ║"
    echo "║  docs/pr-descriptions/PR_DESC_...  ║"
    echo "╚═══════════════════════════════════╝"
fi
```

---

## 12. Observability, Audit Trails, and Telemetry

### 12.1 Decision Logging

All policy engine decisions are logged as JSONL (one JSON object per line):

**Location:** `.claude/hooks/logs/decisions.jsonl`

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | When the decision was made |
| `tier` | number | Which tier made the decision (1, 2, "post") |
| `tool_name` | string | Tool that was invoked (Bash, Edit, Write) |
| `tool_input_summary` | string | Truncated summary of the request |
| `classification` | string | GREEN, YELLOW, RED, or tool output summary |
| `reason` | string | Why this classification was chosen |
| `source_policy` | string | Which policy section was referenced |
| `mode` | string | Active policy mode at decision time |
| `session_id` | string | Claude session identifier (for correlation) |

### 12.2 Error Logging

Separate error logs per tier prevent noisy failures from obscuring real issues:

```
.claude/hooks/logs/
├── decisions.jsonl          # All decisions (append-only)
├── tier1-errors.log         # Tier 1 gatekeeper errors
└── tier2-errors.log         # Tier 2 LLM classifier errors
```

### 12.3 Duration Telemetry

Track wall execution times to detect performance regressions:

```bash
WALL_START=$(date +%s%N 2>/dev/null || date +%s)
# ... run wall ...
WALL_END=$(date +%s%N 2>/dev/null || date +%s)
WALL_DURATION=$(( (WALL_END - WALL_START) / 1000000 ))  # milliseconds
```

---

## 13. Runbook and Troubleshooting Patterns

### 13.1 Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Castle Walls not running" | Husky not initialized | `npx husky install` |
| "Permission denied on pre-commit" | Hook not executable | `chmod +x .husky/pre-commit` |
| Wall 1 false positive on docs | Example key in documentation | Add to certified exceptions |
| Wall 2 timeout | Type checking entire project | Add `--incremental` flag |
| Wall 3 hanging | Test has no timeout | Add `timeout 10` wrapper |
| "Tier 1 gatekeeper error" | YAML parse failure | Check `.claude/policies/modes/{mode}.yaml` syntax |
| "Tier 2 no API key" | Missing `ANTHROPIC_API_KEY` | Falls back to YELLOW (safe) |

### 13.2 Diagnostic Commands

```bash
# Check which hooks are installed
ls -la .husky/

# Check if hooks are executable
file .husky/pre-commit

# Manually run Castle Walls
.husky/pre-commit

# Check active policy mode
cat .claude/policies/.active-mode

# View recent decisions
tail -20 .claude/hooks/logs/decisions.jsonl | python3 -m json.tool

# View errors
cat .claude/hooks/logs/tier1-errors.log
cat .claude/hooks/logs/tier2-errors.log

# Run full quality suite manually
bun run typecheck && bun run lint && bun run test --run
```

### 13.3 Recovery Procedures

#### "I accidentally committed a secret"

```bash
# 1. Remove the secret from the file
# 2. Commit the removal
git add . && git commit -m "fix: remove leaked credential"

# 3. If already pushed, ROTATE THE SECRET IMMEDIATELY
# The secret is in git history forever. Rotation is mandatory.

# 4. Optionally rewrite history (only if not shared)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file' HEAD
```

#### "Castle Walls is blocking my commit and I can't figure out why"

```bash
# 1. Check which wall is blocking
.husky/pre-commit  # Run manually, read output

# 2. If Wall 1 (secrets), check the flagged content
git diff --cached | grep -E 'sk-|ghp_|AKIA'

# 3. If false positive, add to certified exceptions
# Edit .castle-walls/certified-exceptions.yaml

# 4. Emergency bypass (DOCUMENT IN COMMIT)
SKIP_SECRET_CHECK=1 git commit -m "docs: bypass false positive (AKIAEXAMPLE)"
```

---

## 14. Extension, Graduation, and Roadmap Patterns

### 14.1 Adding New Walls

To add a new wall:

1. **Choose a wall number** — use fractional numbering between existing walls
2. **Write the check** — follow the per-wall output format
3. **Add expedition mode skip** — wrap in `if [ $EXPEDITION_MODE -eq 0 ]`
4. **Add status tracking** — create `NEW_WALL_STATUS=0` variable
5. **Add to summary report** — include in the final dashboard
6. **Document in runbook** — add troubleshooting entries

```bash
# Example: Wall 2.3 — Migration Safety
if [ $EXPEDITION_MODE -eq 0 ]; then
    MIGRATION_FILES=$(echo "$STAGED_FILES" | grep -E 'migrations/' || true)
    if [ -n "$MIGRATION_FILES" ]; then
        echo "▸ WALL 2.3: Migration Safety..."
        echo "  ⚠ Migration files staged. Verify:"
        echo "    - Schema changes are reversible"
        echo "    - Migration has corresponding rollback"
        echo "    - Data migration tested on staging"
        MIGRATION_STATUS=1
    fi
fi
```

### 14.2 Graduation Protocol

When graduating a wall from advisory to blocking:

```mermaid
flowchart TD
    subgraph CRITERIA["Graduation Criteria"]
        C1["False positive rate < 1%"]
        C2["Running advisory for 30+ days"]
        C3["CI enforces same check"]
        C4["Team consensus"]
    end

    subgraph PROCESS["Graduation Process"]
        P1["Document decision in WALL_DESIGN_DECISIONS.md"]
        P2["Change exit code from 0 to 1 on failure"]
        P3["Add bypass flag for emergencies"]
        P4["Update runbook with recovery steps"]
        P5["Announce to team"]
    end

    C1 --> P1
    C2 --> P1
    C3 --> P1
    C4 --> P1
    P1 --> P2 --> P3 --> P4 --> P5

    style C1 fill:#fef3c7,stroke:#d97706,color:#000000
    style C2 fill:#fef3c7,stroke:#d97706,color:#000000
    style P5 fill:#22c55e,stroke:#166534,color:#000000
```

### 14.3 Roadmap Phases

A typical Castle Walls evolution:

| Phase | Walls | Focus |
|-------|-------|-------|
| **v0.1** | Wall 1 (secrets) only | Security foundation |
| **v0.3** | + Wall 0 (branch) + Wall 2 (static) | Developer workflow |
| **v0.5** | + Wall 2.5 (deps) + Wall 3 (tests) | Quality depth |
| **v0.8** | + Wall 2.7 (runtime) + Wall 7 (assets) + Expedition | Completeness |
| **v1.0** | Graduate Wall 2 + Wall 3 to blocking | Enforcement maturity |
| **v1.5** | + Policy engine (Tier 1 + 2 + 3) | Agentic governance |
| **v2.0** | + CI mirroring + telemetry dashboard | Observability |

### 14.4 CI Mirroring

Castle Walls checks should eventually be mirrored in CI for defense-in-depth:

```yaml
# .github/workflows/quality.yml
name: Quality Gates
on: [pull_request]

jobs:
  castle-walls-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - name: Wall 1 - Secrets
        run: gitleaks detect --source . --no-banner
      - name: Wall 2 - TypeCheck
        run: bun run typecheck
      - name: Wall 2 - Lint
        run: bun run lint
      - name: Wall 2.5 - Dependencies
        run: bun scripts/dependency-validator.ts --strict
      - name: Wall 3 - Tests
        run: bun run test --run
```

---

## 15. Verification and Self-Test

### 15.1 Self-Test Script

Create a script that verifies the Castle Walls system is correctly installed:

```bash
# scripts/test-castle-walls.sh
#!/bin/sh
echo "Castle Walls Self-Test"
echo "====================="

# Check hooks exist and are executable
check_hook() {
    if [ -x ".husky/$1" ]; then
        echo "  ✓ $1 hook exists and is executable"
    else
        echo "  ✗ $1 hook missing or not executable"
    fi
}

check_hook "pre-commit"
check_hook "pre-push"

# Check policy files
if [ -f ".claude/policies/.active-mode" ]; then
    MODE=$(cat .claude/policies/.active-mode)
    echo "  ✓ Policy engine active (mode: $MODE)"
else
    echo "  ○ Policy engine not configured"
fi

# Check certified exceptions
if [ -f ".castle-walls/certified-exceptions.yaml" ]; then
    echo "  ✓ Certified exceptions registry exists"
else
    echo "  ○ No certified exceptions registry"
fi

# Check gitleaks
if command -v gitleaks >/dev/null 2>&1; then
    echo "  ✓ Gitleaks installed ($(gitleaks version))"
else
    echo "  ○ Gitleaks not installed (Layer 2 secret detection unavailable)"
fi

echo ""
echo "Self-test complete."
```

### 15.2 Completeness Checklist

Before considering a Castle Walls implementation complete:

**Foundation (Required):**
- [ ] Pre-commit hook exists and is executable
- [ ] Wall 1 (secrets) is BLOCKING with high-confidence patterns
- [ ] At least one advisory wall (static analysis or tests) is active
- [ ] Summary report prints after every commit
- [ ] Duration tracking is active with target threshold
- [ ] Recovery instructions provided for every blocking failure

**Branch Protection (Required):**
- [ ] Pre-push hook blocks pushes to protected branches
- [ ] Branch naming convention validated (advisory)
- [ ] Recovery instructions provided for accidental main commits

**Configuration (Recommended):**
- [ ] Certified exceptions registry created
- [ ] Gitleaks configured with custom rules for your stack
- [ ] Expedition mode available for fast-path commits
- [ ] Conditional wall execution (only run when relevant files staged)
- [ ] Runbook documented with troubleshooting entries

**Agentic Integration (If Applicable):**
- [ ] Tier 1 deterministic gatekeeper wired to PreToolUse
- [ ] Policy modes defined for different development contexts
- [ ] Decision logging active (PostToolUse)
- [ ] Tier 2 LLM classifier configured (optional, adds intelligence)
- [ ] `.claude/settings.local.json` hook wiring verified

**Observability (Recommended):**
- [ ] Wall duration tracked and warned when exceeding target
- [ ] Error logs separated per tier
- [ ] Decision audit trail in JSONL format
- [ ] Self-test script created and passing

---

## Reference: Lanternade Implementation

### File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `.husky/pre-commit` | 597 | Castle Walls v0.8.0 (7 walls) |
| `.husky/pre-push` | 162 | Branch protection + heraldry reminders |
| `.husky/post-rebase` | 18 | Cache invalidation |
| `.claude/hooks/tier1-gatekeeper.py` | 319 | Deterministic permission gatekeeper |
| `.claude/hooks/tier2-llm-gatekeeper.py` | 225 | LLM-based permission classifier |
| `.claude/hooks/decision-logger.py` | 90 | PostToolUse audit logger |
| `.claude/hooks/switch-mode.sh` | 56 | Mode switching CLI |
| `.claude/policies/modes/default.yaml` | 96 | Standard development policy |
| `.claude/policies/modes/testing.yaml` | ~80 | Testing-focused policy |
| `.claude/policies/modes/rendover.yaml` | ~80 | Visual verification policy |
| `.claude/policies/modes/deployment.yaml` | ~70 | Locked-down deployment policy |
| `.claude/policies/corpus/compiled-policy.md` | 126 | Policy corpus for Tier 2 LLM |
| `.castle-walls/certified-exceptions.yaml` | 188 | Safe strings registry v2.0 |
| `.gitleaks.toml` | 142 | Gitleaks custom rules |

### Documentation Inventory

| Document | Purpose |
|----------|---------|
| `docs/INFRA/castle-walls/CASTLE_WALLS_DIDACTIC_RETROSPECTIVE.md` | Architecture analysis and roadmap |
| `docs/INFRA/castle-walls/CERTIFIED_EXCEPTIONS_V2_RATIONALE.md` | Design rationale for string-based exceptions |
| `docs/OPERATIONS/CASTLE_WALLS_RUNBOOK.md` | Troubleshooting and recovery procedures |
| `docs/governance/CASTLE_WALLS_CODEBASE_CONTEXT_SYSTEM_SETUP.md` | This document |

### Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    CASTLE WALLS v0.8.0                        │
├─────────────────────────────────────────────────────────────┤
│  Hooks Active:        3 (pre-commit, pre-push, post-rebase)  │
│  Quality Gates:       7 walls (0, 1, 2, 2.5, 2.7, 3, 7)     │
│  Blocking Gates:      1 (secrets only)                       │
│  Advisory Gates:      6                                      │
│  Target Duration:     < 30 seconds                           │
│  Actual Duration:     8-10 seconds typical                   │
│  Secret Patterns:     15+ high-confidence                    │
│  Certified Strings:   34 safe examples                       │
│  Path Exceptions:     5 (minimal)                            │
│  Policy Modes:        4 (default, testing, rendover, deploy) │
│  Permission Tiers:    3 (deterministic, LLM, human)          │
│  Audit Log Format:    JSONL (append-only)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Branch discipline, commit conventions |
| `.claude/rules/BRANCH_WORKFLOW.rules.md` | Branch creation, stash handling, scope drift |
| `.claude/rules/DEPENDENCY_VALIDATION.rules.md` | Package validation rules |
| `.claude/rules/INDEX.md` | Master trigger-to-rule mapping |
| `docs/governance/PR_HERALDRY_COMPLETENESS_CODEBASE_CONTEXT_SYSTEM_SETUP.md` | Companion system setup for PR descriptions |
| `docs/incidents/INCIDENT_2025_01_06_SEMANTIC_DEPENDENCY_INTRUSION.md` | Incident that spawned Wall 2.5 |
| `docs/incidents/INCIDENT_2025_12_30_BRANCH_WORKFLOW_FAILURE.md` | Incident that spawned Wall 0 |

---

_Part of the Lanternade governance system._
