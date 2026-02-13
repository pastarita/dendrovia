# Cross-Checkout Scan PR Template

_Use this template for branch inventory scans across multiple checkouts or environments._

---

## Coat of Arms (Observatory Scan Variant)

```
+--------------------------------------------------------------+
|   {branch-name}                                              |
+--------------------------------------------------------------+
|                    OBSERVATORY SCAN                          |
|                                                              |
|          {typecheck}  [SHIELD]  {lint}                       |
|                   book x {count}                             |
|                                                              |
|                [{domain(s)}]                                 |
|                                                              |
|           checkouts: {n} | branches: {n}                    |
+--------------------------------------------------------------+
|   "Scientia potentia est"                                    |
+--------------------------------------------------------------+
```

---

## Summary

{1-3 sentences: what was scanned and why}

## Checkout Topology

```mermaid
flowchart TB
    {diagram showing checkout relationships}
```

## Scan Results

| Checkout | Branch | Status | Ahead/Behind | Action |
|----------|--------|--------|-------------|--------|
| {name} | {branch} | clean/dirty | +{n}/-{n} | {action} |

## Integration Priority Queue

| Priority | Checkout | Branch | Reason |
|----------|----------|--------|--------|
| P0 (Critical) | {name} | {branch} | {reason} |
| P1 (High) | {name} | {branch} | {reason} |
| P2 (Normal) | {name} | {branch} | {reason} |
| P3 (Low) | {name} | {branch} | {reason} |

## Cleanup Execution Plan

| # | Action | Target | Risk |
|---|--------|--------|------|
| 1 | {action} | {checkout/branch} | {risk level} |

## Stale Branch Inventory

| Branch | Last Commit | Age | Recommendation |
|--------|-------------|-----|----------------|
| {branch} | {date} | {days} | Archive/Merge/Delete |

## Files Changed

{Tree structure}

## Commits

1. `{hash}` {message}

## Test Plan

- [ ] All checkouts accounted for
- [ ] Priority queue reviewed
- [ ] No orphaned branches
