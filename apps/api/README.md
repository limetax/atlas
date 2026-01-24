# NestJS API - Setup Instructions

## ⚠️ Before Starting

You need to configure environment variables first!

### 1. Create `.env` file

```bash
cd apps/api
cp .env.example .env
```

### 2. Get Supabase Keys

From your running Supabase instance:

```bash
cd ../../supabase-project
cat .env | grep -E "ANON_KEY|SERVICE_ROLE_KEY"
```

Copy the `SERVICE_ROLE_KEY` value.

### 3. Edit `apps/api/.env`

```bash
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
ANTHROPIC_API_KEY=<your-anthropic-key>
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### 4. Start the API

```bash
pnpm dev
```

Expected output:

```
✅ Supabase client initialized
✅ Anthropic client initialized
🚀 NestJS API running on http://localhost:3001
📡 tRPC endpoint: http://localhost:3001/api/trpc
🏥 Health check: http://localhost:3001/api/health
```

### 5. Test Health Check

```bash
curl http://localhost:3001/api/health
```

Expected:

```json
{ "status": "ok", "timestamp": "2026-01-22T...", "service": "lime-gpt-api" }
```

## 🐛 Troubleshooting

**Error**: `Missing Supabase environment variables`  
**Fix**: Create `.env` file with proper keys (see above)

**Error**: `Cannot find module '@lime-gpt/shared'`  
**Fix**: Run `pnpm install` from root

**Error**: `Port 3001 already in use`  
**Fix**: Change `PORT=3002` in `.env` or kill existing process

## 📡 API Endpoints

- `GET /api/health` - Health check
- `POST /api/trpc/auth.login` - Login
- `GET /api/trpc/auth.getUser` - Get current user
- `GET /api/trpc/auth.getAdvisor` - Get advisor profile
- `SUBSCRIPTION /api/trpc/chat.sendMessage` - Stream chat response

## 🔧 Development

```bash
pnpm dev          # Start in watch mode
pnpm build        # Build for production
pnpm start        # Run production build
pnpm typecheck    # Check types
```
