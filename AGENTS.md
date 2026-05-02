<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Services overview

| Service | How to start | Default port |
|---------|-------------|-------------|
| **Supabase local stack** | `supabase start` (from repo root) | API :54321, DB :54322, Studio :54323, Mailpit :54324 |
| **Next.js dev server** | `npm run dev` | :3000 |

### Key gotchas

- **JWT hook is required for login**: The `custom_access_token_hook` Postgres function enriches JWTs with `tenant_id`, `user_role`, and `permissions`. It is configured in `supabase/config.toml` under `[auth.hook.custom_access_token]`. Without it, authenticated users get redirected to `/sign-in?error=session_invalid` because the platform layout checks for these claims.
- **`validate:env` script expects remote-style URLs**: The `check-env.mjs` script validates that `NEXT_PUBLIC_SUPABASE_URL` starts with `https://` and contains `.supabase`. For local dev (`http://127.0.0.1:54321`), the script will emit a warning but exit 0. This is expected.
- **Admin seed user requires MFA setup**: After signing in as `admin@truvis-test.local` (password: `AdminPass123!`), the `tenant_admin` role triggers MFA enrollment at `/mfa-setup`. This is by design — MFA is required for admin roles (see `lib/constants/roles.ts: MFA_REQUIRED_ROLES`).
- **Docker must be running for Supabase**: The local Supabase stack runs in Docker containers. Ensure Docker daemon is started before `supabase start`.
- **`backend/` and `frontend/` dirs are legacy**: They are not part of the active runtime. The active app is the root-level Next.js project.
- **Standard dev commands**: See `README.md` and `CLAUDE.md` for the full list of `npm run` scripts (`lint`, `typecheck`, `test`, `build`, `check`, etc.).
