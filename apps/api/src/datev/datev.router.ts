import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { TRPCService } from '@shared/trpc/trpc.service';

/**
 * DATEV tRPC Router - Exposes DATEV sync functionality via tRPC
 */
@Injectable()
export class DatevRouter {
  constructor(
    private readonly trpc: TRPCService,
    private readonly datevSync: DatevSyncService
  ) {}

  getRouter() {
    const { router, publicProcedure } = this.trpc;

    return router({
      /**
       * Sync DATEV data (clients and orders) to Supabase
       */
      sync: publicProcedure
        .input(
          z.object({
            orderYear: z.number().optional().default(2025),
          })
        )
        .mutation(async ({ input }: { input: { orderYear: number } }) => {
          return await this.datevSync.sync(input.orderYear);
        }),
    });
  }
}
