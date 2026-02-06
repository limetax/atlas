import { Inject } from '@nestjs/common';
import { Router, Mutation, Query, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { ClientService } from '@datev/application/client.service';

const SyncInputSchema = z.object({
  orderYear: z.number().optional().default(2025),
});

/**
 * DATEV tRPC Router - Exposes DATEV sync functionality via tRPC
 */
@Router({ alias: 'datev' })
export class DatevRouter {
  constructor(
    @Inject(DatevSyncService) private readonly datevSync: DatevSyncService,
    @Inject(ClientService) private readonly clientService: ClientService
  ) {}

  /**
   * List all active clients for dropdown
   */
  @Query({
    output: z.array(
      z.object({
        clientId: z.string(),
        clientNumber: z.number(),
        clientName: z.string(),
        companyForm: z.string().nullable(),
      })
    ),
  })
  async listClients() {
    return await this.clientService.listClients();
  }

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
