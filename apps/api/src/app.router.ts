import { Injectable } from '@nestjs/common';
import { router } from './trpc/trpc.service';
import { AuthRouter } from './auth/auth.router';
import { ChatRouter } from './chat/chat.router';

/**
 * Main App Router - Combines all tRPC routers
 */
@Injectable()
export class AppRouter {
  constructor(
    private readonly authRouter: AuthRouter,
    private readonly chatRouter: ChatRouter
  ) {}

  createRouter() {
    return router({
      auth: this.authRouter.createRouter(),
      chat: this.chatRouter.createRouter(),
    });
  }
}

// Export the router type for frontend
export type AppRouterType = ReturnType<AppRouter['createRouter']>;
