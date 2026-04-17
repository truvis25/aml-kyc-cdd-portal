## What changed

<!-- One-sentence summary of the change -->

## Why

<!-- The problem this solves or the requirement it fulfils -->

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Database migration
- [ ] Configuration / infrastructure
- [ ] Refactor (no behaviour change)
- [ ] Documentation

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds locally
- [ ] No secrets, PII, or service-role key added to the codebase
- [ ] Architecture rules in CLAUDE.md reviewed (RLS, audit, admin client usage)

**If this PR includes a database migration:**
- [ ] Tested locally with `supabase db reset`
- [ ] Migration is append-only / non-destructive, OR destruction is documented and approved
- [ ] `supabase db push --dry-run` reviewed before merging
- [ ] JWT hook permission map in `0005_jwt_custom_access_token_hook.sql` matches `modules/auth/rbac.ts` if permissions changed
