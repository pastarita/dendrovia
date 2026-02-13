# Direction Alignment PR Template

_Use this template for strategic, directional, or system design work._

---

## Coat of Arms

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|          {typecheck}  [SHIELD]  {lint}                       |
|                   {charge} x {count}                         |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+
```

**Compact:** {mag-sym} [{domain}] {charge}x{n} {supporters} +{a}/-{r}

---

## Summary

{1-3 sentences: strategic context and what direction this sets}

## Key Metrics

| Metric | Value |
|--------|-------|
| Files changed | {n} |
| Lines added | {n} |
| Lines removed | {n} |
| Domains touched | {list} |
| New interfaces | {n} |
| New modules | {n} |

## Terminology

| Term | Definition |
|------|-----------|
| {term} | {definition} |

## Design Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | {decision} | {why} | {what else was considered} |

## Architecture

```mermaid
flowchart TB
    {architecture diagram with accessible styling}
```

## Module Surface Area

| Module | Exports | Size | Purpose |
|--------|---------|------|---------|
| {module} | {n} | {LOC} | {purpose} |

## Key Interfaces

```typescript
{critical type definitions}
```

## Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | {feature} | {description} | Complete |

## Roadmap Impact

| Phase | Description | Status |
|-------|-------------|--------|
| Current | {what this PR does} | In Progress |
| Next | {what comes after} | Planned |

## Files Changed

{Tree structure with annotations}

## Commits

1. `{hash}` {message}

## Test Plan

- [ ] {verification step}

## Related

| Document | Relationship |
|----------|-------------|
| {doc} | {how it relates} |
