# Dependency Injection Pattern

## Why Abstract Classes Instead of Interfaces?

We use **abstract classes** instead of interfaces for our domain contracts because:

1. **Runtime Existence**: Abstract classes exist at runtime, interfaces don't
2. **Direct Injection**: Can be used directly as injection tokens (no Symbol needed)
3. **Type Safety**: Full TypeScript support with proper NestJS DI
4. **Clean Code**: No `@Inject()` decorator needed - NestJS resolves automatically

## The Pattern

### ❌ OLD WAY (Symbols - Not Recommended)

```typescript
// Domain
export interface ILlmProvider { ... }
export const LLM_PROVIDER = Symbol('ILlmProvider');

// Module
provide: LLM_PROVIDER,
useClass: AnthropicClient

// Usage
constructor(@Inject(LLM_PROVIDER) private llm: ILlmProvider) {}
```

### ✅ NEW WAY (Abstract Classes - Proper NestJS)

```typescript
// Domain
export abstract class ILlmProvider {
  abstract streamMessage(...): AsyncGenerator<string>;
  abstract getMessage(...): Promise<string>;
}

// Module
provide: ILlmProvider,
useClass: AnthropicClient

// Usage - NO @Inject() needed!
constructor(private llm: ILlmProvider) {}
```

## Benefits

1. **Cleaner Code**: No `@Inject()` decorators cluttering constructors
2. **Type Safe**: TypeScript knows the exact type
3. **NestJS Native**: Uses built-in DI container properly
4. **Testable**: Easy to mock abstract classes
5. **Refactor Safe**: Renaming works across the codebase

## Example: Full Domain Setup

### 1. Define Abstract Class (Domain Layer)

```typescript
// datev/domain/datev-adapter.interface.ts
export abstract class IDatevAdapter {
  abstract authenticate(): Promise<void>;
  abstract getClients(): Promise<DatevClient[]>;
  abstract getOrders(year: number): Promise<DatevOrder[]>;
}
```

### 2. Implement in Infrastructure

```typescript
// datev/infrastructure/klardaten-datev.adapter.ts
@Injectable()
export class KlardatenDatevAdapter extends IDatevAdapter {
  async authenticate(): Promise<void> {
    // Klardaten implementation
  }

  async getClients(): Promise<DatevClient[]> {
    // Klardaten implementation
  }

  async getOrders(year: number): Promise<DatevOrder[]> {
    // Klardaten implementation
  }
}
```

### 3. Configure Module

```typescript
// datev/datev.module.ts
@Module({
  providers: [
    KlardatenDatevAdapter,
    {
      provide: IDatevAdapter, // ← Abstract class as token
      useClass: KlardatenDatevAdapter,
    },
    DatevSyncService,
  ],
  exports: [
    IDatevAdapter, // ← Export for other modules
    DatevSyncService,
  ],
})
export class DatevModule {}
```

### 4. Use in Application Layer

```typescript
// datev/application/datev-sync.service.ts
@Injectable()
export class DatevSyncService {
  constructor(
    private readonly datevAdapter: IDatevAdapter // ← Clean injection!
  ) {}

  async sync() {
    await this.datevAdapter.authenticate();
    // Business logic
  }
}
```

## Why TRPCModule Needs InfrastructureModule

The `TRPCContextProvider` injects `SupabaseService` to validate JWT tokens:

```typescript
export class TRPCContextProvider {
  constructor(private readonly supabase: SupabaseService) {}

  async create(req: TRPCRequest): Promise<TRPCContext> {
    // Uses supabase.getUser() to validate token
  }
}
```

Therefore, `TRPCModule` must import `InfrastructureModule` to access `SupabaseService`.

## All Domain Contracts

- `ILlmProvider` - LLM operations
- `IEmbeddingsProvider` - Embedding generation
- `IAuthAdapter` - Authentication
- `IAdvisorRepository` - Advisor data access
- `IVectorStore` - Vector search
- `IDatevAdapter` - DATEV data access

All use abstract classes for proper NestJS dependency injection.
