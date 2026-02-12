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
- Prefer arrow functions (`const fn = () => {}`) — use `function` declarations only when hoisting is needed
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

### Design System

`design.json` in repo root is the source of truth for all design tokens — colors, typography, spacing, components, and layouts. Consult it when building or modifying UI components. Key decisions:

- **Theme via CSS variables** — customize in `globals.css` `:root`, not by hardcoding Tailwind color classes in components
- **Primary:** `#FF5E00` (orange). **Neutrals:** cold gray (Tailwind gray scale). No warm tinting, no lime/green accent
- **Fonts:** Manrope (display), Inter (body), Geist Mono (code)
- **Only custom tokens defined** — standard Tailwind defaults (spacing scale, font sizes, weights, breakpoints) are inherited, not redeclared
- **Semantic token references** — components use palette keys (e.g., `primary.orange.500`, `neutral.gray.200`), not raw hex
- **Dark mode is deprioritized** — cold dark values defined for future use
- Related Linear issue: TEC-69

**CRITICAL: Never hardcode Tailwind color classes** (e.g., `bg-gray-100`, `text-slate-400`, `border-blue-200`). Always use:

1. **Semantic CSS variables** via Tailwind arbitrary values: `bg-[var(--chat-message-user-bg)]`, `text-[var(--muted-foreground)]`
2. **Shadcn semantic classes** when available: `bg-card`, `text-foreground`, `border-border`
3. **Design token classes** if explicitly mapped in `globals.css`: `bg-orange-500` (only when defined in `@theme inline`)

**Exception:** Standard Tailwind utilities for spacing (`p-4`, `mx-auto`), typography (`text-sm`, `font-bold`), layout (`flex`, `grid`), and other non-color properties are OK.

**Why:** Hardcoded colors break theming, make maintenance difficult, and bypass the design system. CSS variables enable consistent theming, dark mode support, and centralized design token management.

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
- Check official docs before implementing features — use Context7 MCP to fetch up-to-date library documentation when available
- Keep package dependencies explicit, use `workspace:*` for internal deps
- Node >=20, pnpm 9.15.0

### Prettier

Single quotes, semicolons, trailing commas (es5), 100 char print width, 2-space indent, LF line endings.
