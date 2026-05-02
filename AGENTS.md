<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Run `bash scripts/cloud-agent-setup.sh` before launch-readiness work in a fresh
Cloud Agent. It installs/validates Node 22, npm dependencies, Supabase CLI,
Playwright Chromium, and Docker daemon availability for local Supabase + E2E
testing.
