import { Inject } from '@nestjs/common';
import { Router, Query, Mutation, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { z } from 'zod';
import { AuthService } from '@auth/application/auth.service';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import { RateLimitMiddleware } from '@shared/trpc/rate-limit.middleware';
import type { User } from '@supabase/supabase-js';

// Define schemas inline for nestjs-trpc to properly generate types
const LoginInputSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

const LogoutOutputSchema = z.object({
  success: z.boolean(),
});

/**
 * Auth Router - tRPC procedures for authentication
 */
@Router({ alias: 'auth' })
export class AuthRouter {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Mutation({
    input: LoginInputSchema,
  })
  @UseMiddlewares(RateLimitMiddleware)
  async login(@Input('email') email: string, @Input('password') password: string) {
    return this.authService.login(email, password);
  }

  @Mutation({
    output: LogoutOutputSchema,
  })
  @UseMiddlewares(AuthMiddleware)
  async logout(): Promise<{ success: boolean }> {
    // Supabase logout (invalidate session on backend)
    // Frontend will clear token from localStorage
    return { success: true };
  }

  @Query()
  @UseMiddlewares(AuthMiddleware)
  getUser(@Ctx() ctx: { user: User }): User {
    return ctx.user;
  }

  @Query()
  @UseMiddlewares(AuthMiddleware)
  async getAdvisor(@Ctx() ctx: { user: User }) {
    return this.authService.getAdvisorWithAdvisory(ctx.user.id);
  }
}
