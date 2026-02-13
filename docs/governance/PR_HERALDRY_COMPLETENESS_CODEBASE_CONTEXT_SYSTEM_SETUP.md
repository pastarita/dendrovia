# PR Heraldry Completeness: Codebase Context System Setup

_Version: 1.0.0_
_Created: 2026-02-12_

> A structured PR description system with heraldic classification, accessibility-compliant Mermaid diagrams, governance policies, and Claude Code skill integration for the Dendrovia monorepo.

---

## System Overview

This system provides:

1. **Classifies** every PR using heraldic metadata (magnitude, charges, domains, mottos)
2. **Enforces** consistent structure via mandatory sections and prohibited content
3. **Guides** diagram creation with accessibility-compliant Mermaid conventions
4. **Routes** to specialized templates based on PR type
5. **Integrates** with Claude Code via skills, rules, and trigger-based routing

### Architecture

```mermaid
flowchart TB
    subgraph TRIGGERS["Activation Layer"]
        T1["User says 'create PR'"]
        T2["User says 'PR description'"]
    end

    subgraph ROUTING["Routing Layer"]
        R1["INDEX.md trigger mapping"]
        R2["CLAUDE.md skill reference"]
    end

    subgraph RULES["Rules Layer"]
        PR_W["PR_WORKFLOW.rules.md"]
        PR_D["PR_DESCRIPTION_CONTENT.rules.md"]
        PR_H["PR_HERALDRY_COMPLETENESS.rules.md"]
        DG["DIAGRAM_CONVENTIONS.rules.md"]
    end

    subgraph SKILLS["Skills Layer"]
        SK1["pr-workflow SKILL.md"]
        SK2["pr-heraldry SKILL.md"]
        SK3["pr-heterogeneous SKILL.md"]
    end

    subgraph TEMPLATES["Template Layer"]
        TM1["Standard Template"]
        TM2["Heterogeneous Template"]
        TM3["Routine Operations"]
        TM4["Direction Alignment"]
        TM5["Cross-Checkout Scan"]
    end

    subgraph OUTPUT["Output Layer"]
        OUT["docs/pr-descriptions/PR_DESCRIPTION_NAME.md"]
    end

    TRIGGERS --> ROUTING
    ROUTING --> RULES
    ROUTING --> SKILLS
    RULES --> SKILLS
    SKILLS --> TEMPLATES
    TEMPLATES --> OUTPUT

    style TRIGGERS fill:#1e3a5f,stroke:#3b82f6,color:#ffffff
    style ROUTING fill:#c77b3f,stroke:#3c6b63,color:#000000
    style RULES fill:#3c6b63,stroke:#22c55e,color:#ffffff
    style SKILLS fill:#1F2937,stroke:#444,color:#ffffff
    style TEMPLATES fill:#5f4b1e,stroke:#c77b3f,color:#ffffff
    style OUTPUT fill:#22c55e,stroke:#166534,color:#000000
```

---

## File Structure

```
dendrovia/
├── .claude/
│   ├── rules/
│   │   ├── INDEX.md
│   │   ├── PR_WORKFLOW.rules.md
│   │   ├── PR_DESCRIPTION_CONTENT.rules.md
│   │   ├── PR_HERALDRY_COMPLETENESS.rules.md
│   │   ├── DIAGRAM_CONVENTIONS.rules.md
│   │   └── BRANCH_WORKFLOW.rules.md
│   └── skills/
│       ├── workflow/
│       │   ├── pr/
│       │   │   └── SKILL.md
│       │   └── pr-heterogeneous/
│       │       └── SKILL.md
│       └── heraldry/
│           └── pr-heraldry/
│               └── SKILL.md
├── lib/
│   └── heraldry/
│       ├── types.ts
│       ├── analyzer.ts
│       ├── emoji.ts
│       ├── mermaid.ts
│       └── index.ts
├── docs/
│   ├── pr-descriptions/
│   │   └── templates/
│   │       ├── ROUTINE_OPERATIONS_TEMPLATE.md
│   │       ├── DIRECTION_ALIGNMENT_PR_TEMPLATE.md
│   │       └── CROSS_CHECKOUT_SCAN_TEMPLATE.md
│   └── governance/
│       └── PR_HERALDRY_COMPLETENESS_CODEBASE_CONTEXT_SYSTEM_SETUP.md
└── CLAUDE.md
```

---

## Domain Taxonomy (Dendrovia)

| Domain | Pillar | Tincture | Hex |
|--------|--------|----------|-----|
| chronos | CHRONOS | Amber | `#c77b3f` |
| imaginarium | IMAGINARIUM | Purpure | `#A855F7` |
| architectus | ARCHITECTUS | Azure | `#3B82F6` |
| ludus | LUDUS | Gules | `#EF4444` |
| oculus | OCULUS | Vert | `#22C55E` |
| operatus | OPERATUS | Sable | `#1F2937` |
| shared | Cross-pillar | Or | `#FFD700` |
| app | Application | Argent | `#E5E7EB` |
| docs | Documentation | Tenne | `#CD853F` |
| infra | Infrastructure | Gules | `#EF4444` |

---

## Policy Cascade

```
1. CLAUDE.md (root)
   └── References skill path
       └── 2. PR_WORKFLOW.rules.md (process)
           ├── 3. PR_DESCRIPTION_CONTENT.rules.md (content)
           ├── 4. PR_HERALDRY_COMPLETENESS.rules.md (taxonomy)
           └── 5. DIAGRAM_CONVENTIONS.rules.md (diagrams)
```

---

## Reachability Matrix

Every document must be reachable from at least 2 independent paths:

| Document | Path 1 | Path 2 |
|----------|--------|--------|
| PR_WORKFLOW | CLAUDE.md | INDEX.md |
| PR_DESCRIPTION_CONTENT | INDEX.md | PR_WORKFLOW |
| PR_HERALDRY_COMPLETENESS | INDEX.md | PR_WORKFLOW |
| DIAGRAM_CONVENTIONS | INDEX.md | PR_DESCRIPTION_CONTENT |
| pr-workflow SKILL | CLAUDE.md | INDEX.md |
| pr-heraldry SKILL | INDEX.md | PR_DESCRIPTION_CONTENT |
| pr-heterogeneous SKILL | INDEX.md | pr-workflow SKILL |

---

## Verification Checklist

- [ ] `.claude/rules/INDEX.md` exists and maps all triggers
- [ ] All 5 rule files exist in `.claude/rules/`
- [ ] All 3 skill files exist in `.claude/skills/`
- [ ] `lib/heraldry/` contains types.ts, analyzer.ts, emoji.ts, mermaid.ts, index.ts
- [ ] `docs/pr-descriptions/templates/` contains 3 templates
- [ ] `CLAUDE.md` references all skills
- [ ] Cross-references resolve (run audit grep)
- [ ] All Mermaid style directives include `color:`

---

## Key Files Summary

| Purpose | Location |
|---------|----------|
| Primary Skill | `.claude/skills/workflow/pr/SKILL.md` |
| Heraldry Skill | `.claude/skills/heraldry/pr-heraldry/SKILL.md` |
| Heterogeneous Skill | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` |
| Process Rules | `.claude/rules/PR_WORKFLOW.rules.md` |
| Content Rules | `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md` |
| Heraldry Rules | `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` |
| Diagram Rules | `.claude/rules/DIAGRAM_CONVENTIONS.rules.md` |
| Trigger Index | `.claude/rules/INDEX.md` |
| Type Definitions | `lib/heraldry/types.ts` |
| Templates | `docs/pr-descriptions/templates/*.md` |
| This Document | `docs/governance/PR_HERALDRY_COMPLETENESS_CODEBASE_CONTEXT_SYSTEM_SETUP.md` |
