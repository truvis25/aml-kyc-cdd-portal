# /develop-next-module

Runs the full TRUVIS DevOs Team per-module development cycle for the AML/KYC/CDD Portal.

## What this command does

Delegates to the **Tech Lead** agent, which:

1. Runs `npm run check:foundations` (Phase-0 gate).
2. Reads `PROJECT.md` to find the launch checklist.
3. Asks you to confirm which unchecked item is the next module.
4. Writes a Module Spec, inserts a CLAUDE.md anchor, checks architect triggers.
5. Creates a branch + draft PR.
6. Dispatches Frontend Dev, Backend Dev (right-sized per the triage table).
7. Runs QA Engineer.
8. Runs Docs-Sync.
9. Reports back: PR number, manual gap list, and `risk: <NONE|PRIVACY|AUTH|DATA>`.

## Prerequisites

- `PROJECT.md` exists and is filled in.
- `CLAUDE.md` exists (it does — it's the portal's main CLAUDE.md).
- `npm run check:foundations` passes.
- The launch checklist in `docs/FINAL_LAUNCH_PLAN.md` has at least one unchecked item.

## Usage

```
/develop-next-module
```

No arguments needed. Tech Lead reads `PROJECT.md` to discover everything else.

## Invocation

```
<agents>tech-lead</agents>

Run the `/develop-next-module` 12-step sequence as described in your agent file.
Start with Phase-0: `npm run check:foundations`.
```
