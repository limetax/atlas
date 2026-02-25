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

- Use `type` over `interface` (exception: module augmentation like TanStack Router's `Register`)
- No `as` type assertions — use type guards with `is` keyword (never `as any`)
- Use `??` for null/undefined fallbacks (`value ?? 'fallback'`), `||` for boolean conditions (`if (error || !data)`)
- Discriminated string unions via `as const` arrays:
  ```typescript
  export const RESEARCH_SOURCES = ['handelsregister', 'german_law', 'law_publishers'] as const;
  export type ResearchSource = (typeof RESEARCH_SOURCES)[number];
  ```
- `SCREAMING_SNAKE_CASE` for global constants, `camelCase` for local
- Prefix booleans with `is`, `has`, `should`, `can`
- Functions use action verbs (`getUser`, `handleClick`, `validateInput`)
- Prefer arrow functions (`const fn = () => {}`) — use `function` declarations only when hoisting is needed
- Explicit return types on all exported functions (exception: JSX components — TypeScript infers these correctly)

### Backend (`apps/api`)

- Clean DDD layering per module: `domain/` → `application/` → `infrastructure/`
- Domain layer has no external dependencies (pure entities + interfaces)
- NestJS dependency injection, module-based architecture
- DTOs for input validation, Zod for tRPC procedure inputs
- Let errors bubble up — global exception handler catches them
- Try-catch is acceptable only at system boundaries (streaming, external API calls)

#### DDD Naming Conventions (Hexagonal Architecture)

Atlas backend follows Hexagonal Architecture Adapters with modern, clean naming:

**Abstract Classes (Domain Contracts):**

- **No I-prefix** — modern TypeScript convention, avoids Hungarian notation
- **Adapter pattern** (external service integration): `{Capability}Adapter`
  - Examples: `AuthAdapter`, `DatevAdapter`, `EmailAdapter`
  - Use for: External APIs, third-party services, authentication providers
  - File naming: `email.adapter.ts` (not `email-adapter.interface.ts`)
- **Repository pattern** (data persistence): `{Domain}Repository`
  - Examples: `AdvisorRepository`, `ChatRepository`, `ClientRepository`
  - Use for: CRUD operations on aggregate roots
  - File naming: `advisor.repository.ts`
- **Technical note**: All are abstract classes (required for NestJS DI, not TypeScript interfaces)

**Implementations (Infrastructure Layer):**

- Pattern: `{Technology}{Capability}{Suffix}`
- Examples:
  - `SupabaseAuthAdapter` implements `AuthAdapter`
  - `KlardatenDatevAdapter` implements `DatevAdapter`
  - `ResendEmailAdapter` implements `EmailAdapter`
  - `SupabaseAdvisorRepository` implements `AdvisorRepository`
- File naming: `resend-email.adapter.ts`, `supabase-advisor.repository.ts`

**Application Layer Services:**

- Pattern: `{Domain}Service`
- Examples: `AuthService`, `ChatService`, `EmailService`
- Services depend only on abstract classes (never concrete implementations)
- Clean injection: `constructor(private emailAdapter: EmailAdapter) {}` (no `@Inject()` needed)

**Why abstract classes over TypeScript interfaces?**

- NestJS cannot use interfaces as injection tokens (only classes, strings, symbols)
- Abstract classes provide type-safe, clean injection without string tokens
- Enables: `{ provide: EmailAdapter, useClass: ResendEmailAdapter }`

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

#### Component patterns

- **Never use `React.FC`** — use typed arrow functions: `const Foo = (props: FooProps) =>`
- **Import `{ type Boz }` from 'react'**, not the `React` default — only import the `React` namespace when needed for `React.memo`, `React.forwardRef`, `React.FormEvent`, etc.
- **Use `import type` for type-only imports** — `import type { Foo }` or `import { type Foo }`
- **Colocate types with their implementation** — define return types in hook files, prop types in component files. No standalone `types/` files unless the type is consumed by 3+ unrelated modules
- **Max 200 LOC per page component** — if a page exceeds this, extract hooks (`useXxx`) for business logic. Pages orchestrate hooks, not implement logic
- **One hook, one concern** — if a hook returns more than 8 properties, split it. Separate CRUD, streaming, and UI state into focused hooks

#### Routing & auth

- **All protected routes live under `routes/_authenticated/`** — the `_authenticated.tsx` layout route provides the shared auth guard, `<Sidebar />`, and `<AuthProvider>`. Never add `beforeLoad` auth guards to individual route files
- **Pages must not render `<Sidebar />` or app chrome** — all shared layout belongs in the `_authenticated.tsx` layout route
- **No `window.location.href` for navigation** — always use TanStack Router's `navigate()` or `redirect()`. Hard redirects bypass React state and cause data loss

#### State & data

- **No direct `localStorage` reads in components** — use `useAuthContext()` or `useLocalStorage()`. Route guards (`beforeLoad`) are the only exception since they run outside the React tree

#### Mutations & cache updates

**Default — simple invalidation.** Use for all mutations unless latency causes a visible UX problem:

```ts
useMutation({ mutationFn: ..., onError: () => toast.error(...), onSettled: () => utils.foo.invalidate() })
```

**Optimistic updates** — only reach for these when mutation latency noticeably hurts UX. Two approaches:

**Via UI** (`isPending` + `variables`) — prefer for single-component instant feedback, no rollback needed:

```ts
const mutation = useMutation({ mutationFn: ..., onSettled: () => utils.foo.invalidate() });
// Render the pending item from mutation.variables while mutation.isPending === true.
// On error it simply disappears; show a toast in onError.
```

**Via Cache** (`onMutate`) — use only when multiple components share the query and all need the instant update:

```ts
useMutation({
  onMutate: async (vars) => {
    await utils.foo.cancel(); // cancel in-flight refetch so it doesn't overwrite
    const previous = utils.foo.getData(); // snapshot for rollback
    utils.foo.setData(updater); // apply optimistic change
    return { previous };
  },
  onError: (_err, _vars, ctx) => utils.foo.setData(ctx!.previous), // rollback on failure
  onSettled: () => utils.foo.invalidate(), // always resync with server
});
```

**Rules:**

- **`onSettled` not `onSuccess` for invalidation** — `onSettled` fires on both success and error, so the cache always resyncs even after a failed mutation
- **Do not use `onMutate` for add-to-list** — `onSettled` invalidation triggers a refetch that races with the optimistic entry, causing the item to briefly appear twice; use Via UI instead
- **Cache seeding (`setData` outside mutations)** — valid when you already hold the full entity data locally and need a zero-latency transition (e.g. seeding `getDocumentsByChatId` when pending docs become linked after a new chat is created)

#### Toasts (user feedback)

- **Library:** [Sonner](https://sonner.emilkowal.ski/) via `components/ui/sonner.tsx` wrapper. `<Toaster />` is mounted in `_authenticated.tsx`
- **Import:** `import { toast } from 'sonner'` — call `toast.success()`, `toast.error()`, etc. directly
- **Mutations must show feedback:** every `useMutation` with a user-triggered action needs `onError` → `toast.error()`. Add `onSuccess` → `toast.success()` for destructive or explicit actions (delete, rename). Silent context updates can skip success toasts
- **Language:** toast messages are in German (matches UI)
- **Don't toast streaming errors** — chat streaming errors use inline assistant messages, not toasts

#### Tailwind + shadcn styling

**Critical rules:**

- ❌ **Never concatenate class names**: `className={`bg-${color}-500`}` breaks in production (Tailwind can't detect)
- ✅ **Use complete strings**: `className={isError ? 'bg-red-500' : 'bg-green-500'}` or object maps
- ✅ **Dynamic runtime values**: `style={{ "--bg": color }} className="bg-[var(--bg)]"`
- ✅ **Use `cn()` for conditionals**: `cn('base-class', isActive && 'active-class', className)`
- ✅ **Order classes logically**: layout → sizing → spacing → typography → colors → borders → effects → states

**shadcn component patterns:**

- ✅ **Extend with CVA**: add variants to `buttonVariants` (don't fork components)
- ✅ **Composition over props**: `<Card className="p-6"><CardHeader>...</CardHeader></Card>` not `<Card padding="large">`
- ✅ **Always accept `className` prop**: allow consumers to override styles (spread it last in `cn()`)

### Design System

**Architecture:** `design.json` (design decisions) → `globals.css` (CSS variables + Tailwind mappings) → components (semantic classes)

**Color styling rules:**

❌ **Never hardcode Tailwind color classes** (`bg-gray-100`, `text-slate-400`, `border-blue-200`)

✅ **Always use (in order of preference):**

1. **Semantic classes**: `bg-primary`, `text-foreground`, `border-border`, `bg-muted` (first choice)
2. **Token classes**: `bg-orange-500`, `text-gray-700` (when mapped in `globals.css @theme inline`)
3. **Arbitrary values**: `bg-[var(--chat-message-user-bg)]` (for CSS variables not in `@theme`)

✅ **Standard Tailwind utilities are OK:** `p-4`, `text-sm`, `font-bold`, `flex`, `rounded-md`, `shadow-lg` (spacing, typography, layout, effects)

**Why:** CSS variables enable theming and centralized token management. Hardcoded colors bypass the design system.

## Commits

Conventional commits with **required scope**: `type(scope): message`

- **Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scopes**: api, web, shared, auth, chat, rag, db, deps, ui, datev, tec-{number} (Linear ticket)
- Lowercase subject, no period, max 100 chars

Pre-commit hooks run lint-staged (Prettier + ESLint) and full typecheck.

## Pull Requests

Always use the PR template at [.github/pull_request_template.md](.github/pull_request_template.md) when creating pull requests. The template includes:

- **What**: Summarize code changes for easy reviewer understanding
- **Why**: Explain the reasoning (1-paragraph summary, not just ticket links)
- **Test**: Describe testing approach (unit/e2e tests, manual testing, logs, screenshots)
- **Notes**: PR-specific callouts and gotchas
- **Links**: Related Notion pages, Miro diagrams, etc.

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
