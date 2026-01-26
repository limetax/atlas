import { Injectable, Logger, Inject } from '@nestjs/common';
import { TRPCContext, ContextOptions } from 'nestjs-trpc';
import { SupabaseService } from '../infrastructure/supabase.service';
import type { User } from '@supabase/supabase-js';

/**
 * App Context for nestjs-trpc
 * Creates context for each tRPC request with user auth state
 */
@Injectable()
export class AppContext implements TRPCContext {
  private readonly logger = new Logger(AppContext.name);

  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async create(opts: ContextOptions): Promise<{ user: User | null; requestId: string }> {
    const req = opts.req;

    // Get request ID from header or generate new one
    const requestIdHeader = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader) ||
      crypto.randomUUID();

    // Extract JWT from Authorization header
    const authHeader = req.headers.authorization;
    const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (!authValue?.startsWith('Bearer ')) {
      return { user: null, requestId };
    }

    const token = authValue.replace('Bearer ', '');

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.getUser(token);
      if (error) throw error;

      this.logger.debug(`[${requestId}] Authenticated user: ${user?.email}`);
      return { user, requestId };
    } catch (error) {
      this.logger.warn(`[${requestId}] Token validation failed:`, error);
      return { user: null, requestId };
    }
  }
}
