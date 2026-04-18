# AML / KYC / CDD Portal

Compliance portal for Anti-Money Laundering, Know Your Customer, and Customer Due Diligence workflows.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Supabase Postgres + Auth · Tailwind CSS · Vercel (region: me1 Bahrain)

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in values from your local Supabase instance (see supabase start output)

# 3. Start local Supabase (requires Docker)
supabase start
supabase db reset   # runs migrations + seeds

# 4. Register JWT hook in local Supabase Studio (required once)
# http://localhost:54323 → Authentication → Hooks → Custom Access Token Hook
# → select: custom_access_token_hook → Save

# 5. Start dev server
npm run dev
```

Local admin credentials: `admin@truvis-test.local` / `AdminPass123!`

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run check` | Typecheck + lint + test (run before pushing) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests (Vitest) |
| `npm run validate:env` | Verify all required env vars are set |
| `npm run db:reset` | Reset local database (re-runs migrations + seeds) |
| `npm run db:push` | Push pending migrations to linked remote Supabase |
| `npm run db:push:dry` | Dry-run — show pending migrations without applying |
| `npm run db:types` | Regenerate TypeScript types from local schema |

---

## Project Structure

```
app/
  (auth)/           Sign-in, MFA setup
  (platform)/       Authenticated platform pages
  api/              API route handlers
modules/            Business logic (auth, audit, onboarding, ...)
lib/
  supabase/         Client factory (client.ts, server.ts, admin.ts)
  constants/        Roles, events, enums
  validations/      Zod schemas
components/         React components
supabase/
  migrations/       Sequential database migrations
  seed/             Local development seed data
  config.toml       Local Supabase configuration
docs/               Architecture and deployment documentation
```

---

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment runbook, environment setup, migration procedures
- [`docs/MILESTONE_CHECKLISTS.md`](docs/MILESTONE_CHECKLISTS.md) — Acceptance criteria per milestone
- [`docs/BUILD_ORDER.md`](docs/BUILD_ORDER.md) — Sequential build plan
- [`CLAUDE.md`](CLAUDE.md) — Architecture decisions and development rules

---

## Deployment

- **App:** Vercel deploys automatically on every push via GitHub integration. `main` → production.
- **Database:** Migrations are applied manually. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- **Region:** Vercel `me1` (Bahrain) — UAE data residency baseline.
# AML/KYC/CDD Compliance Portal

A production-ready web application for a Corporate Service Provider (CSP) operating globally, subject to the UAE AML/CFT framework under:

- 🏛️ **Central Bank of the UAE (CBUAE)**
- 🏛️ **Abu Dhabi Global Market (ADGM)**
- 🏛️ **Dubai Financial Services Authority (DFSA)**

Compliant with **UAE Personal Data Protection Law (PDPL)** and structured for **goAML** reporting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AML/KYC/CDD Portal                        │
├─────────────────┬───────────────────┬───────────────────────┤
│  Next.js 14     │   NestJS Backend  │   Infrastructure       │
│  (App Router)   │   (REST API)      │                        │
│  TypeScript     │   PostgreSQL      │   Docker               │
│  TailwindCSS    │   Prisma ORM      │   MinIO (S3)           │
│  ShadCN UI      │   JWT + MFA       │   Redis                │
│  RTL Support    │   RBAC            │   AES-256 Encryption   │
│  i18n           │   Audit Logging   │   TLS                  │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm or yarn

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/aml-kyc-cdd-portal.git
cd aml-kyc-cdd-portal

# Copy environment template
cp .env.example .env

# Edit .env and fill in ALL required values
# Especially: passwords, JWT secrets, encryption keys
nano .env
```

### 2. Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 64

# Generate encryption key (AES-256 = 32 bytes)
openssl rand -hex 32
```

### 3. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, MinIO, Backend, Frontend)
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Seed initial data (admin user, country risk ratings)
docker-compose exec backend npm run prisma:seed
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend Portal | http://localhost:3000 |
| Backend API | http://localhost:3001/api/v1 |
| API Documentation (Swagger) | http://localhost:3001/api/docs |
| MinIO Console | http://localhost:9001 |

---

## 🗂️ Project Structure

```
aml-kyc-cdd-portal/
├── frontend/                    # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/           # Auth + MFA
│   │   │   ├── dashboard/       # Compliance dashboard
│   │   │   ├── onboarding/      # Client onboarding forms
│   │   │   ├── clients/         # Case management
│   │   │   ├── mlro/            # MLRO module + SAR
│   │   │   ├── audit/           # Immutable audit viewer
│   │   │   └── admin/           # Configuration panel
│   │   ├── components/          # Reusable UI components
│   │   └── lib/                 # API client, utils
│   └── Dockerfile
│
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── auth/                # JWT + MFA (TOTP)
│   │   ├── users/               # User management
│   │   ├── clients/             # Client CRUD
│   │   ├── documents/           # Document upload + checksums
│   │   ├── risk/                # Risk scoring engine ⭐
│   │   ├── onboarding/          # State machine ⭐
│   │   ├── mlro/                # SAR + EDD + bundle export
│   │   ├── audit/               # Immutable audit logs
│   │   ├── integrations/        # Adapter pattern for providers
│   │   │   └── adapters/        # ID verify, sanctions, PEP...
│   │   ├── common/
│   │   │   ├── guards/          # JWT + RBAC guards
│   │   │   ├── decorators/      # @Roles, @CurrentUser, @Public
│   │   │   └── enums.ts         # State machine + RBAC enums
│   │   └── prisma/              # Database service
│   ├── prisma/
│   │   └── schema.prisma        # Full database schema ⭐
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 👥 User Roles (RBAC)

| Role | Permissions |
|------|------------|
| `CLIENT` | Submit onboarding, upload documents, view own status |
| `RELATIONSHIP_MANAGER` | Manage assigned clients, trigger reviews |
| `KYC_ANALYST` | Verify documents, run screening, assess risk |
| `MLRO` | **Mandatory** approval for high-risk; create/submit SARs; export bundles |
| `COMPLIANCE_ADMIN` | Full access + configuration; manage users |
| `AUDITOR` | Read-only access to all logs and cases |

**MFA is mandatory for all staff roles.**

---

## 🔄 Onboarding State Machine

```
NEW
  ↓
EMAIL_VERIFIED
  ↓
MOBILE_VERIFIED
  ↓
IN_PROGRESS
  ↓
DOCUMENTS_UPLOADED
  ↓
ID_VERIFIED
  ↓
SCREENING_COMPLETED
  ↓
RISK_ASSESSED ──────────────────────────────┐
  ↓                                          │
PENDING_RM_REVIEW → PENDING_MLRO → APPROVED │ (score ≥ 60 or hard trigger)
  ↓ (score 30-59)     ↓ (MLRO only)    ↓    │
  └──────────────────────────────────────────┘
                                        ↓
                                      ACTIVE
                                        ↓
                                      CLOSED

Any state → REJECTED (with reason)
```

---

## 📊 Risk Scoring Engine

Risk score is computed from weighted components (0–100):

| Component | Default Weight | Description |
|-----------|---------------|-------------|
| Country Risk | 20% | From FATF/country risk DB |
| Client Type | 10% | Legal entity = higher |
| Ownership Complexity | 15% | # of ownership layers |
| PEP Hit | 15% | Politically Exposed Person match |
| Sanctions Hit | 20% | UN/OFAC/EU list match |
| Document Verification | 10% | ID provider confidence score |
| Transaction Exposure | 10% | Expected volume/value |

**Routing rules:**
- Score **0–29** → Auto approve (LOW)
- Score **30–59** → RM review (MEDIUM)
- Score **60+** → MLRO mandatory (HIGH)

**Hard triggers** (force HIGH regardless of score):
- Sanctions hit
- Trust/escrow structure
- Missing UBO (≥25% threshold)

> Weights are configurable via Admin UI stored in `RiskEngineConfig` table.

---

## 📋 API Documentation

Swagger UI is available at: `http://localhost:3001/api/docs`

### Key Endpoints

```
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/mfa/verify         # Verify TOTP
GET    /api/v1/auth/me                 # Current user

POST   /api/v1/clients                 # Create client
GET    /api/v1/clients                 # List clients
GET    /api/v1/clients/:id             # Get client details

POST   /api/v1/onboarding/:id/transition   # State transition
GET    /api/v1/onboarding/:id/status       # Current status
GET    /api/v1/onboarding/:id/history      # Status history

POST   /api/v1/documents/upload/:clientId  # Upload document
GET    /api/v1/documents/client/:clientId  # List documents

POST   /api/v1/risk/calculate          # Calculate risk score

POST   /api/v1/mlro/sar                # Create SAR
POST   /api/v1/mlro/export/:clientId   # Export compliance bundle
GET    /api/v1/mlro/edd-checklist      # EDD checklist

GET    /api/v1/audit                   # Audit logs (paginated)
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| MFA | TOTP via `otplib` (mandatory for staff) |
| JWT | Short-lived access tokens (1h) + refresh (7d) |
| RBAC | `@Roles()` decorator + `RolesGuard` |
| Rate Limiting | `@nestjs/throttler` (configurable) |
| Document Encryption | AES-256 at rest via S3/MinIO server-side encryption |
| PII Protection | `AuditService.sanitizeDetails()` strips sensitive fields |
| Immutable Audit | No UPDATE/DELETE on `AuditLog` table |
| Input Validation | `class-validator` + `zod` on all inputs |
| XSS/Injection | Helmet + Prisma parameterized queries |
| CORS | Strict origin policy |

---

## 🔌 Integration Adapters

All integrations implement the **Adapter Pattern** and are swappable via provider config:

| Integration | Interface | Mock Available |
|-------------|-----------|---------------|
| ID Verification (OCR + Liveness) | `IdVerificationAdapter` | ✅ |
| Sanctions Screening (UN/OFAC/EU) | `SanctionsScreeningAdapter` | ✅ |
| PEP Database | `SanctionsScreeningAdapter` | ✅ |
| Adverse Media | `SanctionsScreeningAdapter` | ✅ |
| Email Service | `EmailAdapter` | — |
| SMS OTP | `SmsOtpAdapter` | — |
| Document Storage | `StorageAdapter` | — |

To switch providers, set `*_PROVIDER` env vars and implement the corresponding interface.

---

## 🗄️ Database Schema

Key tables:

- `User` — Staff and client accounts
- `Client` — Onboarding records (individual + legal entity)
- `Director`, `AuthorizedSignatory`, `UBO` — Entity structure
- `Document` — Uploaded files with SHA-256 checksums
- `ScreeningResult` — Sanctions/PEP/adverse media results
- `RiskScore` — Versioned risk assessments
- `StatusHistory` — **Immutable** state machine history
- `AuditLog` — **Immutable** compliance audit trail
- `SAR` — Suspicious Activity Reports
- `RiskEngineConfig` — Configurable risk weights
- `CountryRisk` — Country risk ratings

---

## 📜 Compliance Notes

- **UAE PDPL**: PII is never logged in audit trails (enforced via `sanitizeDetails()`)
- **FATF Recommendations**: State machine enforces risk-based approach
- **goAML**: SAR export generates structured bundle for manual upload
- **Audit Retention**: Configurable (default 6 years) via `AUDIT_LOG_RETENTION_YEARS`
- **Data Residency**: Configurable via `DATA_RESIDENCY_REGION`

---

## 🧪 Running Tests

```bash
# Backend unit tests
cd backend
npm install
npm test

# Backend test coverage
npm run test:cov
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

---

## ⚙️ Environment Variables

See [`.env.example`](.env.example) for the full list of required configuration variables.

**Critical variables to change before production:**
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET` (generate with `openssl rand -hex 64`)
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`
- All `*_API_KEY` provider credentials

---

## 📄 License

Private / Proprietary — Corporate Service Provider Internal Use Only
