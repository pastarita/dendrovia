#!/bin/sh
# ════════════════════════════════════════════════════════════════
# Castle Walls Self-Test — Dendrovia Monorepo
#
# Verifies that the Castle Walls system is correctly installed.
# Run: sh scripts/test-castle-walls.sh
# ════════════════════════════════════════════════════════════════

echo "Castle Walls Self-Test"
echo "====================="
echo ""

PASS=0
FAIL=0
SKIP=0

check_pass() {
    echo "  ✓ $1"
    PASS=$((PASS + 1))
}

check_fail() {
    echo "  ✗ $1"
    FAIL=$((FAIL + 1))
}

check_skip() {
    echo "  ○ $1"
    SKIP=$((SKIP + 1))
}

# ── Git Hooks ────────────────────────────────────────────────
echo "Git Hooks:"

if [ -x ".husky/pre-commit" ]; then
    check_pass "pre-commit hook exists and is executable"
else
    check_fail "pre-commit hook missing or not executable"
fi

if [ -x ".husky/pre-push" ]; then
    check_pass "pre-push hook exists and is executable"
else
    check_fail "pre-push hook missing or not executable"
fi

if [ -x ".husky/post-rebase" ]; then
    check_pass "post-rebase hook exists and is executable"
else
    check_fail "post-rebase hook missing or not executable"
fi

echo ""

# ── Policy Engine ────────────────────────────────────────────
echo "Permission Policy Engine:"

if [ -f ".claude/hooks/tier1-gatekeeper.py" ]; then
    check_pass "Tier 1 gatekeeper exists"
else
    check_fail "Tier 1 gatekeeper missing"
fi

if [ -f ".claude/hooks/tier2-llm-gatekeeper.py" ]; then
    check_pass "Tier 2 LLM gatekeeper exists"
else
    check_fail "Tier 2 LLM gatekeeper missing"
fi

if [ -f ".claude/hooks/decision-logger.py" ]; then
    check_pass "Decision logger exists"
else
    check_fail "Decision logger missing"
fi

if [ -x ".claude/hooks/switch-mode.sh" ]; then
    check_pass "Mode switcher exists and is executable"
else
    check_fail "Mode switcher missing or not executable"
fi

if [ -f ".claude/policies/.active-mode" ]; then
    MODE=$(cat .claude/policies/.active-mode)
    check_pass "Policy engine active (mode: $MODE)"
else
    check_fail "No active mode file"
fi

echo ""

# ── Policy Modes ─────────────────────────────────────────────
echo "Policy Modes:"

for mode in default testing rendover deployment; do
    if [ -f ".claude/policies/modes/$mode.yaml" ]; then
        check_pass "$mode.yaml exists"
    else
        check_fail "$mode.yaml missing"
    fi
done

if [ -f ".claude/policies/corpus/compiled-policy.md" ]; then
    check_pass "Compiled policy corpus exists"
else
    check_fail "Compiled policy corpus missing"
fi

echo ""

# ── Configuration ────────────────────────────────────────────
echo "Configuration:"

if [ -f ".castle-walls/certified-exceptions.yaml" ]; then
    check_pass "Certified exceptions registry exists"
else
    check_fail "Certified exceptions registry missing"
fi

if [ -f ".gitleaks.toml" ]; then
    check_pass "Gitleaks configuration exists"
else
    check_fail "Gitleaks configuration missing"
fi

if [ -f ".claude/settings.local.json" ]; then
    check_pass "Hook wiring (settings.local.json) exists"
else
    check_fail "Hook wiring missing"
fi

echo ""

# ── External Tools ───────────────────────────────────────────
echo "External Tools:"

if command -v gitleaks >/dev/null 2>&1; then
    check_pass "Gitleaks installed ($(gitleaks version 2>/dev/null || echo 'unknown'))"
else
    check_skip "Gitleaks not installed (Wall 1 Layer 2 unavailable)"
fi

if command -v bun >/dev/null 2>&1; then
    check_pass "Bun runtime available ($(bun --version 2>/dev/null))"
else
    check_fail "Bun runtime not available"
fi

if command -v python3 >/dev/null 2>&1; then
    check_pass "Python 3 available ($(python3 --version 2>/dev/null))"
else
    check_fail "Python 3 not available (policy engine requires it)"
fi

echo ""

# ── Governance Rules ─────────────────────────────────────────
echo "Governance Rules:"

if [ -f ".claude/rules/CASTLE_WALLS.rules.md" ]; then
    check_pass "Castle Walls rules file exists"
else
    check_fail "Castle Walls rules file missing"
fi

if grep -q "CASTLE_WALLS" ".claude/rules/INDEX.md" 2>/dev/null; then
    check_pass "Castle Walls registered in INDEX.md"
else
    check_fail "Castle Walls not registered in INDEX.md"
fi

if grep -q "Castle Walls" "CLAUDE.md" 2>/dev/null; then
    check_pass "Castle Walls referenced in CLAUDE.md"
else
    check_fail "Castle Walls not referenced in CLAUDE.md"
fi

echo ""

# ── Summary ──────────────────────────────────────────────────
echo "═══════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed, $SKIP skipped"
echo "═══════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
