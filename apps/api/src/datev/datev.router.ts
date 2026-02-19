import { Inject } from '@nestjs/common';
import { Router, Mutation, Query, Input, UseMiddlewares } from 'nestjs-trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { ClientService } from '@datev/application/client.service';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';

const SyncInputSchema = z.object({
  orderYear: z.number().optional().default(2025),
});

const ClientIdInputSchema = z.object({
  clientId: z.string(),
});

/**
 * DATEV tRPC Router - Exposes DATEV client data and sync functionality via tRPC
 */
@Router({ alias: 'datev' })
export class DatevRouter {
  constructor(
    @Inject(DatevSyncService) private readonly datevSync: DatevSyncService,
    @Inject(ClientService) private readonly clientService: ClientService
  ) {}

  /**
   * List all active clients
   */
  @Query({
    output: z.array(
      z.object({
        clientId: z.string(),
        clientNumber: z.number(),
        clientName: z.string(),
        companyForm: z.string().nullable(),
        mainEmail: z.string().nullable(),
        correspondenceCity: z.string().nullable(),
      })
    ),
  })
  @UseMiddlewares(AuthMiddleware)
  async listClients() {
    return await this.clientService.listClients();
  }

  /**
   * Get full client details by ID
   */
  @Query({
    input: ClientIdInputSchema,
  })
  @UseMiddlewares(AuthMiddleware)
  async getClient(@Input('clientId') clientId: string) {
    const client = await this.clientService.getClientById(clientId);

    if (!client) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Mandant nicht gefunden' });
    }

    return client;
  }

  /**
   * Sync DATEV data (clients and orders) to Supabase
   */
  @Mutation({
    input: SyncInputSchema,
  })
  @UseMiddlewares(AuthMiddleware)
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
