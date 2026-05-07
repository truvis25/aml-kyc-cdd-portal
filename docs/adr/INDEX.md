# Architecture Decision Records

All non-trivial architectural decisions are recorded here as ADRs.

New ADRs use the MADR v4 template (`docs/adr/0002-madr-v4-template.md`).
Legacy ADRs use the Nygard format.

| # | Title | Status | Date |
|---|---|---|---|
| [0001](./0001-foundation-primitives.md) | Foundation Primitives | Accepted | 2026-05-01 |
| [0002](./0002-madr-v4-template.md) | MADR v4 Template | Template | — |

## Adding a new ADR

1. Copy `docs/adr/0002-madr-v4-template.md` to `docs/adr/NNNN-<slug>.md`
   where `NNNN` is the next sequential number.
2. Fill in all sections.
3. Add a row to this index.
4. The Architect agent handles this automatically when a new decision is novel.
