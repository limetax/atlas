import { Injectable } from '@nestjs/common';
import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';

// Type the context from AppContext
interface AppContextType {
  user: User | null;
  requestId: string;
  req: Request;
}

/**
 * Auth Middleware for protected procedures
 * Ensures user is authenticated before allowing access
 * Generates AuthMiddlewareContext type with non-null user
 */
@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<AppContextType>) {
    const { ctx } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Anmeldung erforderlich',
      });
    }

    // Type-narrow: user is now guaranteed to be non-null
    const authenticatedUser: User = ctx.user;

    // Pass the authenticated user to the next middleware/procedure
    return opts.next({
      ctx: {
        ...ctx,
        user: authenticatedUser,
        // Mark as authenticated for type generation
        isAuthenticated: true as const,
      },
    });
  }
}
