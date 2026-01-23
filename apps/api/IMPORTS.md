# Import Path Aliases

We've configured TypeScript path aliases to make imports cleaner and more maintainable, similar to the Vite app setup.

## Configured Aliases

```json
{
  "@/*": ["src/*"],
  "@auth/*": ["src/auth/*"],
  "@llm/*": ["src/llm/*"],
  "@rag/*": ["src/rag/*"],
  "@chat/*": ["src/chat/*"],
  "@datev/*": ["src/datev/*"],
  "@shared/*": ["src/shared/*"]
}
```

## Usage Examples

### ✅ Clean Imports (Using Aliases)

```typescript
// Instead of: import { AuthService } from '../../auth/application/auth.service';
import { AuthService } from '@auth/application/auth.service';

// Instead of: import { ILlmProvider } from '../../../llm/domain/llm-provider.interface';
import { ILlmProvider } from '@llm/domain/llm-provider.interface';

// Instead of: import { SupabaseService } from '../../shared/infrastructure/supabase.service';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

// Instead of: import { TRPCService } from '../../../shared/trpc/trpc.service';
import { TRPCService } from '@shared/trpc/trpc.service';
```

### Domain-Specific Imports

```typescript
// Auth domain
import { IAuthAdapter } from '@auth/domain/auth-adapter.interface';
import { Advisor } from '@auth/domain/advisor.entity';
import { SupabaseAuthAdapter } from '@auth/infrastructure/supabase-auth.adapter';
import { AuthService } from '@auth/application/auth.service';

// LLM domain
import { ILlmProvider } from '@llm/domain/llm-provider.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';
import { AnthropicClient } from '@llm/infrastructure/anthropic.client';
import { LlmService } from '@llm/application/llm.service';

// RAG domain
import { IVectorStore } from '@rag/domain/vector-store.interface';
import { Citation } from '@rag/domain/citation.entity';
import { SupabaseVectorAdapter } from '@rag/infrastructure/supabase-vector.adapter';
import { RAGService } from '@rag/application/rag.service';

// Chat domain
import { Message } from '@chat/domain/message.entity';
import { ChatService } from '@chat/application/chat.service';

// DATEV domain
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
import { DatevSyncService } from '@datev/application/datev-sync.service';

// Shared
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { TRPCService } from '@shared/trpc/trpc.service';
import { TRPCContextProvider } from '@shared/trpc/trpc.context';
```

## Benefits

1. **Cleaner Code**: No more `../../..` relative paths
2. **Refactor-Safe**: Moving files doesn't break imports
3. **Domain Clarity**: Immediately see which domain you're importing from
4. **IDE Support**: Better autocomplete and navigation
5. **Consistent**: Matches the pattern used in the Vite web app

## Import Rules

### ✅ DO

- Use domain aliases for cross-domain imports: `@auth/*`, `@llm/*`, etc.
- Use `@shared/*` for shared infrastructure
- Import from domain layer when depending on interfaces
- Import from application layer when using services

### ❌ DON'T

- Don't use relative paths for cross-domain imports
- Don't import infrastructure directly in application layer
- Don't import from other domains' infrastructure
- Don't import application services directly - use dependency injection

## Example: Proper Import Pattern

```typescript
// ✅ CORRECT: Application service importing domain interface
import { Injectable, Inject } from '@nestjs/common';
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';

@Injectable()
export class DatevSyncService {
  constructor(
    @Inject('IDatevAdapter') private adapter: IDatevAdapter,
    @Inject('IEmbeddingsProvider') private embeddings: IEmbeddingsProvider
  ) {}
}

// ❌ WRONG: Application importing infrastructure directly
import { KlardatenDatevAdapter } from '@datev/infrastructure/klardaten-datev.adapter';
// Never do this!
```
