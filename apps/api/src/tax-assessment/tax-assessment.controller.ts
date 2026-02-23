import { Request, Response } from 'express';
import { z } from 'zod';

import { Body, Controller, Logger, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { TaxAssessmentService } from '@tax-assessment/application/tax-assessment.service';

const ReviewBodySchema = z.object({
  assessmentDocumentId: z.string().min(1),
});

/**
 * TaxAssessmentController - SSE endpoint for streaming tax assessment review
 */
@Controller('tax-assessment')
export class TaxAssessmentController {
  private readonly logger = new Logger(TaxAssessmentController.name);

  constructor(
    private readonly taxAssessmentService: TaxAssessmentService,
    private readonly supabase: SupabaseService
  ) {}

  @Post('review')
  async review(@Body() body: unknown, @Req() req: Request, @Res() res: Response): Promise<void> {
    const { assessmentDocumentId } = ReviewBodySchema.parse(body);
    const advisorId = await this.authenticateRequest(req);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of this.taxAssessmentService.streamReview(
      assessmentDocumentId,
      advisorId
    )) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  }

  // TODO don't we have a REST SSE common middleware that already does this? SHould be in chat-controller
  private async authenticateRequest(req: Request): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Anmeldung erforderlich');
    }

    const token = authHeader.slice(7);
    const { data, error } = await this.supabase.getUser(token);

    if (error ?? !data.user) {
      throw new UnauthorizedException('Ungültiges Token');
    }

    return data.user.id;
  }
}
