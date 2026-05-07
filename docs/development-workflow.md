# Development Workflow SOP

This document describes the standard operating procedure for developing new modules
using the TRUVIS DevOs Team multi-subagent workflow.

## Principles

1. **Every signal routes through Tech Lead.** Bug fix, restyle, new feature, schema
   change — all of it. Tech Lead triages and dispatches the minimum necessary specialists.

2. **Right-size the dispatch.** Blanket-dispatching all 6 agents on every cycle is waste.
   A CSS fix needs Frontend Dev. A query bug needs Backend Dev. Only a full new module
   needs the whole team.

3. **Phase-0 before everything.** `npm run check:foundations` runs before any work
   starts. Missing foundations mean the session stops until they exist.

4. **Module Spec before builders.** Tech Lead writes a Module Spec before dispatching
   builders. Builders read it. Nothing is built without a spec.

5. **Audit invariant is load-bearing.** Every mutation on a sensitive table must call
   `withAuditedMutation`. QA checks for this. Missing audit logs block merge.

6. **Privacy gate is always checked.** `FORBIDDEN_FIELD_SET` is the single source of
   truth for internal-only fields. QA's `assertNoForbiddenFields` runs on every API
   response shape.

---

## Per-module cycle (the 12-step sequence)

```
1. Phase-0 gate         npm run check:foundations
2. Read launch list     PROJECT.md → launchChecklistPath
3. Confirm next module  AskUserQuestion (top 3 options)
4. Write Module Spec    .claude/scratch/module-<slug>-spec.md
5. Insert anchor        <!-- PROJECT:<slug> --> in CLAUDE.md
6. Architect triggers   npm run check:architect-triggers
   └─ if triggers fire → dispatch Architect
7. Branch + draft PR    git checkout -b feat/<slug>
8. Builders             FE | BE | FE+BE (parallel) per triage table
                        be-first | be-first-stub per PROJECT.md builderDefault
9. Phase-0 re-check     npm run check:foundations (quick recheck after schema changes)
10. QA pass             QA Engineer (regression + adversarial)
                        model: claude-opus-4-7 when risk=AUTH|DATA|PRIVACY or payment/multi-tenant
                        → if QA_BLOCKED: re-dispatch builders → re-run QA (max 3 cycles)
11. Docs pass           Docs-Sync (CLAUDE.md + checklist + PR desc)
12. Sign-off            PR # + manual gap list + risk:<tag>
```

---

## Triage table

| Signal | Dispatch |
|---|---|
| Pure restyle / copy | Frontend Dev |
| UI component (no new API/DB) | Frontend Dev |
| Query bug | Backend Dev |
| New API route (existing schema) | Backend Dev → QA |
| Cross-surface feature | FE + BE (parallel) → QA → Docs-Sync |
| Schema change | Architect? → BE → FE → QA → Docs-Sync |
| Auth / privacy / payment | Architect (always) → BE → QA Engineer (opus) → Docs-Sync |
| New full module | Full team (12-step cycle above) |

---

## Module Spec format

```markdown
# Module Spec — <slug>

## Goal
<one paragraph>

## Acceptance criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## DB changes
<table / column / migration description, or "None">

## API surface
<route(s), method(s), request/response shape>

## UI surface
<page(s), component(s), user flows>

## Risk tag
NONE | PRIVACY | AUTH | DATA

## Open questions
<anything unresolved — answered by Architect if triggers fire>
```

---

## Risk tags

| Tag | Meaning | Extra steps |
|---|---|---|
| NONE | No sensitive surface | Standard flow |
| PRIVACY | PII exposed or handled | `assertNoForbiddenFields` on every response; Architect reviews |
| AUTH | Auth logic changed | IDOR probe in QA; Architect always dispatched |
| DATA | Financial or high-integrity data | Atomic transactions required; QA-Opus; Architect always |

---

## QA riskTag system

Every QA finding is tagged:

- `riskTag: bug` — blocks merge
- `riskTag: warning` — should fix, doesn't block
- `riskTag: info` — informational

---

## Architect escalation

Architect is invoked when `npm run check:architect-triggers` fires at least one
trigger, or when the module's risk tag is AUTH, DATA, or PRIVACY.

Architect output: ≤500 words. Decisions go into `docs/adr/` using MADR v4 format.

---

## Branching convention

```
feat/<slug>        — new module
fix/<slug>         — bug fix
refactor/<slug>    — refactor
chore/<slug>       — maintenance
```

All branches are created by Tech Lead. Builders commit to the active branch.

---

## Continuous improvement

When you discover an improvement to this workflow in a downstream project, open a
PR back to `truvis25/truvis-devos-team-`. The playbook evolves with usage.
