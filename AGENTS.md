# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

AML/KYC/CDD Compliance Portal — NestJS backend (port 3001) + Next.js frontend (port 3000) with PostgreSQL and Redis infrastructure via Docker Compose. See `README.md` for full architecture and API docs.

### Infrastructure

Start PostgreSQL and Redis before running the backend:

```bash
sudo dockerd &>/tmp/dockerd.log &  # if Docker daemon isn't running
sudo docker compose up -d postgres redis
```

The `.env` file at the repo root holds all config. Symlinks in `backend/.env` and `frontend/.env` point to it. If `.env` is missing, copy from `.env.example` and fill in dev secrets (see README for secret generation).

### Backend

```bash
cd backend
npm ci
npx prisma generate
DATABASE_URL="postgresql://aml_user:devpassword123@localhost:5432/aml_kyc_db?schema=public" npx prisma migrate dev
npm run start:dev  # port 3001, watch mode
```

- Prisma CLI does not read the root `.env` automatically; pass `DATABASE_URL` explicitly or ensure `backend/.env` symlink exists.
- Swagger docs: http://localhost:3001/api/docs
- Tests: `npm test` (no DB required — unit tests use mocks)
- Lint: `npx eslint "{src,apps,libs,test}/**/*.ts"` (requires `.eslintrc.js` in backend)

### Frontend

```bash
cd frontend
npm ci
npm run dev  # port 3000
```

- Lint: `npx next lint`
- Build: `npx next build`
- Requires `postcss.config.js` for Tailwind CSS processing.

### Gotchas

- The backend `start:dev` watch mode auto-recompiles on file changes but does **not** re-run Prisma migrations. After schema changes, run `npx prisma migrate dev` manually.
- `multer@2.x` does not expose `Express.Multer.File` type — the documents controller uses `any` type annotation as a workaround.
- Frontend pages (dashboard, onboarding, etc.) render with mock/static data and don't require authentication to view.
- The login form on the frontend makes requests to `NEXT_PUBLIC_API_URL` — ensure it's set to `http://localhost:3001/api/v1` in `.env`.

### Seed data

To create an admin user for testing:

```bash
cd backend
DATABASE_URL="postgresql://aml_user:devpassword123@localhost:5432/aml_kyc_db?schema=public" node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('Password123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@compliance.dev' },
    update: {},
    create: { email: 'admin@compliance.dev', passwordHash: hash, firstName: 'Admin', lastName: 'User', role: 'COMPLIANCE_ADMIN', isActive: true, mfaEnabled: false }
  });
  await prisma.\$disconnect();
  console.log('Admin user seeded');
})();
"
```

Login: `POST /api/v1/auth/login` with `{"email":"admin@compliance.dev","password":"Password123!"}`.
