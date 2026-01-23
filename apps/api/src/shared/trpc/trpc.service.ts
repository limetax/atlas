import { initTRPC, TRPCError } from '@trpc/server';
import { Injectable } from '@nestjs/common';
import { TRPCContext } from './trpc.context';

/**
 * tRPC Service - Initializes tRPC and provides procedures
 */
const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Anmeldung erforderlich',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

@Injectable()
export class TRPCService {
  router = router;
  publicProcedure = publicProcedure;
  protectedProcedure = protectedProcedure;
}
