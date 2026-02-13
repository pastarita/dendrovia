# TurboRepo Custom Task Colors — PR Strategy

> Strategy document for contributing user-configurable task colors to vercel/turborepo.

---

## Intelligence Summary

### Governance Structure
- **Core maintainers**: Chris Olszewski (`chris-olszewski`), Anthony Shew (`anthonyshew`), Tom Knickman (`tknickman`), Nicholas Yang (`NicholasLYang`)
- **Primary reviewer for `crates/turborepo-ui/`**: **chris-olszewski** — reviewed Shaharking's color PRs, authored TUI resize/copy/output-logs fixes. Expect him as your reviewer.
- **Decision process**: Vercel-led governance. [Governance page](https://turborepo.com/governance) states the Vercel team manages project direction. Large features need RFCs via GitHub Discussions. Smaller improvements can go direct PR.
- **External PRs**: Accepted when well-scoped. Shaharking was **personally thanked in the [v2.1 release notes](https://turborepo.dev/blog/turbo-2-1-0)** for the deterministic color work. CodeMan62 had TUI signal handler PR #10326 accepted. External contributions ARE valued.
- **License**: MPL 2.0. No commercial sensitivity around TUI/DX features.

### Prior Art — Why This Has Failed Before
- **[PR #9008](https://github.com/vercel/turborepo/pull/9008)** (Shaharking, Jan 2025): Tried to expand the color palette from 5 to 14 colors. **Rejected.** Maintainer response: *"The team is currently not interested in expanding the possible color list."* The palette expansion was seen as subjective (many colors "aren't especially nice to look at").
- **[PR #9023](https://github.com/vercel/turborepo/pull/9023)** (Shaharking): Accepted part — made color assignment deterministic (by sorted task name instead of execution order). This **was merged**.
- **[Discussion #1877](https://github.com/vercel/turborepo/discussions/1877)**: Community request for per-package colors. No official response.

### Why Our Approach Is Different
PR #9008 failed because it tried to **change the defaults** — a subjective design decision the team didn't want to make. Our approach gives **users control** over their own display, leaving defaults untouched. This is a configuration surface, not a design opinion.

### CRITICAL WARNING: Per-Task UI Config Was Rejected
- **[Discussion #9167](https://github.com/vercel/turborepo/discussions/9167)**: "Configure UI per task" — **CLOSED**. Maintainer rationale: *"there can only be one UI but many tasks, so there's no way to establish a true precedence."*
- **[Discussion #9091](https://github.com/vercel/turborepo/discussions/9091)**: Per-task UI mode override — met resistance for the same reason.
- **Implication for us**: If we frame this as "per-task configuration in turbo.json" it will trigger the same rejection. We MUST frame it as a **global color map** (package→color), not per-task UI configuration. The distinction: we're configuring the *color_selector's assignment table*, not the *UI mode*.

### Related Momentum (Favorable)
- **[Discussion #1877](https://github.com/vercel/turborepo/discussions/1877)**: Original community request for per-package colors. Closed in favor of Issue #2564.
- **[Issue #2564](https://github.com/vercel/turborepo/issues/2564)**: "Logging colors are non-deterministic" — labeled **good first issue**. Resolved by PR #9023 for determinism, but user control never addressed.
- **[Discussion #10734](https://github.com/vercel/turborepo/discussions/10734)**: Screen clearing in TUI — shows ongoing TUI customization demand.
- **[Discussion #10491](https://github.com/vercel/turborepo/discussions/10491)**: "TUI is really hard to use" — general TUI UX dissatisfaction, validates need for better visual differentiation.

### TUI Area Activity
The `crates/turborepo-ui/` crate is **actively maintained**:
- PR #8612: Respect `--output-logs` for TUI (chris-olszewski)
- PR #8996: Resize terminal pane (chris-olszewski)
- PR #9409: Wrap-around selection (anthonyshew)
- PR #10326: Signal handler fixes (CodeMan62 — **external contributor, accepted**)

This tells us: external PRs to the TUI **can** get accepted if they're well-scoped and fix a real problem.

### Technical Entry Points
```
crates/turborepo-ui/src/color_selector.rs  — Color palette + assignment logic
crates/turborepo-lib/src/task_graph/visitor.rs  — Color assignment during graph walk
crates/turborepo-lib/src/turbo_json/  — turbo.json schema parsing
```

The `color_selector.rs` file is only ~100 lines. The change is surgical.

---

## The Pitch: "Task Display Metadata"

### Framing (CRITICAL)

Do NOT frame this as "more colors." Frame it as:

> **"User-configurable task display metadata in turbo.json"**

Colors are the first field. The pattern naturally extends to labels, icons, and grouping. This is a **configuration primitive**, not a cosmetic patch.

### The Narrative Arc

**Problem statement**: Monorepos with 15+ packages get no signal from task prefixes — 5 colors cycling across 18 packages creates visual noise. Users with domain-specific color languages (design systems, microservice topologies, pillar architectures) can't leverage their existing visual vocabulary.

**Solution**: An optional `color` field in turbo.json task configuration. When set, the TUI and stream output use that color for the task prefix. When not set, existing behavior is unchanged.

**Extensibility story**: The same pattern enables future fields like `label` (display name), `icon` (prefix glyph), and `group` (visual clustering). This PR establishes the configuration surface; future PRs populate it.

### The Three-Level Story

| Level | PR | What | Why |
|-------|-----|------|-----|
| 1 | **This PR** | `color` field per task | Visual signal in large monorepos |
| 2 | Future | `label` + `icon` fields | Better task identification |
| 3 | Vision | Configurable TUI HUD zones | Task health, cache rates, custom badges |

The PR description should mention levels 2-3 as **future possibilities**, not promises. This shows you understand the architecture and aren't just scratching an itch.

---

## Technical Implementation Plan

### Schema Change (turbo.json)

**IMPORTANT**: Do NOT put this in per-task config (triggers the #9167 rejection pattern). Instead, propose a top-level `packageColors` map — a global color assignment table that feeds into the existing `ColorSelector`:

```json
{
  "packageColors": {
    "@dendrovia/playground-architectus": "#3B82F6",
    "@dendrovia/playground-chronos": "#c77b3f",
    "@dendrovia/playground-imaginarium": "#A855F7",
    "@dendrovia/playground-ludus": "#EF4444",
    "@dendrovia/playground-oculus": "#22C55E",
    "@dendrovia/playground-operatus": "#6B7280"
  },
  "tasks": {
    "build": { "dependsOn": ["^build"] }
  }
}
```

This is a global map, not per-task config. It configures the **ColorSelector's lookup table**, not the UI mode. Every task from that package inherits the color — same as how the current system works, just with user-defined values instead of round-robin.

### Color Format Support
- Hex: `#RRGGBB` (primary)
- Named ANSI colors: `"cyan"`, `"magenta"`, etc. (for users who don't want to think about hex)
- Invalid values: fall back to existing auto-assignment (no crash, just warning)

### Code Changes

**1. `crates/turborepo-ui/src/color_selector.rs`**

Add support for custom `Style` from hex input:

```rust
fn style_from_hex(hex: &str) -> Option<Style> {
    let hex = hex.trim_start_matches('#');
    if hex.len() != 6 { return None; }
    let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
    Some(Style::new().color256(
        // Map to nearest 256-color for broad terminal support
        ansi256_from_rgb(r, g, b)
    ))
}
```

Extend `ColorSelector` to accept pre-configured colors:

```rust
impl ColorSelector {
    pub fn set_custom_color(&self, key: &str, color: Style) {
        self.inner.write().expect("lock poisoned")
            .cache.insert(key.to_string(), Box::leak(Box::new(color)));
    }
}
```

**2. `crates/turborepo-lib/src/turbo_json/`**

Add optional `color` field to task definition schema:

```rust
#[derive(Deserialize, Default)]
pub struct RawTaskDefinition {
    // ... existing fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}
```

**3. `crates/turborepo-lib/src/task_graph/visitor.rs`**

Before the graph walk, pre-populate custom colors from task definitions:

```rust
for (task_id, task_def) in &task_definitions {
    if let Some(ref color_hex) = task_def.color {
        if let Some(style) = style_from_hex(color_hex) {
            color_selector.set_custom_color(&task_id.to_string(), style);
        }
    }
}
```

**4. JSON Schema update** for turbo.json validation.

### Testing
- Unit tests in `color_selector.rs`: custom color lookup, fallback behavior, hex parsing
- Integration test: turbo.json with `color` field parsed correctly
- Snapshot test: verify colored output matches expectations

---

## PR Execution Strategy

### Pre-PR: Open a Discussion First

Before writing code, open a GitHub Discussion:

**Title**: "RFC: User-configurable task display color in turbo.json"

**Body** structure:
1. Problem statement (visual noise at scale)
2. Proposed solution (one field, backward compatible)
3. Prior art acknowledgment (reference #9008, explain why this is different)
4. Link to related discussions (#1877, #9091, #9167)
5. Technical sketch (show the turbo.json syntax and affected files)
6. Ask: "Would the team be open to a PR for this?"

**Why discussion first**: PR #9008 was rejected because the contributor didn't align with the team's direction before writing code. A discussion de-risks the effort and shows respect for the maintainers' time.

### Anticipated Objections & Responses

| Objection | Response |
|-----------|----------|
| "We don't want to expand colors" | We're not expanding the palette — we're giving users a knob. Defaults don't change. |
| "This adds config surface area" | One optional field. No behavioral change when absent. Same pattern as `outputLogs`. |
| "Terminal color support varies" | Fall back to nearest ANSI-256, then to default palette. Progressive enhancement. |
| "The TUI has its own colors" | This applies to both TUI prefix colors and stream mode. TUI task list already uses colors. |
| "Nobody needs this" | #1877 (2022), #9008 (2025), #9091, #9167 — recurring community demand. |
| "Why not just filter?" | Filter reduces packages but doesn't help when you need all 18 running. Visual differentiation is the solution. |

### PR Description Template

```markdown
## Summary

Adds an optional `color` field to task configuration in turbo.json, allowing users
to set custom prefix colors for task output in both TUI and stream modes.

## Motivation

Monorepos with 15+ packages cycle through turbo's 5-color palette ~3 times, making
prefix colors noise rather than signal. Users with domain-specific color conventions
(design systems, microservice topologies) can't leverage their visual vocabulary.

Related: #1877, #9091, #9167

## Changes

- `crates/turborepo-ui/src/color_selector.rs`: Accept custom Style from hex color
- `crates/turborepo-lib/src/turbo_json/`: Parse optional `color` field
- `crates/turborepo-lib/src/task_graph/visitor.rs`: Pre-populate custom colors
- JSON schema: Add `color` to task definition

## Behavior

- When `color` is set: use that color for the task prefix
- When `color` is not set: existing auto-assignment (unchanged)
- Invalid hex: warn and fall back to auto-assignment
- Supports: `#RRGGBB` hex and named ANSI colors

## Testing

- Unit: hex parsing, custom color lookup, fallback behavior
- Integration: turbo.json parsing with color field
- Snapshot: colored output verification

## Future Direction

This establishes a "task display metadata" surface in turbo.json. Natural extensions
include `label` (custom display name), `icon` (prefix glyph), and `group` (visual
clustering in TUI). This PR intentionally limits scope to `color` only.
```

### Timeline Expectations

Based on observed patterns:
- **Discussion response**: 1-2 weeks (maintainers are responsive but busy)
- **PR review cycle**: 2-4 weeks for first review
- **Iteration**: 1-2 rounds of feedback
- **Total to merge**: 4-8 weeks if accepted

### Success Factors

1. **Discussion first** — don't surprise the maintainers
2. **Minimal scope** — one field, one PR
3. **Perfect tests** — `cargo test`, `cargo fmt`, `cargo clippy` must pass
4. **Reference prior art** — show you've done homework
5. **Backward compatible** — zero change when config is absent
6. **Progressive enhancement** — degrade gracefully in limited terminals

---

## Repo Setup

```bash
# Fork and clone
gh repo fork vercel/turborepo --clone
cd turborepo

# Rust setup
rustup update
cargo build

# Find the files
code crates/turborepo-ui/src/color_selector.rs
code crates/turborepo-lib/src/turbo_json/

# Run tests
cargo test -p turborepo-ui
cargo test -p turborepo-lib

# Format and lint
cargo fmt --all
cargo clippy --all
```

---

_Created: 2026-02-13_
_Status: Strategy phase — discussion not yet opened_
