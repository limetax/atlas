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
    return await this.datevSync.sync(orderYear);
  }
}
