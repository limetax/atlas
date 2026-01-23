import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../infrastructure/supabase.service';
import type { User } from '@supabase/supabase-js';

/**
 * tRPC Context - Contains user auth state and request metadata
 */
export interface TRPCContext {
  user: User | null;
  requestId: string;
}

/**
 * tRPC Context Provider - Creates context for each tRPC request
 */
@Injectable()
export class TRPCContextProvider {
  private readonly logger = new Logger(TRPCContextProvider.name);

  constructor(private readonly supabase: SupabaseService) {}

  async create(req: any): Promise<TRPCContext> {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Extract JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, requestId };
    }

    const token = authHeader.replace('Bearer ', '');

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
