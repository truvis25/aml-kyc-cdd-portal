# Manual QA Backlog

Aggregated by Docs-Sync from `.qa/manual-verification-<slug>.md` files. Each module appended once (idempotent — Docs-Sync reads the last 30 lines first to skip duplicates).

Format:

```
## Module: <name>  — <PR #N> — <date>
- [ ] <verification step 1>
- [ ] <verification step 2>
```

Items here represent scenarios that QA could not deterministically verify in the cloud agent environment (placeholder credentials, no live browser, no Stripe live keys, etc.) and require a human reviewer to confirm before merging or releasing.

---

(Modules will append below as they ship.)
