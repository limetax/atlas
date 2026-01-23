# ⚠️ IMPORTANT: Environment Setup Required

The API won't start without proper environment variables!

## Quick Setup

1. **Get your Supabase service role key**:
   - Check `supabase-project/.env` file
   - Look for `SERVICE_ROLE_KEY=...`

2. **Get your Anthropic API key**:
   - From your Anthropic dashboard
   - Starts with `sk-ant-...`

3. **Create `apps/api/.env`**:

```bash
# Supabase Configuration
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=3001
NODE_ENV=development
```

4. **Start the API**:

```bash
cd apps/api
pnpm dev
```

## ✅ Success Indicators

You should see:

```
✅ Supabase client initialized
✅ Anthropic client initialized
🚀 NestJS API running on http://localhost:3001
📡 tRPC endpoint: http://localhost:3001/api/trpc
🏥 Health check: http://localhost:3001/api/health
```

## 🧪 Test It Works

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "...", "service": "lime-gpt-api" }
```

---

**Note**: The `.env` file is gitignored for security. Each developer needs to create their own.
