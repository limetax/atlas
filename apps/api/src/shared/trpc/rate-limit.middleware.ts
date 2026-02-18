import { Injectable, Logger } from '@nestjs/common';
import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { TRPCError } from '@trpc/server';
import type { Request } from 'express';

// Type the context from AppContext
interface AppContextType {
  user: unknown;
  requestId: string;
  req: Request;
}

// Simple in-memory rate limit tracker
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate limiting middleware for tRPC procedures
 * Uses in-memory storage to limit requests by IP address
 *
 * Default: 10 requests per 15 minutes per IP
 *
 * Follows CLAUDE.md standards:
 * - Let errors bubble up (TRPCError)
 * - German error messages (matches UI)
 * - Type safety with no `as any`
 */
@Injectable()
export class RateLimitMiddleware implements TRPCMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly storage = new Map<string, RateLimitRecord>();
  private readonly ttl = 900000; // 15 minutes in milliseconds
  private readonly limit = 10; // 10 requests per 15 minutes

  async use(opts: MiddlewareOptions<AppContextType>): Promise<unknown> {
    const { ctx } = opts;

    if (!ctx.req) {
      // If request is not available, we can't rate limit by IP
      // This should not happen in normal operation (defensive programming)
      this.logger.warn('Express request not available in context');
      return opts.next();
    }

    // Get IP address from Express request
    const ip = ctx.req.ip ?? ctx.req.socket.remoteAddress ?? 'unknown';
    const key = `auth.login:${ip}`;
    const now = Date.now();

    // Get or create rate limit record
    let record = this.storage.get(key);

    // If record doesn't exist or has expired, create new one
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.ttl,
      };
      this.storage.set(key, record);
    }

    // Increment request count
    record.count += 1;

    // Check if limit exceeded
    if (record.count > this.limit) {
      const timeToReset = Math.max(0, record.resetTime - now);
      this.logger.warn(`Rate limit exceeded for IP ${ip}: ${record.count} attempts`);

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Zu viele Anmeldeversuche. Bitte versuchen Sie es in ${Math.ceil(timeToReset / 1000)} Sekunden erneut.`,
      });
    }

    this.logger.debug(`Rate limit for IP ${ip}: ${record.count}/${this.limit}`);

    return opts.next();
  }

  // Cleanup expired records periodically to prevent memory leaks
  private cleanupExpiredRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      if (now > record.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  // Run cleanup every 5 minutes
  constructor() {
    setInterval(() => this.cleanupExpiredRecords(), 300000);
  }
}
