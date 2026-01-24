import { Injectable } from '@nestjs/common';
import { LoginSchema } from '@atlas/shared';
import { router, publicProcedure, protectedProcedure } from '@shared/trpc/trpc.service';
import { AuthService } from '@auth/application/auth.service';

/**
 * Auth Router - tRPC procedures for authentication
 */
@Injectable()
export class AuthRouter {
  constructor(private readonly authService: AuthService) {}

  createRouter() {
    return router({
      login: publicProcedure.input(LoginSchema).mutation(async ({ input }) => {
        return this.authService.login(input.email, input.password);
      }),

      logout: protectedProcedure.mutation(async () => {
        // Supabase logout (invalidate session on backend)
        // Frontend will clear token from localStorage
        return { success: true };
      }),

      getUser: protectedProcedure.query(({ ctx }) => {
        return ctx.user;
      }),

      getAdvisor: protectedProcedure.query(async ({ ctx }) => {
        return this.authService.getAdvisorWithAdvisory(ctx.user.id);
      }),
    });
  }
}
