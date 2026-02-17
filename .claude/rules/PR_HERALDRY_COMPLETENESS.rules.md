# PR Heraldry Completeness Rules

**Trigger:** When generating a Coat of Arms, classifying PR magnitude, or selecting heraldic elements for a PR description.

---

## 1. Heraldic Achievement Anatomy

A complete PR Coat of Arms consists of:

```
CREST (top)        → Magnitude symbol and classification
SUPPORTERS (sides) → Validation status (typecheck, lint, test, build)
SHIELD (center)    → Domain tincture(s) + charge(s)
MOTTO (bottom)     → Latin phrase reflecting the work's nature
COMPACT LINE       → Single-line summary for scanning
```

---

## 2. Dendrovia Domain Taxonomy

Domains map to the six-pillar architecture plus cross-cutting concerns:

| Domain | Pillar | Tincture | Hex | Type | File Patterns |
|--------|--------|----------|-----|------|---------------|
| chronos | CHRONOS | Amber | `#c77b3f` | color | `packages/chronos/` |
| imaginarium | IMAGINARIUM | Purpure | `#A855F7` | color | `packages/imaginarium/` |
| architectus | ARCHITECTUS | Azure | `#3B82F6` | color | `packages/architectus/` |
| ludus | LUDUS | Gules | `#EF4444` | color | `packages/ludus/` |
| oculus | OCULUS | Vert | `#22C55E` | color | `packages/oculus/`, `packages/ui/` |
| operatus | OPERATUS | Sable | `#1F2937` | color | `packages/operatus/`, `scripts/` |
| shared | Cross-pillar | Or | `#FFD700` | metal | `packages/shared/` |
| app | Application | Argent | `#E5E7EB` | metal | `apps/` |
| docs | Documentation | Tenné | `#CD853F` | color | `docs/` |
| infra | Infrastructure | Gules | `#EF4444` | color | `turbo.json`, `.github/`, `*.config.*` |

### Rule of Tincture

Metal MUST NOT be placed on metal, nor color on color. When combining domains:
- If both are colors → valid combination
- If both are metals → use the higher-priority domain's tincture only
- Color on metal or metal on color → always valid

---

## 3. Magnitude Scale

### Scoring Algorithm

```
score = 0
score += min(ceil(fileCount / 5), 5)
score += min(ceil(lineCount / 200), 5)
score += min(domainCount, 4)
if (hasBreakingChanges) score += 3
if (hasNewDependencies) score += 1
if (hasMigrations) score += 2
if (hasSchemaChanges) score += 2
```

### Magnitude Thresholds

| Score | Magnitude | Symbol | Description |
|-------|-----------|--------|-------------|
| 0-4 | trivial | `+` | Single-file fix, typo, config tweak |
| 5-8 | minor | `*` | Small feature or bug fix |
| 9-12 | moderate | `**` | Standard feature implementation |
| 13-18 | major | `***` | Significant architectural work |
| 19+ | epic | `****` | Major system initiative |

---

## 4. Charge Taxonomy

Each conventional commit type maps to a heraldic charge:

| Commit Type | Charge | Symbol | Blazon |
|-------------|--------|--------|--------|
| `feat` | mullet | star | "a mullet" (star) |
| `fix` | cross | cross | "a cross" |
| `refactor` | bend | diagonal | "a bend" (diagonal) |
| `perf` | eagle | eagle | "an eagle displayed" |
| `docs` | book | book | "a book open" |
| `test` | scales | scales | "scales of justice" |
| `chore` | hammer | hammer | "a hammer" |
| `infra` | tower | tower | "a tower" |
| `style` | chevron | chevron | "a chevron" |

Charge count = number of commits of that type. Primary charge = most frequent type.

---

## 5. Shield Divisions

Based on domain count in the PR:

| Domains | Division | Description |
|---------|----------|-------------|
| 1 | plain | Undivided field |
| 2 | per-pale | Vertical split |
| 3 | per-chevron | Chevron split |
| 4 | per-quarterly | Four quadrants |
| 5-7 | party-per-cross | Cross division |
| 8 | gyronny | Eight sections |

---

## 6. Supporters

Supporters flank the shield and represent validation status:

| Position | Check | Command | Symbols |
|----------|-------|---------|---------|
| Dexter | TypeScript typecheck | `bun run check-types` | pass/fail/warn/skip |
| Sinister | Lint | `bun run lint` | pass/fail/warn/skip |
| Base dexter | Unit tests | `bun test` | pass/fail/warn/skip |
| Base sinister | Build | `bun run build` | pass/fail/warn/skip |

Status symbols:
- Pass: `pass`
- Fail: `FAIL`
- Warning: `WARN`
- Skipped: `skip`

---

## 7. Motto Registry

### Selection Logic

1. Determine primary charge (most frequent commit type)
2. Determine magnitude
3. Look up motto from table below
4. For major+ magnitude, use formal register
5. For trivial/minor, use casual register
6. If no match, use universal fallback

### Motto Table

| Primary Charge | Formal (major+) | Standard (moderate) | Casual (trivial-minor) |
|----------------|-----------------|---------------------|------------------------|
| mullet (feat) | Per aspera ad astra | Innovation through iteration | New horizons |
| cross (fix) | Correctio fundamentum | Stability restored | The path made clear |
| bend (refactor) | Mutatio in melius | Refined through change | Structure renewed |
| eagle (perf) | Velocitas vincit | Swift and sure | Performance elevated |
| book (docs) | Scientia potentia est | Knowledge preserved | Wisdom documented |
| scales (test) | Veritas in probatione | Quality assured | Balance maintained |
| hammer (chore) | Fabrica fundamenta | Foundation strengthened | Tools of the trade |
| tower (infra) | Arx inconcussa | Infrastructure fortified | Systems secured |

### Universal Fallbacks

1. **Iterandum est** — "It must be iterated"
2. **Ad usum, non ad fidem** — "For use, not for belief"
3. **Probamus, non credimus** — "We test, we do not believe"

---

## 8. Fidelity Levels

| Level | Name | Format | Use Case |
|-------|------|--------|----------|
| 0 | Phantom | Plain text | Quick notes, WIP, drafts |
| 1 | Synthetic | Emoji + ASCII box | **PR descriptions (default)** |
| 2 | Simulated | Mermaid diagram | Documentation, design docs |
| 3 | Sampled | React component | Dev toolbox, dashboards |
| 4 | Production | Full SVG | PR gallery, awards |
| 5 | Scaled | Interactive | Live dashboards |

**Level 1 is the production standard for all PR descriptions.**

### Level 1 (Synthetic) Template

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|          {supporter-L}  [SHIELD]  {supporter-R}              |
|                   {charge} x {count}                         |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+

Compact: {magnitude-symbol} [{domain}] {charge}x{n} {supporters} +{a}/-{r}
```

---

## 9. Heterogeneous Shield Division

For PRs spanning multiple feature spaces:

```
+--------------------------------------------------------------+
|                   UNIFIED COAT OF ARMS                       |
|     +------------------+   +------------------+              |
|     | I {Space A}      |   | II {Space B}     |             |
|     | {charge}x{n}     |   | {charge}x{n}    |             |
|     | [{domain}]       |   | [{domain}]       |             |
|     +------------------+   +------------------+              |
+--------------------------------------------------------------+
```

Each space gets its own tincture quadrant. The shield division follows the domain-count rules in Section 5.

---

## 10. Validation Checklist

Before finalizing any Coat of Arms:

- [ ] Branch name present
- [ ] Magnitude computed and symbol displayed
- [ ] At least one charge listed with count
- [ ] Domain(s) identified and bracketed
- [ ] File count and line delta present
- [ ] Supporters show validation status
- [ ] Motto selected from registry or fallback
- [ ] Compact line present below the box
- [ ] For heterogeneous: divided shield with space indices

---

## Cross-References

| Related Document | Purpose |
|------------------|---------|
| `.claude/skills/heraldry/pr-heraldry/SKILL.md` | Coat of Arms generation skill |
| `lib/heraldry/types.ts` | TypeScript type definitions |
| `docs/PILLAR_INSIGNIA_STRUCTURAL.md` | Pillar insignia designs |
| `docs/PILLAR_THEMATIC_SCHEMA.md` | Thematic type system |

## Key Files

| File | Purpose |
|------|---------|
| `lib/heraldry/types.ts` | Domain/tincture/charge type definitions |
| `lib/heraldry/analyzer.ts` | Branch analysis for heraldry generation |
| `lib/heraldry/emoji.ts` | Symbol/emoji mappings |
| `lib/heraldry/mermaid.ts` | Mermaid diagram generation |

---

_Version: 1.0.0_
_Created: 2026-02-12_
