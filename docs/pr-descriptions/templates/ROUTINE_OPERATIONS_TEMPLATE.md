# Routine Operations PR Template

_Use this template for maintenance runs, tool execution batches, and chore operations._

---

## Coat of Arms

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                      {MAGNITUDE}                             |
|                                                              |
|          {typecheck}  [SHIELD]  {lint}                       |
|                   hammer x {count}                           |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           files: {n} | +{added} / -{removed}                |
+--------------------------------------------------------------+
|   "{motto}"                                                  |
+--------------------------------------------------------------+
```

**Compact:** {mag-sym} [{domain}] hammer x{n} {supporters} +{a}/-{r}

---

## Completeness Badge

| Badge | Criteria |
|-------|----------|
| GOLD | All tools run, all checks pass, zero staleness |
| SILVER | All tools run, minor warnings, minimal staleness |
| BRONZE | Partial tool run, some checks skipped |

**This PR: {GOLD/SILVER/BRONZE}**

---

## Summary

{1-3 sentences: what routine operations were performed and why}

## Tools Run Matrix

| Tool | Command | Status | Notes |
|------|---------|--------|-------|
| {tool} | `{command}` | pass/FAIL | {notes} |

## Operations Performed

| # | Operation | Scope | Result |
|---|-----------|-------|--------|
| 1 | {operation} | {scope} | {result} |

## Staleness Report

| Area | Last Updated | Status |
|------|-------------|--------|
| Dependencies | {date} | Fresh/Stale |
| Lock file | {date} | Fresh/Stale |
| Type definitions | {date} | Fresh/Stale |

## Files Changed

{Tree structure}

## Commits

1. `{hash}` {message}

## Test Plan

- [ ] All tools run successfully
- [ ] No regressions introduced
- [ ] Lock file regenerated cleanly
