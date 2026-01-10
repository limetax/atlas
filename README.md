# limetax Atlas

## 🚀 Tech Stack

- **Next.js 16** (App Router, SSR, Streaming)
- **Supabase** (Auth, PostgreSQL, pgvector)
- **Claude Sonnet 4** (200k context, best German language support)
- **TypeScript** + **Tailwind CSS 4**

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))

### 1. Clone & Install

```bash
git clone git@github.com:limetax/atlas.git
cd atlas
npm install
```

### 2. Start Local Supabase

```bash
cd supabase-project

# First time only: generate secure keys
sh ./utils/generate-keys.sh

# Start services
docker compose pull
docker compose up -d
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with keys from `supabase-project/.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<copy from SERVICE_ROLE_KEY>
ANTHROPIC_API_KEY=<ask team lead>
```

### 4. Run Migrations & Create Test User

```bash
# Apply database schema
docker exec -i supabase-db psql -U postgres < database/migrations/001_auth_schema.sql

# Create test advisory
docker exec -i supabase-db psql -U postgres -c \
  "INSERT INTO public.advisories (name, slug) VALUES ('limetax Demo', 'limetax-demo') ON CONFLICT DO NOTHING;"

# Create test user (via Supabase Auth API)
curl -X POST 'http://localhost:8000/auth/v1/admin/users' \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@limetax.de","password":"test1234","email_confirm":true,"user_metadata":{"full_name":"Test Berater"}}'

# Assign user to advisory
docker exec -i supabase-db psql -U postgres -c \
  "UPDATE public.advisors SET advisory_id = (SELECT id FROM public.advisories WHERE slug = 'limetax-demo'), role = 'admin' WHERE email = 'test@limetax.de';"
```

### 5. Start Development

```bash
npm run dev
```

Visit http://localhost:3000

**Test login:** `test@limetax.de` / `test1234`

## 🏗️ Project Structure

```
atlas/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── login/             # Auth pages
│   └── page.tsx           # Main chat interface
├── components/
│   ├── elements/          # Atomic UI (Button, Input)
│   ├── components/        # Composed (LoginForm, ChatMessage)
│   └── views/             # Page layouts (Header, Sidebar)
├── lib/
│   ├── infrastructure/    # External clients (Supabase, Anthropic)
│   ├── services/          # Business logic
│   └── adapters/          # Interface adapters
├── database/
│   └── migrations/        # SQL migrations
└── supabase-project/      # Local Supabase Docker (gitignored)
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check

# Supabase
cd supabase-project
docker compose up -d     # Start Supabase
docker compose down      # Stop Supabase
docker compose down -v   # Reset database
docker compose logs -f   # View logs
```

## 🌐 Local Services

| Service             | URL                   | Notes              |
| ------------------- | --------------------- | ------------------ |
| **App**             | http://localhost:3000 | Next.js dev server |
| **Supabase Studio** | http://localhost:8000 | Database UI        |
| **API**             | http://localhost:8000 | REST API via Kong  |

---

Made with 🍋 by [limetax](https://limetax.de)
