import { Injectable } from '@nestjs/common';
import { router } from '@shared/trpc/trpc.service';
import { AuthRouter } from '@auth/auth.router';
import { ChatRouter } from '@chat/chat.router';
import { DatevRouter } from '@datev/datev.router';
import { AssistantRouter } from '@/assistant/assistant.router';

/**
 * Main App Router - Combines all tRPC routers
 */
@Injectable()
export class AppRouter {
  constructor(
    private readonly authRouter: AuthRouter,
    private readonly chatRouter: ChatRouter,
    private readonly datevRouter: DatevRouter,
    private readonly assistantRouter: AssistantRouter
  ) {}

  createRouter() {
    return router({
      auth: this.authRouter.createRouter(),
      chat: this.chatRouter.createRouter(),
      datev: this.datevRouter.getRouter(),
      assistant: this.assistantRouter.createRouter(),
    });
  }
}

// Export the router type for frontend
export type AppRouterType = ReturnType<AppRouter['createRouter']>;
