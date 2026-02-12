# Dendrovia: Multi-Checkout Workflow

## Architecture Overview

Dendrovia uses a **single monorepo** with **multiple working copies** (checkouts). Each checkout has a pillar-specific `CLAUDE.md` that provides focused context for AI assistants.

### Structure

```
denroot/
├── CHRONOS/              ← git clone of dendrovia (focus: packages/chronos)
├── IMAGINARIUM/          ← git clone of dendrovia (focus: packages/imaginarium)
├── ARCHITECTUS/
│   └── dendrovia/        ← THE SOURCE monorepo
├── LUDUS/                ← git clone of dendrovia (focus: packages/ludus)
├── OCULUS/               ← git clone of dendrovia (focus: packages/oculus)
└── OPERATUS/             ← git clone of dendrovia (focus: packages/operatus)
```

**Key Concept:** It's like having 6 developers on different machines, all working on the same codebase - except they're all you, wearing different "hats."

---

## Why This Architecture?

### 1. Cognitive Focus

Each checkout has a **pillar-specific CLAUDE.md** that tells AI assistants:
- "You're working in CHRONOS - focus on Git/AST parsing"
- "You're working in IMAGINARIUM - focus on AI distillation"
- etc.

This provides **strong context** without the AI needing to understand the entire system.

### 2. Parallel Development

You can:
- Have CHRONOS open in one terminal (working on parsing)
- Have IMAGINARIUM open in another (working on shaders)
- Have ARCHITECTUS open in a third (working on rendering)

Each has **focused context**, but they all share the same commit history.

### 3. Simpler Than Worktrees

Unlike git worktrees:
- ✅ Standard `git clone` (everyone understands this)
- ✅ Each checkout is fully independent
- ✅ No special commands needed
- ✅ Can use any git GUI/tool

### 4. Production Code Only

All experimentation happens **inside the monorepo**:
```
packages/chronos/
  ├── src/              # Production code
  ├── experiments/      # Tracked experiments
  └── README.md
```

No need for separate "experiment repos."

---

## Initial Setup (One Time)

### 1. Initialize the Source Monorepo

```bash
cd /Users/Patmac/denroot/ARCHITECTUS/dendrovia
git add .
git commit -m "feat: Initial six-pillar architecture"
git remote add origin git@github.com:yourusername/dendrovia.git
git push -u origin main
```

### 2. Clone into Each Checkout Folder

```bash
# CHRONOS
cd /Users/Patmac/denroot
git clone git@github.com:yourusername/dendrovia.git CHRONOS

# IMAGINARIUM
git clone git@github.com:yourusername/dendrovia.git IMAGINARIUM

# LUDUS
git clone git@github.com:yourusername/dendrovia.git LUDUS

# OCULUS
git clone git@github.com:yourusername/dendrovia.git OCULUS

# OPERATUS
git clone git@github.com:yourusername/dendrovia.git OPERATUS

# Note: ARCHITECTUS already contains the source, so skip it
```

### 3. Add Pillar-Specific CLAUDE.md to Each Checkout

These files are **untracked** (excluded via .gitignore):

```bash
# Copy the existing CLAUDE.md files
cp /Users/Patmac/denroot/CHRONOS/CLAUDE.md /Users/Patmac/denroot/CHRONOS/CLAUDE.md
cp /Users/Patmac/denroot/IMAGINARIUM/CLAUDE.md /Users/Patmac/denroot/IMAGINARIUM/CLAUDE.md
# etc.
```

Each checkout now has:
- Full dendrovia monorepo code
- Pillar-specific CLAUDE.md for context

---

## Daily Workflow

### Scenario: Working on CHRONOS Git Parser

#### 1. Switch to CHRONOS Checkout

```bash
cd /Users/Patmac/denroot/CHRONOS
```

When an AI assistant starts here, it reads `CLAUDE.md` and knows:
> "You're working in CHRONOS - focus on Git/AST parsing. Production code is in packages/chronos/."

#### 2. Make Changes

```bash
cd packages/chronos/src/parser
# Edit GitParser.ts
```

#### 3. Test Locally

```bash
bun run test
```

#### 4. Commit and Push

```bash
git add packages/chronos/src/parser/GitParser.ts
git commit -m "feat(chronos): Add Git history parser"
git push
```

#### 5. Pull in Other Checkouts

```bash
# Switch to IMAGINARIUM checkout
cd /Users/Patmac/denroot/IMAGINARIUM
git pull  # Get the CHRONOS changes

# Now IMAGINARIUM can use the new Git parser
```

---

## Working Across Pillars

### Scenario: IMAGINARIUM Needs CHRONOS Output

#### In CHRONOS Checkout:

```bash
cd /Users/Patmac/denroot/CHRONOS
cd packages/chronos
bun run parse --output generated/topology.json
git add generated/topology.json
git commit -m "feat(chronos): Generate topology for Dendrovia codebase"
git push
```

#### In IMAGINARIUM Checkout:

```bash
cd /Users/Patmac/denroot/IMAGINARIUM
git pull  # Get topology.json

cd packages/imaginarium
bun run distill --topology ../chronos/generated/topology.json
git add generated/shaders/*.glsl
git commit -m "feat(imaginarium): Generate shaders from topology"
git push
```

---

## CLAUDE.md Files

Each checkout has a **pillar-specific CLAUDE.md** (untracked):

```
CHRONOS/CLAUDE.md         → Focus on Git/AST parsing
IMAGINARIUM/CLAUDE.md     → Focus on AI distillation
ARCHITECTUS/dendrovia/    → (no CLAUDE.md at root, it's the source)
LUDUS/CLAUDE.md           → Focus on game mechanics
OCULUS/CLAUDE.md          → Focus on UI/UX
OPERATUS/CLAUDE.md        → Focus on infrastructure
```

### Why Untracked?

If tracked, every checkout would have the same `CLAUDE.md`. By keeping them **untracked**, each checkout can have its **own context** without polluting the main repo.

### How to Keep Them Synced

If you update a CLAUDE.md file, **manually copy** it to that pillar's checkout:

```bash
# Update CHRONOS CLAUDE.md
cd /Users/Patmac/denroot
vim CHRONOS/CLAUDE.md

# Copy to all CHRONOS checkouts
# (only one in this case, but if you had multiple machines...)
```

---

## Git Configuration

### Exclude CLAUDE.md in Checkouts

Add to each checkout's `.git/info/exclude`:

```bash
cd /Users/Patmac/denroot/CHRONOS
echo "CLAUDE.md" >> .git/info/exclude
```

This prevents `CLAUDE.md` from showing up in `git status`.

---

## Advantages

### 1. Strong Context for AI Assistants

When you start Claude in a checkout:
```bash
cd /Users/Patmac/denroot/CHRONOS
claude
```

Claude reads `CLAUDE.md` and immediately knows:
- You're working on Git/AST parsing
- Production code is in `packages/chronos/`
- Steering heuristic: "Reward the discovery of 'Why,' not just 'What.'"

### 2. Full Monorepo, Focused Work

You have access to **all code** (monorepo), but the **context suggests** focusing on one pillar.

### 3. Parallel Development

Open 6 terminal windows, one per checkout:
- Terminal 1: `cd CHRONOS` (working on parsing)
- Terminal 2: `cd IMAGINARIUM` (working on shaders)
- Terminal 3: `cd ARCHITECTUS/dendrovia` (working on rendering)

Each has different context, but they all share the same repo.

### 4. Standard Git Workflow

No special commands:
- `git clone` (everyone knows this)
- `git pull` (get others' changes)
- `git push` (share your changes)

---

## Deployment

### Vercel Setup

Deploy the proof-of-concept:

```bash
cd /Users/Patmac/denroot/ARCHITECTUS/dendrovia
vercel init

# Deploy packages/proof-of-concept
cd packages/proof-of-concept
vercel deploy
```

Vercel will:
1. Read `package.json` for build command
2. Build the Vite app
3. Deploy to a URL

---

## FAQ

### Q: Why not use git worktrees?

**A:** Worktrees are more complex and less intuitive. This approach uses standard `git clone`, which everyone understands.

### Q: What if I commit in the wrong checkout?

**A:** No problem! All checkouts point to the same remote. Just push from wherever you committed.

### Q: How do I add a new checkout?

**A:**
```bash
cd /Users/Patmac/denroot
git clone git@github.com:yourusername/dendrovia.git NEW_CHECKOUT
cp denroot/NEW_PILLAR/CLAUDE.md NEW_CHECKOUT/CLAUDE.md
cd NEW_CHECKOUT && echo "CLAUDE.md" >> .git/info/exclude
```

### Q: Can I delete a checkout?

**A:** Yes! Just `rm -rf CHRONOS`. Your work is safe in the remote repo.

### Q: What if checkouts get out of sync?

**A:**
```bash
cd /Users/Patmac/denroot/CHRONOS
git fetch origin
git reset --hard origin/main  # Nuclear option: match remote exactly
```

---

## Summary

**One monorepo, multiple checkouts, focused context.**

- All production code in `packages/*`
- Each checkout has pillar-specific `CLAUDE.md` (untracked)
- Standard git workflow: clone, pull, commit, push
- Simpler than worktrees, more intuitive than submodules

This architecture provides **cognitive boundaries** without **technical complexity**.
