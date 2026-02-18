import type { SendEmailParams, SendEmailResult } from './email.types';

/**
 * Email Adapter - Domain contract for email service providers
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * This defines what we expect from any email provider,
 * regardless of the underlying implementation (Resend, SendGrid, AWS SES, etc.).
 *
 * Note: No I-prefix following modern TypeScript conventions.
 */
export abstract class EmailAdapter {
  /**
   * Send an email
   * @param params - Email parameters (to, from, subject, html/text, etc.)
   * @returns Result indicating success/failure with optional message ID
   */
  abstract sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
