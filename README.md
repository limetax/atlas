# limetax Atlas

Enterprise-grade AI assistant for German tax advisors (Steuerberater).

## 🏗️ Architecture

- **Backend**: NestJS + tRPC (TypeScript)
- **Frontend**: Vite + React + TanStack Router + TanStack Query
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude Sonnet 4
- **Monorepo**: Turborepo + pnpm

## 📁 Project Structure

```
lime-gpt/
├── apps/
│   ├── api/          # NestJS backend with tRPC
│   ├── web/          # Vite + React frontend
├── packages/
│   └── shared/       # Shared types and validators
├── database/         # SQL migrations
└── supabase-project/ # Local Supabase Docker
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker Desktop** for local Supabase

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Supabase

```bash
cd supabase-project

# First time: generate secure keys
sh ./utils/generate-keys.sh

# Start services
docker compose up -d
```

### 3. Configure Environment

**Backend** (`apps/api/.env`):

```bash
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=<from supabase-project/.env>
ANTHROPIC_API_KEY=<your-key>
FRONTEND_URL=http://localhost:5173
PORT=3001
```

**Frontend** (`apps/web/.env`):

```bash
VITE_API_URL=http://localhost:3001
```

### 4. Run Migrations

```bash
docker exec -i supabase-db psql -U postgres < database/migrations/001_auth_schema.sql
docker exec -i supabase-db psql -U postgres < database/migrations/002_pgvector_tax_documents.sql
docker exec -i supabase-db psql -U postgres < database/migrations/003_datev_data.sql
```

### 5. Create Test User

```bash
# Get service role key from supabase-project/.env
export SERVICE_ROLE_KEY="your-service-role-key"

# Create advisory
docker exec -i supabase-db psql -U postgres -c \
  "INSERT INTO public.advisories (name, slug) VALUES ('limetax Demo', 'limetax-demo') ON CONFLICT DO NOTHING;"

# Create user via Supabase Auth API
curl -X POST 'http://localhost:8000/auth/v1/admin/users' \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@limetax.de","password":"test1234","email_confirm":true,"user_metadata":{"full_name":"Test Berater"}}'

# Assign user to advisory
docker exec -i supabase-db psql -U postgres -c \
  "UPDATE public.advisors SET advisory_id = (SELECT id FROM public.advisories WHERE slug = 'limetax-demo'), role = 'admin' WHERE email = 'test@limetax.de';"
```

### 6. Start Development Servers

```bash
# All services (recommended)
pnpm dev

# Or individually:
pnpm --filter @lime-gpt/api dev     # Backend on :3001
pnpm --filter @lime-gpt/web dev     # Frontend on :5173
pnpm --filter nextjs dev             # Legacy Next.js on :3000
```

## 🧪 Testing

**Login credentials**: `test@limetax.de` / `test1234`

- **New Vite App**: http://localhost:5173
- **NestJS API**: http://localhost:3001/api/health
- **Legacy Next.js**: http://localhost:3000

## 🚀 Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @lime-gpt/api build
pnpm --filter @lime-gpt/web build
```

## 📡 API Endpoints

- **Health**: `GET /api/health`
- **tRPC**: `POST /api/trpc/[procedure]`
  - `auth.login` - Authenticate user
  - `auth.getUser` - Get current user
  - `auth.getAdvisor` - Get advisor profile
  - `chat.sendMessage` - Stream chat response (subscription)

## 🎯 Type Safety

Full end-to-end type safety from database to frontend:

```
Supabase Types → NestJS Services → tRPC Router → React Components
```

- ✅ Zero runtime type errors
- ✅ Autocomplete everywhere
- ✅ Compile-time validation

## 🔧 Development Commands

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm typecheck    # TypeScript check all apps
```

## 📚 Documentation

- [Migration Plan](/Users/cdansard/.cursor/plans/next.js_to_nestjs_vite_tanstack_final.plan.md)
- [Architecture](ARCHITECTURE.md)

## 🌐 Deployment

See deployment plan for Coolify configuration:

- `api.limetax.de` → NestJS Backend
- `app.limetax.de` → Vite Frontend

---

Made with 🍋 by [limetax](https://limetax.de)
