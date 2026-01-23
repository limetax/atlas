# Next Steps - Migration Completion

## ✅ Completed

1. ✅ **Monorepo Setup** - Turborepo + pnpm workspaces
2. ✅ **Shared Types Package** - `@lime-gpt/shared` with database types, validators
3. ✅ **NestJS Backend** - Full migration with tRPC, all services migrated
4. ✅ **Vite Frontend** - TanStack Router + Query, all components migrated
5. ✅ **Type Safety** - Zero `any` types, full end-to-end inference
6. ✅ **Build System** - Turborepo caching, parallel builds

## 🎯 Ready to Test

### Start All Services

Open 3 terminals:

**Terminal 1 - Supabase** (if not running):

```bash
cd supabase-project
docker compose up -d
```

**Terminal 2 - NestJS Backend**:

```bash
cd apps/api
# Copy env first: cp .env.example .env (and fill in keys)
pnpm dev
# Should start on http://localhost:3001
```

**Terminal 3 - Vite Frontend**:

```bash
cd apps/web
pnpm dev
# Should start on http://localhost:5173
```

### Test Checklist

1. **Health Check**: Visit http://localhost:3001/api/health
   - Expected: `{"status":"ok", ...}`

2. **Frontend Loads**: Visit http://localhost:5173
   - Expected: Login page loads

3. **Login**: Use `test@limetax.de` / `test1234`
   - Expected: Redirects to chat interface

4. **Chat Interface**: Send a test message
   - Expected: Streaming response with citations

5. **Compare with Legacy**: Visit http://localhost:3000
   - Expected: Same functionality as new app

## 🚧 What Still Needs Work

### Critical (Before Production)

1. **Environment Variables**: Copy `.env.local` to `apps/api/.env`

   ```bash
   # From nextjs/.env.local, copy:
   # - SUPABASE_URL
   # - SUPABASE_SERVICE_ROLE_KEY
   # - ANTHROPIC_API_KEY
   ```

2. **Test Chat Streaming**: Verify tRPC subscriptions work end-to-end
   - Send message
   - See "Denke nach..." indicator
   - Citations appear first
   - Text streams progressively

3. **User Menu**: Re-enable tRPC queries in Header.tsx
   ```typescript
   const { data: user } = trpc.auth.getUser.useQuery();
   const { data: advisor } = trpc.auth.getAdvisor.useQuery();
   ```

### Nice to Have

4. **Code Splitting**: Reduce bundle size (<500KB)
   - Use dynamic imports for routes
   - Split TanStack components

5. **Error Boundaries**: Add React error boundaries

6. **Loading States**: Better loading indicators

7. **Offline Support**: Service worker for offline access

## 📦 Coolify Deployment

Once testing is complete:

1. **Create API Resource** in Coolify:
   - Use Dockerfile at `apps/api/Dockerfile`
   - Set environment variables
   - Configure health check

2. **Create Frontend Resource**:
   - Static site deployment
   - Build command: `pnpm --filter @lime-gpt/web build`
   - Output: `apps/web/dist`

3. **Configure Domains**:
   - api.limetax.de → API
   - app.limetax.de → Frontend

## 🧹 Cleanup (After 1 Week in Production)

Once the new stack is stable:

```bash
# Remove legacy Next.js app
git rm -rf nextjs/

# Remove Supabase repository clone
git rm -rf supabase/

# Update workspace
# Edit pnpm-workspace.yaml, remove 'nextjs' entry

# Commit
git add -A
git commit -m "chore: migration complete, remove legacy Next.js app"
```

## 📊 Success Criteria

Before removing Next.js app:

- [ ] New app running in production for 7+ days
- [ ] No P0/P1 bugs reported
- [ ] Performance meets/exceeds baseline
- [ ] Team comfortable with new stack
- [ ] All features have parity with Next.js app

## 🎓 Learning Resources

- **NestJS**: https://docs.nestjs.com
- **tRPC**: https://trpc.io/docs
- **TanStack Router**: https://tanstack.com/router
- **TanStack Query**: https://tanstack.com/query
- **Turborepo**: https://turbo.build/repo/docs

## 💡 Tips

### Development Workflow

```bash
# Build everything
pnpm build

# Dev mode (hot reload)
pnpm dev

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck
```

### Turborepo Cache

Turbo caches build outputs. Second builds are instant:

```bash
# First build: ~20s
pnpm build

# Second build: <1s (cached)
pnpm build
```

Clear cache if needed:

```bash
npx turbo run build --force
```

## ❓ Questions?

1. Check indexed docs in Cursor (NestJS, tRPC, TanStack)
2. Review [Migration Plan](/Users/cdansard/.cursor/plans/next.js_to_nestjs_vite_tanstack_final.plan.md)
3. Check [MIGRATION_STATUS.md](MIGRATION_STATUS.md)

---

🎉 **Great work!** The migration foundation is complete. Now test locally before deploying to Coolify.
