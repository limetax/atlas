# Atlas

Turborepo monorepo with pnpm workspaces. Tax advisory platform with AI-powered chat (RAG), DATEV integration, and compliance tooling.

## Tech Stack

| Layer        | Technology                                                 |
| ------------ | ---------------------------------------------------------- |
| Monorepo     | Turborepo + pnpm workspaces                                |
| Backend      | NestJS 11, tRPC, Zod                                       |
| Frontend     | React 19, Vite, TanStack Router + Query                    |
| UI           | Shadcn/ui (Radix primitives), Tailwind CSS 4, Lucide icons |
| Database     | Supabase (PostgreSQL + pgvector)                           |
| AI           | LangChain + Anthropic, MCP SDK                             |
| Language     | TypeScript 5.7 (strict)                                    |
| Code Quality | ESLint 9 (flat config), Prettier, Husky + lint-staged      |

## Structure

```
apps/
  api/          NestJS backend — DDD architecture, tRPC routers
  web/          React frontend — Vite, TanStack Router, Tailwind
packages/
  shared/       Shared types and Zod schemas
  eslint-config/  Shared ESLint configs (base, nest, react)
database/       SQL migrations (numbered: 001_, 002_, ...)
supabase-project/  Supabase Docker setup
```

### Path Aliases

- `@/*` → `src/*` in both apps
- API has domain aliases: `@auth/*`, `@llm/*`, `@rag/*`, `@chat/*`, `@datev/*`, `@shared/*`

## Commands

```bash
pnpm dev          # Start all apps (web :5173, api :3001)
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm typecheck    # Type-check all packages
pnpm test         # Run tests
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
```

Vite proxies `/api` → `http://localhost:3001` in dev.

## Coding Standards

> The codebase has vibecoded sections that don't yet follow all rules below.
> New code must follow these standards. Refactor existing code when you touch it.

### TypeScript (all files)

- Use `type` over `interface` (existing code has many `interface` — migrate when touching those files)
- No `as` type assertions — use type guards with `is` keyword (never `as any`)
- Use `??` instead of `||` for defaults
- Discriminated string unions via `as const` arrays:
  ```typescript
  export const RESEARCH_SOURCES = ['handelsregister', 'german_law', 'law_publishers'] as const;
  export type ResearchSource = (typeof RESEARCH_SOURCES)[number];
  ```
- `SCREAMING_SNAKE_CASE` for global constants, `camelCase` for local
- Prefix booleans with `is`, `has`, `should`, `can`
- Functions use action verbs (`getUser`, `handleClick`, `validateInput`)
- Explicit return types on all exported functions

### Backend (`apps/api`)

- Clean DDD layering per module: `domain/` → `application/` → `infrastructure/`
- Domain layer has no external dependencies (pure entities + interfaces)
- NestJS dependency injection, module-based architecture
- DTOs for input validation, Zod for tRPC procedure inputs
- Let errors bubble up — global exception handler catches them
- Try-catch is acceptable only at system boundaries (streaming, external API calls)
- Modules: auth, chat, llm, rag, datev, assistant, shared, health

### Frontend (`apps/web`)

- Atomic Design: break UI into small, reusable components for readability
- Component organization: `ui/` → `features/` → `layouts/` → `pages/`
- If a sub-component is not reused elsewhere, keep it in the same file as the parent component, defined at the bottom
- Functional components with hooks, composition over prop drilling
- TanStack Query for data fetching with array query keys
- TanStack Router for file-based routing (auto-generated route tree)
- Shadcn/ui components in `components/ui/` — extend, don't fork
- Tailwind utility classes for styling
- Error boundaries for error handling

## Commits

Conventional commits with **required scope**: `type(scope): message`

- **Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scopes**: api, web, shared, auth, chat, rag, db, deps, ui, datev, tec-{number} (Linear ticket)
- Lowercase subject, no period, max 100 chars

Pre-commit hooks run lint-staged (Prettier + ESLint) and full typecheck.

## Worktrees

When working in a git worktree, `.env` files are not shared from the main repository. At the start of a worktree session, copy env files:

```bash
cp /Users/cdansard/university/atlas/apps/api/.env apps/api/.env
```

## Guidelines

- Do not create documentation files unless explicitly asked
- Do not update Linear issues unless explicitly asked
- Use established packages (like TanStack, NestJS, tRPC, Zod, Radix, Lucide) or suggest widely adapted packages if applicable
- Check official docs before implementing features
- Keep package dependencies explicit, use `workspace:*` for internal deps
- Node >=20, pnpm 9.15.0

### Prettier

Single quotes, semicolons, trailing commas (es5), 100 char print width, 2-space indent, LF line endings.
