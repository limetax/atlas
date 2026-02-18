import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { EmailAdapter } from '../domain/email.adapter';
import type { SendEmailResult } from '../domain/email.types';

/**
 * Email Service - Application layer service for email operations
 *
 * This service provides high-level email functionality using the EmailAdapter.
 * It depends only on the domain interface (EmailAdapter), never on concrete implementations.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly emailAdapter: EmailAdapter) {}

  /**
   * Send a transactional email using a React Email template
   * @param params - Email parameters with React template
   * @returns Result indicating success/failure
   */
  async sendTransactionalEmail(params: {
    to: string | string[];
    subject: string;
    template: ReactElement;
    from?: string;
    replyTo?: string;
  }): Promise<SendEmailResult> {
    this.logger.debug(`Transaktions-E-Mail wird vorbereitet für: ${params.to}`);

    // Render React Email template to HTML
    const html = await render(params.template);

    // Send email via adapter
    const result = await this.emailAdapter.sendEmail({
      from: params.from ?? 'LimetaxOS <noreply@limetax.de>',
      to: params.to,
      subject: params.subject,
      html,
      replyTo: params.replyTo,
    });

    if (result.success) {
      this.logger.log(
        `Transaktions-E-Mail erfolgreich gesendet an ${params.to}: ${result.messageId}`
      );
    } else {
      this.logger.error(`Transaktions-E-Mail konnte nicht gesendet werden: ${result.error}`);
    }

    return result;
  }
}
