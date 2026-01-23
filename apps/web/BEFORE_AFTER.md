# Before & After Comparison

## 🔴 BEFORE: Header.tsx (Ugly Code)

```typescript
export const Header = () => {
  // ❌ Ugly: Direct tRPC queries in component
  const { data: user, isLoading: userLoading } = trpc.auth.getUser.useQuery();
  const { data: advisor } = trpc.auth.getAdvisor.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <header>
      {/* ... */}
      {!userLoading && user && <UserMenu user={user} advisor={advisor} />}
    </header>
  );
};
```

### Problems:
- ❌ Component knows about tRPC implementation details
- ❌ Not reusable (logic duplicated elsewhere)
- ❌ Hard to test
- ❌ Violates Single Responsibility Principle

---

## 🟢 AFTER: Header.tsx (Clean Code)

```typescript
export const Header = () => {
  // ✅ Clean: One-liner using custom hook
  const { user, advisor, isLoading } = useAuth();

  return (
    <header>
      {/* ... */}
      {!isLoading && user && <UserMenu user={user} advisor={advisor} />}
    </header>
  );
};
```

### Benefits:
- ✅ Clean and readable
- ✅ Reusable auth logic
- ✅ Easy to test (mock useAuth)
- ✅ Follows Single Responsibility Principle

---

## 🔴 BEFORE: HomePage.tsx (212 Lines)

```typescript
export const HomePage = () => {
  // ❌ Too much state management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ❌ Manual localStorage management
  useEffect(() => {
    const savedSessions = localStorage.getItem('limetax-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      // ... more logic
    }
  }, []);

  // ❌ More localStorage saving
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('limetax-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // ❌ Verbose CRUD operations (50+ lines)
  const handleNewChat = () => { /* ... */ };
  const handleSessionSelect = (sessionId: string) => { /* ... */ };
  const handleDeleteSession = (sessionId: string) => { /* ... */ };

  // ❌ Message streaming logic (100+ lines)
  const handleSendMessage = async (content: string) => { /* ... */ };

  return (/* JSX */);
};
```

---

## 🟢 AFTER: HomePage.tsx (~100 Lines)

```typescript
export const HomePage = () => {
  // ✅ Clean: All session logic extracted
  const {
    sessions,
    currentSessionId,
    messages,
    handleNewChat,
    handleSessionSelect,
    handleDeleteSession,
    updateCurrentSessionMessages,
    updateSessionTitle,
  } = useChatSessions();
  
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Focused: Only message streaming logic here
  const handleSendMessage = async (content: string) => {
    const userMessage = { /* ... */ };
    updateCurrentSessionMessages([...messages, userMessage]);
    
    if (currentSessionId && messages.length === 0) {
      updateSessionTitle(currentSessionId, truncateText(content, 50));
    }

    setIsLoading(true);
    try {
      // ... streaming logic ...
    } catch (error) {
      logger.error('Error sending message:', error);
      // ... error handling ...
    }
  };

  return (/* JSX */);
};
```

### Benefits:
- ✅ Reduced from 212 to ~100 lines
- ✅ Focused on UI and streaming
- ✅ Session logic encapsulated
- ✅ Uses utilities (logger, truncateText)
- ✅ Much easier to read and maintain

---

## 🔴 BEFORE: Scattered Magic Strings

```typescript
// In 5 different files:
localStorage.getItem('supabase_token');
localStorage.setItem('supabase_token', token);
localStorage.removeItem('supabase_token');

// In HomePage.tsx:
localStorage.getItem('limetax-sessions');

// In trpc.ts:
url: 'http://localhost:3001' + '/api/trpc'

// In routes:
throw redirect({ to: '/login' });
```

### Problems:
- ❌ Typo risks ('supabase_tokenn')
- ❌ Hard to refactor
- ❌ No single source of truth

---

## 🟢 AFTER: Centralized Constants

```typescript
// constants/index.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'supabase_token',
  CHAT_SESSIONS: 'limetax-sessions',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
} as const;

export const API_ENDPOINTS = {
  CHAT_STREAM: '/api/chat/stream',
  TRPC: '/api/trpc',
} as const;

// Usage everywhere:
localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);  // ✅ Type-safe
navigate({ to: ROUTES.LOGIN });                  // ✅ Autocomplete
url: env.apiUrl + API_ENDPOINTS.TRPC;           // ✅ Centralized
```

### Benefits:
- ✅ No typo risks (TypeScript catches errors)
- ✅ Easy refactoring (change in one place)
- ✅ Autocomplete support
- ✅ Type-safe constants

---

## 🔴 BEFORE: No Error Handling

```typescript
// If any component crashes → White screen of death
// No error boundaries
// No fallback UI
```

---

## 🟢 AFTER: Production-Ready Error Handling

```typescript
// main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>

// ErrorBoundary catches errors and shows:
// - User-friendly error message
// - Reload button
// - Error details (collapsible)
// - Logs to console (dev) / reporting service (prod)
```

---

## 📊 Code Quality Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Header.tsx lines | 38 | 38 | Quality ⬆️ |
| HomePage.tsx lines | 212 | ~100 | -53% 🎉 |
| Magic strings | 10+ | 0 | -100% 🎉 |
| `any` types | 5 | 0 | -100% 🎉 |
| Error boundaries | 0 | 1 | +∞ 🎉 |
| Custom hooks | 0 | 4 | +∞ 🎉 |
| Utils functions | 0 | 6 | +∞ 🎉 |
| Path aliases used | 0% | 100% | +100% 🎉 |
| TypeScript errors | 0 | 0 | ✅ |
| ESLint errors | 0 | 0 | ✅ |

---

## 🎓 Best Practices Applied

### From Medium Article "Cleaning Codes"
✅ SOLID Principles (SRP, OCP, DIP)  
✅ Custom hooks for reusable logic  
✅ Error boundaries for resilience  
✅ Environment-specific configuration  
✅ Modular component structure  
✅ Separation of concerns

### From 2026 React/Vite Standards
✅ Type-safe TypeScript (no `any`)  
✅ Path aliases for clean imports  
✅ Suspense boundaries  
✅ Loading states & skeletons  
✅ Centralized constants  
✅ Professional directory structure

---

## 🚀 Developer Experience

### Before
- 😕 Hard to find components (weird nesting)
- 😕 Import spaghetti (`../../../`)
- 😕 Copy-paste code everywhere
- 😕 No error handling
- 😕 Magic strings everywhere

### After
- 😊 Clear folder structure
- 😊 Clean imports (`@/`)
- 😊 DRY principle (Don't Repeat Yourself)
- 😊 Production-ready error handling
- 😊 Type-safe constants

---

**Result:** Professional, maintainable, scalable Vite codebase! 🎉
