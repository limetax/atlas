import { Input, Query, Router, UseMiddlewares } from 'nestjs-trpc';
import { z } from 'zod';

import { Logger } from '@nestjs/common';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import { TaxAssessmentService } from '@tax-assessment/application/tax-assessment.service';

const OpenAssessmentViewSchema = z.object({
  documentId: z.string(),
  clientName: z.string(),
  taxType: z.string(),
  year: z.number(),
  stateId: z.string(),
  createdAt: z.string(),
});

const GetOpenInputSchema = z.object({
  sandboxMode: z.boolean().default(false),
});

/**
 * TaxAssessmentRouter - tRPC router for tax assessment queries
 */
@Router({ alias: 'taxAssessmentReview' })
export class TaxAssessmentRouter {
  private readonly logger = new Logger(TaxAssessmentRouter.name);

  constructor(private readonly taxAssessmentService: TaxAssessmentService) {}

  @Query({
    input: GetOpenInputSchema,
    output: z.array(OpenAssessmentViewSchema),
  })
  @UseMiddlewares(AuthMiddleware)
  async getOpen(@Input('sandboxMode') sandboxMode: boolean) {
    return await this.taxAssessmentService.listOpenAssessments(sandboxMode);
  }
}
