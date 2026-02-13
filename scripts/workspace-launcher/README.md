# Dendrovia Workspace Launcher

Launch all 6 pillar checkouts in iTerm2 with proper layout and cognitive context.

## Quick Start

```bash
# Launch all 6 pillars
bun run launch

# Launch with dev servers running
bun run launch:dev

# Launch specific pillars only
bun run launch --pillars CHRONOS IMAGINARIUM

# List available pillars
bun run launch:list

# Preview without executing
bun run launch --dry-run
```

## What It Does

Creates an iTerm2 window for each pillar in a 3x2 grid:

```
┌─────────────┬─────────────┬─────────────┐
│ CHRONOS     │ IMAGINARIUM │ ARCHITECTUS │
│ 📜 CHR      │ 🎨 IMG      │ 🏛️ ARC      │
├─────────────┼─────────────┼─────────────┤
│ LUDUS       │ OCULUS      │ OPERATUS    │
│ 🎮 LUD      │ 👁️ OCU      │ 💾 OPR      │
└─────────────┴─────────────┴─────────────┘
```

Each window has **3 panes**:

```
┌─────────────────────────┐
│      TOP (Claude)       │  ← Claude Code with CLAUDE.md context
├────────────┬────────────┤
│ Bottom L   │ Bottom R   │
│  (Dev)     │ (Shell)    │  ← Dev work + General shell
└────────────┴────────────┘
```

## Why This Layout?

### Top Pane (70% height): Claude Code
- Automatically loads `CLAUDE.md` context for the pillar
- Claude knows which pillar you're working in
- Large pane for comfortable AI interaction

### Bottom Left Pane: Dev Work
- Run dev servers (`bun run dev`)
- Execute package-specific commands
- Watch mode for tests/builds

### Bottom Right Pane: General Shell
- Git operations
- File navigation
- Quick commands

## The Six Pillars

| Pillar | Focus | Primary Package |
|--------|-------|----------------|
| **CHRONOS** 📜 | Git + AST Parsing | `packages/chronos` |
| **IMAGINARIUM** 🎨 | AI → Shader Distillation | `packages/imaginarium` |
| **ARCHITECTUS** 🏛️ | WebGPU Rendering | `packages/architectus` |
| **LUDUS** 🎮 | Game Logic | `packages/ludus` |
| **OCULUS** 👁️ | UI/UX Components | `packages/oculus` |
| **OPERATUS** 💾 | Infrastructure | `packages/operatus` |

## CLI Options

```bash
--pillars, -p <names>  Launch specific pillars (can repeat)
--dev, -d              Start dev servers in each window
--dry-run              Show AppleScript without executing
--list, -l             List available pillars
--help, -h             Show help
```

## Examples

```bash
# Launch just CHRONOS and IMAGINARIUM for parser + distillation work
bun run launch --pillars CHRONOS IMAGINARIUM

# Launch ARCHITECTUS with dev server
bun run launch --pillars ARCHITECTUS --dev

# Preview what would happen
bun run launch --dry-run

# Launch specific pillars with dev servers
bun run launch --dev --pillars CHRONOS IMAGINARIUM ARCHITECTUS
```

## Prerequisites

- **macOS**
- **iTerm2** (install from https://iterm2.com)
- **Bun** (already installed)

## How It Works

1. **Generates AppleScript** that controls iTerm2
2. **Creates windows** in calculated grid positions
3. **Splits panes** within each window
4. **Sets window titles** with emoji + short codes
5. **Executes commands** in each pane

Based on the Lanternade workspace launcher pattern.

## Customization

Edit `scripts/workspace-launcher/pillar-registry.ts` to:
- Change window layout (3x2 → 2x3)
- Adjust window sizes/margins
- Add custom iTerm profiles
- Modify pane split ratios

## Troubleshooting

### "iTerm" doesn't understand "create window"

Enable **Python API** in iTerm2:
1. iTerm2 → Preferences → General
2. Check "Enable Python API"

### Windows don't position correctly

Adjust screen resolution in `iterm-launcher.ts`:
```typescript
const screenWidth = 2560;  // Your display width
const screenHeight = 1440; // Your display height
```

### Dev servers don't start

Make sure dependencies are installed in each checkout:
```bash
cd /Users/Patmac/denroot/CHRONOS && bun install
cd /Users/Patmac/denroot/IMAGINARIUM && bun install
# ... etc
```

## Philosophy

This launcher embodies the **multi-checkout cognitive architecture**:

- Each checkout is a **full clone** of dendrovia
- Each has a **pillar-specific CLAUDE.md** (untracked)
- Claude Code in the top pane **reads that context**
- You can work on **multiple pillars in parallel**
- All share the same GitHub remote

It's like having 6 developers on different machines, but they're all you with different "hats."
