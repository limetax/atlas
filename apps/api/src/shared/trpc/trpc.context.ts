import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../infrastructure/supabase.service';
import type { User } from '@supabase/supabase-js';

/**
 * HTTP Request interface for tRPC
 */
export interface TRPCRequest {
  headers: {
    authorization?: string | string[];
    'x-request-id'?: string | string[];
    [key: string]: string | string[] | undefined;
  };
}

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

  async create(req: TRPCRequest): Promise<TRPCContext> {
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
