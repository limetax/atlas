# NestJS Backend Architecture

## Domain-Driven Design with Clean Architecture

This backend follows a domain-driven design approach with clear separation between domain, infrastructure, and application layers.

## Folder Structure

```
src/
├── auth/                    # Authentication domain
│   ├── domain/              # Domain layer (abstract contracts, entities)
│   ├── infrastructure/      # Infrastructure layer (Supabase adapters)
│   ├── application/         # Application layer (business logic)
│   ├── auth.module.ts
│   └── auth.router.ts
├── llm/                     # Language Model domain
│   ├── domain/              # LLM & embeddings abstract contracts
│   ├── infrastructure/      # Anthropic provider, GTE embeddings adapter
│   ├── application/         # LLM service, text extraction service
│   └── llm.module.ts
├── rag/                     # Retrieval-Augmented Generation domain
│   ├── domain/              # Vector store abstract contract, entities
│   ├── infrastructure/      # Supabase pgvector adapter
│   ├── application/         # RAG orchestration logic
│   ├── rag.module.ts
│   └── rag.router.ts
├── chat/                    # Chat domain
│   ├── domain/              # Message entities, repository contract
│   ├── infrastructure/      # Supabase chat repository
│   ├── application/         # Chat orchestration service
│   ├── chat.module.ts
│   ├── chat.router.ts
│   └── chat.controller.ts
├── datev/                   # DATEV integration domain
│   ├── domain/              # DATEV adapter contract, entities
│   ├── infrastructure/      # Klardaten client & adapter
│   ├── application/         # DATEV sync service
│   ├── datev.module.ts
│   └── datev.router.ts
├── document/                # Document domain
│   ├── domain/              # Document entities, repository contract
│   ├── infrastructure/      # Supabase document repository
│   ├── application/         # Document processing service
│   └── document.module.ts
├── email/                   # Email domain
│   ├── domain/              # Email adapter contract
│   ├── infrastructure/      # Resend email adapter
│   ├── application/         # Email service
│   └── email.module.ts
├── shared/                  # Shared infrastructure
│   ├── infrastructure/      # Supabase service
│   └── trpc/                # tRPC configuration
├── health/                  # Health check endpoints
├── app.module.ts
├── app.router.ts
└── main.ts
```

## Layer Responsibilities

### Domain Layer (`domain/`)

**Purpose**: Define what WE expect from the outside world

- **Abstract classes**: Contracts for external systems (e.g., `DatevAdapter`, `AuthAdapter`)
- **Entities**: Domain objects representing business concepts
- **NO implementation details**
- **NO external dependencies** (except shared types)

**Example**:

```typescript
// domain/datev.adapter.ts
export abstract class DatevAdapter {
  abstract authenticate(): Promise<void>;
  abstract getClients(): Promise<DatevClient[]>;
}
```

### Infrastructure Layer (`infrastructure/`)

**Purpose**: Implement domain abstract classes with concrete technologies

- **Adapters**: Concrete implementations of domain contracts
- **Clients**: External API clients (Anthropic, Klardaten, Supabase)
- **Protocol-specific code**
- **NO business logic**

**Example**:

```typescript
// infrastructure/klardaten-datev.adapter.ts
@Injectable()
export class KlardatenDatevAdapter extends DatevAdapter {
  async authenticate(): Promise<void> {
    // Klardaten-specific implementation
  }
}
```

### Application Layer (`application/`)

**Purpose**: Orchestrate business logic and use cases

- **Services**: Business logic and orchestration
- **Depends ONLY on domain abstract classes** (via dependency injection)
- **NEVER imports from infrastructure directly**

**Example**:

```typescript
// application/datev-sync.service.ts
@Injectable()
export class DatevSyncService {
  constructor(private readonly datevAdapter: DatevAdapter) {}

  async sync() {
    await this.datevAdapter.authenticate();
    // Business logic here
  }
}
```

## Dependency Flow

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│     (Controllers, tRPC Routers)         │
└──────────────┬──────────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────────┐
│        Application Layer                │
│      (Business Logic Services)          │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│  (Abstract Classes & Domain Entities)   │
└──────────────▲──────────────────────────┘
               │ extends
               │
┌──────────────┴──────────────────────────┐
│      Infrastructure Layer               │
│  (Concrete Implementations & Clients)   │
└─────────────────────────────────────────┘
```

**Key Rule**: Dependencies flow INWARD. Infrastructure extends domain abstract classes, but domain never depends on infrastructure.

## Preventing Circular Dependencies

### DO

1. **Application services import from domain layer**:

   ```typescript
   import { DatevAdapter } from '../domain/datev.adapter';
   ```

2. **Use dependency injection with abstract classes** (no string tokens or `@Inject()` needed):

   ```typescript
   constructor(private readonly datevAdapter: DatevAdapter) {}
   ```

3. **Cross-domain communication via modules**:

   ```typescript
   @Module({
     imports: [DatevModule],  // Import the module
     // ...
   })
   ```

4. **Infrastructure extends domain abstract classes**:
   ```typescript
   export class KlardatenDatevAdapter extends DatevAdapter {
     // Implementation
   }
   ```

### DON'T

1. **Never import infrastructure directly in application**:

   ```typescript
   // BAD
   import { KlardatenDatevAdapter } from '../infrastructure/klardaten-datev.adapter';
   ```

2. **Never import from other domains directly**:

   ```typescript
   // BAD
   import { DatevSyncService } from '../../datev/application/datev-sync.service';
   ```

3. **Never put business logic in infrastructure**:
   ```typescript
   // BAD - Business logic in infrastructure
   export class KlardatenClient {
     async syncData() {
       // Complex business logic here
     }
   }
   ```

## Module Configuration Pattern

Each domain module uses abstract classes as injection tokens (no string tokens needed):

```typescript
@Module({
  imports: [InfrastructureModule, LlmModule],
  providers: [
    // Bind abstract class to concrete implementation
    {
      provide: DatevAdapter,
      useClass: KlardatenDatevAdapter,
    },
    // Application service (auto-injects DatevAdapter)
    DatevSyncService,
  ],
  exports: [
    DatevAdapter, // Export the abstract class token
    DatevSyncService, // Export the service
  ],
})
export class DatevModule {}
```

**Critical**: Always export BOTH:

1. The abstract class token (e.g., `DatevAdapter`) - so other modules can inject it
2. The application service (e.g., `DatevSyncService`) - so other modules can use it

## Naming Conventions

### Domain Contracts (Abstract Classes)

- **No I-prefix** — modern TypeScript convention
- **Adapter pattern**: `{Capability}Adapter` (e.g., `AuthAdapter`, `DatevAdapter`, `EmailAdapter`)
- **Repository pattern**: `{Domain}Repository` (e.g., `AdvisorRepository`, `ChatRepository`)
- File naming: `datev.adapter.ts`, `advisor.repository.ts`

### Infrastructure Implementations

- Pattern: `{Technology}{Capability}{Suffix}`
- Examples: `SupabaseAuthAdapter`, `KlardatenDatevAdapter`, `ResendEmailAdapter`
- File naming: `supabase-auth.adapter.ts`, `klardaten-datev.adapter.ts`

### Application Services

- Pattern: `{Domain}Service`
- Examples: `AuthService`, `ChatService`, `EmailService`
- Depend only on abstract classes (never concrete implementations)

## Benefits

1. **Type Safety**: Zero `any` types, full TypeScript inference
2. **Testability**: Easy to mock via domain abstract classes
3. **No Circular Dependencies**: Unidirectional dependency flow
4. **Swappable Implementations**: Can replace Klardaten with direct DATEV without changing application layer
5. **Clear Boundaries**: Each layer has a single responsibility
6. **Scalability**: New domains follow the same pattern
7. **Clean DI**: Abstract classes as tokens — no string tokens, no `@Inject()` decorators

## Shared Package

The `@atlas/shared` package contains:

- **Types only** (no services, no business logic)
- Database types
- DATEV types
- Shared DTOs

This ensures the shared package has no circular dependencies with the backend.
