# Dendrovia Codebase Policy Corpus

> Compiled policy document for Tier 2 LLM classifier.
> This file provides context for ambiguous permission decisions.

## 1. Git Operations

1.1 Push to main/master branch -> RED (always blocked)
1.2 Force push to any branch -> RED (unless user explicitly requests)
1.3 Read-only git (status, diff, log, show, branch) -> GREEN
1.4 Standard workflow (add, commit, checkout, switch) -> GREEN
1.5 Push to feature branches (feat/, fix/, docs/, etc.) -> GREEN
1.6 Rebase on feature branches -> GREEN
1.7 Hard reset -> RED (destroys uncommitted work)
1.8 Clean -f -> RED (permanently deletes untracked files)
1.9 Stash operations -> GREEN (but Wall 0 warns about stash risk)
1.10 Cherry-pick -> GREEN (non-destructive)
1.11 Branch deletion (local) -> YELLOW (confirm which branch)
1.12 Branch deletion (remote) -> RED (affects shared state)

## 2. Build and Development

2.1 bun install -> GREEN (dependency installation)
2.2 bun run dev/build/lint/typecheck/test/parse -> GREEN (standard scripts)
2.3 turbo run build/test/lint -> GREEN (orchestration)
2.4 bun add <package> -> YELLOW (new dependency — verify package name)
2.5 bun remove <package> -> YELLOW (dependency removal — verify not core)
2.6 Remove typescript or @types/bun -> RED (core dependencies)
2.7 npm/yarn/pnpm commands -> RED (wrong package manager for Dendrovia)

## 3. File System Operations

3.1 Read any file -> GREEN
3.2 Edit source files in packages/ -> GREEN
3.3 Edit configuration files (.env, tsconfig, etc.) -> YELLOW
3.4 Create new files in packages/ -> GREEN
3.5 Delete source files -> YELLOW (verify not imported elsewhere)
3.6 Recursive deletion (rm -rf) -> RED (except node_modules, .turbo, dist)
3.7 Edit .claude/ configuration -> YELLOW (affects governance)
3.8 Edit .husky/ hooks -> YELLOW (affects commit pipeline)

## 4. Dendrovia-Specific

4.1 Run CHRONOS parser (bun run parse) -> GREEN
4.2 Modify generated/ output files -> GREEN (they are regenerated)
4.3 Edit shared type contracts (packages/shared/) -> YELLOW (affects all pillars)
4.4 Modify turbo.json pipeline -> YELLOW (affects build orchestration)
4.5 Edit CLAUDE.md -> YELLOW (affects AI assistant behavior)
4.6 Modify heraldry system (lib/heraldry/) -> GREEN
4.7 Edit PR templates (docs/pr-descriptions/) -> GREEN

## 5. Secret and Credential Handling

5.1 Creating .env files -> YELLOW (verify no real secrets)
5.2 Hardcoding API keys -> RED (always blocked)
5.3 Referencing environment variables -> GREEN
5.4 Modifying certified exceptions -> YELLOW (requires justification)

## Classification Guide

GREEN: Safe, routine, well-understood operations that don't affect shared state
YELLOW: Ambiguous, needs human judgment, first-time patterns, or affects config
RED: Destructive, irreversible, violates documented policy, or affects credentials
