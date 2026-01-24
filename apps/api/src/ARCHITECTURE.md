# NestJS Backend Architecture

## Domain-Driven Design with Clean Architecture

This backend follows a domain-driven design approach with clear separation between domain, infrastructure, and application layers.

## Folder Structure

```
src/
├── auth/                    # Authentication domain
│   ├── domain/              # Domain layer (interfaces, entities)
│   ├── infrastructure/      # Infrastructure layer (Supabase adapters)
│   ├── application/         # Application layer (business logic)
│   ├── auth.module.ts
│   └── auth.router.ts
├── llm/                     # Language Model domain
│   ├── domain/              # LLM & embeddings interfaces
│   ├── infrastructure/      # Anthropic client implementation
│   ├── application/         # LLM service with business logic
│   └── llm.module.ts
├── rag/                     # Retrieval-Augmented Generation domain
│   ├── domain/              # Vector store interfaces, entities
│   ├── infrastructure/      # Supabase pgvector adapter
│   ├── application/         # RAG orchestration logic
│   ├── rag.module.ts
│   └── rag.router.ts
├── chat/                    # Chat domain
│   ├── domain/              # Message entities
│   ├── application/         # Chat orchestration service
│   ├── chat.module.ts
│   ├── chat.router.ts
│   └── chat.controller.ts
├── datev/                   # DATEV integration domain
│   ├── domain/              # DATEV adapter interface, entities
│   ├── infrastructure/      # Klardaten client & adapter
│   ├── application/         # DATEV sync service
│   ├── datev.module.ts
│   └── datev.router.ts
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

- **Interfaces**: Contracts for external systems (e.g., `IDatevAdapter`, `ILlmProvider`)
- **Entities**: Domain objects representing business concepts
- **NO implementation details**
- **NO external dependencies** (except shared types)

**Example**:

```typescript
// domain/datev-adapter.interface.ts
export interface IDatevAdapter {
  authenticate(): Promise<void>;
  getClients(): Promise<DatevClient[]>;
}
```

### Infrastructure Layer (`infrastructure/`)

**Purpose**: Implement domain interfaces with concrete technologies

- **Adapters**: Concrete implementations of domain interfaces
- **Clients**: External API clients (Anthropic, Klardaten, Supabase)
- **Protocol-specific code**
- **NO business logic**

**Example**:

```typescript
// infrastructure/klardaten-datev.adapter.ts
@Injectable()
export class KlardatenDatevAdapter implements IDatevAdapter {
  async authenticate(): Promise<void> {
    // Klardaten-specific implementation
  }
}
```

### Application Layer (`application/`)

**Purpose**: Orchestrate business logic and use cases

- **Services**: Business logic and orchestration
- **Depends ONLY on domain interfaces** (via dependency injection)
- **NEVER imports from infrastructure directly**

**Example**:

```typescript
// application/datev-sync.service.ts
@Injectable()
export class DatevSyncService {
  constructor(@Inject('IDatevAdapter') private adapter: IDatevAdapter) {}

  async sync() {
    await this.adapter.authenticate();
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
│   (Interfaces & Domain Entities)        │
└──────────────▲──────────────────────────┘
               │ implements
               │
┌──────────────┴──────────────────────────┐
│      Infrastructure Layer               │
│  (Concrete Implementations & Clients)   │
└─────────────────────────────────────────┘
```

**Key Rule**: Dependencies flow INWARD. Infrastructure implements domain interfaces, but domain never depends on infrastructure.

## Preventing Circular Dependencies

### ✅ DO

1. **Application services import from domain layer**:

   ```typescript
   import { IDatevAdapter } from '../domain/datev-adapter.interface';
   ```

2. **Use dependency injection with interfaces**:

   ```typescript
   constructor(@Inject('IDatevAdapter') private adapter: IDatevAdapter) {}
   ```

3. **Cross-domain communication via modules**:

   ```typescript
   @Module({
     imports: [DatevModule],  // Import the module
     // ...
   })
   ```

4. **Infrastructure implements domain interfaces**:
   ```typescript
   export class KlardatenDatevAdapter implements IDatevAdapter {
     // Implementation
   }
   ```

### ❌ DON'T

1. **Never import infrastructure directly in application**:

   ```typescript
   // ❌ BAD
   import { KlardatenDatevAdapter } from '../infrastructure/klardaten-datev.adapter';
   ```

2. **Never import from other domains directly**:

   ```typescript
   // ❌ BAD
   import { DatevSyncService } from '../../datev/application/datev-sync.service';
   ```

3. **Never put business logic in infrastructure**:
   ```typescript
   // ❌ BAD - Business logic in infrastructure
   export class KlardatenClient {
     async syncData() {
       // Complex business logic here
     }
   }
   ```

## Module Configuration Pattern

Each domain module uses the provider pattern to inject interfaces:

```typescript
@Module({
  imports: [InfrastructureModule, LlmModule],
  providers: [
    // Infrastructure implementation
    KlardatenDatevAdapter,
    // Domain interface provider
    {
      provide: 'IDatevAdapter',
      useClass: KlardatenDatevAdapter,
    },
    // Application service
    DatevSyncService,
  ],
  exports: [
    'IDatevAdapter', // ← IMPORTANT: Export the token!
    DatevSyncService, // ← Export the service
  ],
})
export class DatevModule {}
```

**Critical**: Always export BOTH:

1. The provider token (e.g., `'IDatevAdapter'`) - so other modules can inject it
2. The application service (e.g., `DatevSyncService`) - so other modules can use it

## Benefits

1. **Type Safety**: Zero `any` types, full TypeScript inference
2. **Testability**: Easy to mock via domain interfaces
3. **No Circular Dependencies**: Unidirectional dependency flow
4. **Swappable Implementations**: Can replace Klardaten with direct DATEV without changing application layer
5. **Clear Boundaries**: Each layer has a single responsibility
6. **Scalability**: New domains follow the same pattern

## Future: Prisma Integration

When Prisma is added, it will follow the same pattern:

```
auth/
├── domain/
│   └── advisor.repository.interface.ts  ← Repository interface
├── infrastructure/
│   └── prisma-advisor.repository.ts     ← Prisma implementation
└── application/
    └── auth.service.ts                  ← Depends on interface
```

## Shared Package

The `@atlas/shared` package contains:

- **Types only** (no services, no business logic)
- Database types
- DATEV types
- Shared DTOs

This ensures the shared package has no circular dependencies with the backend.
