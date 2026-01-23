# Application Architecture - After Refactoring

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph app [Application Entry]
        Main[main.tsx<br/>ErrorBoundary + Suspense]
    end
    
    subgraph pages [Pages Layer]
        HomePage[HomePage.tsx<br/>UI Orchestration]
    end
    
    subgraph hooks [Hooks Layer]
        useAuth[useAuth<br/>Auth State]
        useAuthToken[useAuthToken<br/>Token Mgmt]
        useLocalStorage[useLocalStorage<br/>Generic Storage]
        useChatSessions[useChatSessions<br/>Session Mgmt]
    end
    
    subgraph components [Components Layer]
        layouts[Layouts<br/>Header, Sidebar]
        features[Features<br/>Auth, Chat, Compliance]
        ui[UI Elements<br/>Button, Input, etc]
    end
    
    subgraph infrastructure [Infrastructure Layer]
        config[Config<br/>env.ts]
        constants[Constants<br/>Keys, Routes]
        utils[Utils<br/>Validators, Formatters]
        lib[Libraries<br/>tRPC, Chat API]
    end
    
    Main --> pages
    HomePage --> hooks
    HomePage --> components
    hooks --> infrastructure
    components --> infrastructure
    lib --> infrastructure
```

---

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Header
    participant useAuth
    participant tRPC
    participant API
    
    User->>Header: Load page
    Header->>useAuth: Get auth state
    useAuth->>tRPC: getUser.useQuery()
    tRPC->>API: Fetch user
    API-->>tRPC: User data
    tRPC-->>useAuth: User data
    useAuth->>tRPC: getAdvisor.useQuery()
    Note over useAuth,tRPC: Only if user exists
    tRPC->>API: Fetch advisor
    API-->>tRPC: Advisor data
    tRPC-->>useAuth: Advisor data
    useAuth-->>Header: {user, advisor, isLoading}
    Header-->>User: Render UI
```

---

## 📦 Dependency Hierarchy

```mermaid
graph LR
    subgraph level1 [Level 1: Foundation]
        Config[config/env.ts]
        Constants[constants/]
    end
    
    subgraph level2 [Level 2: Utilities]
        Utils[utils/<br/>validators, formatters, logger]
    end
    
    subgraph level3 [Level 3: Infrastructure]
        Lib[lib/<br/>trpc, chat-api]
        UI[components/ui/]
    end
    
    subgraph level4 [Level 4: Hooks]
        Hooks[hooks/<br/>useAuth, useAuthToken, etc]
    end
    
    subgraph level5 [Level 5: Features]
        Features[components/features/]
        Layouts[components/layouts/]
    end
    
    subgraph level6 [Level 6: Pages]
        Pages[pages/<br/>HomePage]
    end
    
    Config --> Utils
    Constants --> Utils
    Utils --> Lib
    Utils --> UI
    Constants --> Lib
    Config --> Lib
    Lib --> Hooks
    UI --> Features
    UI --> Layouts
    Hooks --> Features
    Hooks --> Layouts
    Features --> Pages
    Layouts --> Pages
    Hooks --> Pages
```

---

## 🎨 Component Organization Philosophy

### UI Components (Generic)
**Location:** `components/ui/`  
**Purpose:** Basic, reusable UI elements  
**Examples:** Button, Input, Badge, Avatar  
**Rules:** No business logic, pure presentation

### Feature Components (Domain-Specific)
**Location:** `components/features/{feature}/`  
**Purpose:** Feature-specific logic and UI  
**Examples:** LoginForm, ChatMessage, UserMenu  
**Rules:** Can use hooks, utils, and ui components

### Layout Components (Structure)
**Location:** `components/layouts/`  
**Purpose:** Application structure and layout  
**Examples:** Header, Sidebar, Footer  
**Rules:** Compose features and ui components

---

## 🔐 Authentication Flow

```mermaid
flowchart TD
    Start[User visits app] --> CheckToken{Token exists?}
    CheckToken -->|No| RedirectLogin[Redirect to /login]
    CheckToken -->|Yes| ValidateToken{Token valid?}
    ValidateToken -->|Expired| ClearToken[Clear token]
    ClearToken --> RedirectLogin
    ValidateToken -->|Valid| LoadApp[Load HomePage]
    LoadApp --> UseAuth[useAuth hook]
    UseAuth --> FetchUser[Fetch user data]
    FetchUser --> FetchAdvisor[Fetch advisor data]
    FetchAdvisor --> RenderUI[Render authenticated UI]
    
    RedirectLogin --> ShowLogin[Show LoginForm]
    ShowLogin --> Login[User logs in]
    Login --> SaveToken[useAuthToken.setToken]
    SaveToken --> LoadApp
```

---

## 💾 State Management Strategy

### Local State
- Component-specific state (useState)
- Form inputs
- UI toggles (menu open/closed)

### Derived State (Hooks)
- `useAuth` - Auth state from tRPC
- `useChatSessions` - Session state from localStorage

### Server State (tRPC)
- User data
- Advisor data
- Chat responses

### Persistent State (localStorage)
- Auth token (via useAuthToken)
- Chat sessions (via useLocalStorage)

---

## 🔧 Configuration Strategy

### Environment Variables
```typescript
// config/env.ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
```

### Runtime Constants
```typescript
// constants/index.ts
export const STORAGE_KEYS = { /* ... */ } as const;
export const ROUTES = { /* ... */ } as const;
export const API_ENDPOINTS = { /* ... */ } as const;
export const APP_CONFIG = { /* ... */ } as const;
```

---

## 🧪 Testing Strategy (Future)

### Unit Tests
- **Hooks:** `useAuth`, `useAuthToken`, `useLocalStorage`, `useChatSessions`
- **Utils:** `validators`, `formatters`, `logger`
- **Components:** UI components (Button, Input, etc.)

### Integration Tests
- **Features:** LoginForm, ChatInterface, UserMenu
- **Layouts:** Header, Sidebar

### E2E Tests
- **User Flows:** Login → Chat → Logout
- **Error Cases:** Network errors, token expiration

---

## 📊 Performance Considerations

### Current State
- Build size: 565 KB (can be optimized)
- Dev server: Fast HMR
- Type checking: Fast (<2s)

### Future Optimizations
1. Manual chunk splitting (vendor, features)
2. Route-based code splitting
3. Image optimization
4. Bundle analysis

---

## 🎯 Scalability

### Easy to Add New Features
```
components/features/invoices/     ← New feature
  ├── InvoiceList.tsx
  ├── InvoiceDetail.tsx
  └── useInvoiceData.ts           ← Colocated hook

hooks/
  └── useInvoiceSync.ts           ← If reusable across features
```

### Easy to Add New Utilities
```
utils/
  ├── currency.ts                 ← New utility
  └── index.ts                    ← Update barrel export
```

### Easy to Add New Routes
```
routes/
  └── invoices.tsx                ← New route with guard
```

---

## 🔍 Code Review Checklist

When adding new code, check:
- [ ] Using `@/` path aliases?
- [ ] No magic strings? (use constants)
- [ ] No direct localStorage? (use hooks)
- [ ] No `console.log`? (use logger)
- [ ] Proper TypeScript types? (no `any`)
- [ ] Component in right folder? (ui/features/layouts)
- [ ] Hook reusable? (src/hooks/) or specific? (colocated)
- [ ] Error handling? (try/catch + logger)

---

**Status:** Production Ready  
**Maintainability:** High  
**Scalability:** High  
**Code Quality:** Professional
