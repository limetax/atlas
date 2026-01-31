import { Inject } from '@nestjs/common';
import { Router, Mutation, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { DatevSyncService } from '@datev/application/datev-sync.service';

const SyncInputSchema = z.object({
  orderYear: z.number().optional().default(2025),
});

/**
 * DATEV tRPC Router - Exposes DATEV sync functionality via tRPC
 */
@Router({ alias: 'datev' })
export class DatevRouter {
  constructor(@Inject(DatevSyncService) private readonly datevSync: DatevSyncService) {}

  /**
   * Sync DATEV data (clients and orders) to Supabase
   */
  @Mutation({
    input: SyncInputSchema,
  })
  async sync(@Input('orderYear') orderYear: number) {
    // Run sync in background to prevent blocking the API server
    // Embedding generation is CPU-intensive and would block all requests
    setImmediate(() => {
      this.datevSync.sync(orderYear).catch((err) => {
        console.error('Background DATEV sync failed:', err);
      });
    });

    return {
      success: true,
      message: `DATEV sync started in background for fiscal year ${orderYear}`,
      fiscalYear: orderYear,
    };
  }
}
