# Deployment Guide - Coolify

This guide covers deploying the limetax Atlas monorepo to Coolify with separate backend and frontend services.

## 🏗️ Architecture

- **api.limetax.de** → NestJS Backend (Port 3001)
- **app.limetax.de** → Vite Frontend (Static Site)
- **supabase.limetax.de** → Supabase Instance

## 📦 Backend Deployment (NestJS API)

### Coolify Configuration

**Resource Type**: Application  
**Build Pack**: Docker

**Repository Settings**:

- Branch: `main`
- Base Directory: `/` (root)
- Dockerfile Path: `apps/api/Dockerfile`

**Environment Variables**:

```bash
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://supabase.limetax.de
SUPABASE_SERVICE_ROLE_KEY=<from-supabase>
ANTHROPIC_API_KEY=<your-key>
FRONTEND_URL=https://app.limetax.de
```

**Health Check**:

- URL: `/api/health`
- Method: GET
- Expected: `200 OK`

### Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @lime-gpt/shared build

# Build API
RUN pnpm --filter @lime-gpt/api build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ../packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ../packages/shared/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**Build Command** (Alternative to Dockerfile):

```bash
cd /app && pnpm install --frozen-lockfile && pnpm --filter @lime-gpt/api build
```

**Start Command**:

```bash
cd /app/apps/api && node dist/main.js
```

## 🎨 Frontend Deployment (Vite)

### Coolify Configuration

**Resource Type**: Static Site  
**Build Pack**: Node.js

**Repository Settings**:

- Branch: `main`
- Base Directory: `/`
- Build Directory: `apps/web`

**Build Command**:

```bash
cd /app && pnpm install --frozen-lockfile && pnpm --filter @lime-gpt/web build
```

**Output Directory**: `apps/web/dist`

**Environment Variables**:

```bash
VITE_API_URL=https://api.limetax.de
```

### Nginx Configuration (if using custom)

```nginx
server {
  listen 80;
  server_name app.limetax.de;

  root /app/apps/web/dist;
  index index.html;

  # SPA routing - all routes serve index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
}
```

## 🔐 Environment Variables Reference

### Backend (apps/api/.env)

| Variable                    | Description           | Example                       | Required |
| --------------------------- | --------------------- | ----------------------------- | -------- |
| `NODE_ENV`                  | Environment           | `production`                  | Yes      |
| `PORT`                      | Server port           | `3001`                        | Yes      |
| `SUPABASE_URL`              | Supabase instance URL | `https://supabase.limetax.de` | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key  | `eyJ...`                      | Yes      |
| `ANTHROPIC_API_KEY`         | Claude API key        | `sk-ant-...`                  | Yes      |
| `FRONTEND_URL`              | Frontend URL (CORS)   | `https://app.limetax.de`      | Yes      |

### Frontend (apps/web/.env)

| Variable       | Description     | Example                  | Required |
| -------------- | --------------- | ------------------------ | -------- |
| `VITE_API_URL` | Backend API URL | `https://api.limetax.de` | Yes      |

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] Supabase instance running at `supabase.limetax.de`
- [ ] All migrations applied to production database
- [ ] Test user created in production Supabase
- [ ] Anthropic API key valid and has credit
- [ ] DNS records configured (api.limetax.de, app.limetax.de)

### Backend Deployment

- [ ] Coolify resource created for API
- [ ] Environment variables configured
- [ ] Dockerfile builds successfully
- [ ] Health check responds: `/api/health`
- [ ] tRPC endpoint accessible: `/api/trpc`
- [ ] Logs visible in Coolify dashboard

### Frontend Deployment

- [ ] Coolify resource created for frontend
- [ ] Build command executes successfully
- [ ] Static files served correctly
- [ ] SPA routing works (no 404 on refresh)
- [ ] Assets load with correct cache headers
- [ ] API calls reach backend (check network tab)

### Post-Deployment Validation

- [ ] Login works with test credentials
- [ ] Chat streaming functions correctly
- [ ] Citations display properly
- [ ] No CORS errors in console
- [ ] SSL certificates valid
- [ ] Performance acceptable (< 2s load time)

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Health check fails  
**Solution**: Check logs in Coolify, verify environment variables loaded

**Problem**: tRPC endpoint 404  
**Solution**: Verify `/api/trpc` route is mounted in main.ts

**Problem**: Supabase connection fails  
**Solution**: Check SUPABASE_SERVICE_ROLE_KEY is correct, verify network connectivity

### Frontend Issues

**Problem**: Blank page after deployment  
**Solution**: Check browser console for errors, verify `index.html` is served

**Problem**: 404 on page refresh  
**Solution**: Configure SPA routing in Nginx (try_files)

**Problem**: API calls fail (CORS)  
**Solution**: Verify `FRONTEND_URL` in backend env matches frontend domain

**Problem**: Environment variables not loading  
**Solution**: Ensure `VITE_` prefix on all frontend env vars

## 🔄 Rolling Back

If deployment fails:

1. **Revert to Next.js**: The `/nextjs` folder contains the working app
2. **Quick Rollback**: Deploy the `/nextjs` folder as a standalone Next.js app
3. **Zero Downtime**: Keep Next.js running until new stack is verified

## 📈 Monitoring

### Key Metrics to Track

- API response times (p50, p95, p99)
- Error rates
- Chat streaming success rate
- Frontend load time
- Bundle size after updates

### Logs

**Backend**: Coolify captures stdout/stderr from NestJS Logger  
**Frontend**: Browser console errors (consider Sentry for production)

## 🚀 CI/CD (Future)

With Turborepo, you can optimize builds:

```yaml
# .github/workflows/deploy.yml
- name: Build with Turbo
  run: |
    pnpm install
    pnpm turbo run build --filter=@lime-gpt/api --filter=@lime-gpt/web
```

Turborepo cache will speed up repeated builds significantly.

---

**Support**: If you encounter issues, check the [Migration Plan](/Users/cdansard/.cursor/plans/next.js_to_nestjs_vite_tanstack_final.plan.md) for detailed troubleshooting.
