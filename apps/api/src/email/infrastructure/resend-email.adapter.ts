import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailAdapter } from '../domain/email.adapter';
import type { SendEmailParams, SendEmailResult } from '../domain/email.types';

/**
 * Resend Email Adapter - Implementation of EmailAdapter using Resend SDK
 *
 * This adapter integrates with Resend's email service following DDD principles.
 * Resend SDK is only imported here in the infrastructure layer.
 */
@Injectable()
export class ResendEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY ist nicht in der Umgebungskonfiguration definiert');
    }

    this.resend = new Resend(apiKey);
    this.logger.log('Resend Email Adapter initialisiert');
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      this.logger.debug(`E-Mail wird gesendet an: ${params.to}`);

      const { data, error } = await this.resend.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
        cc: params.cc,
        bcc: params.bcc,
      });

      if (error || !data) {
        this.logger.error(
          `E-Mail konnte nicht gesendet werden: ${error?.message ?? 'Keine Daten vom E-Mail-Provider erhalten'}`
        );
        return {
          success: false,
          error: error?.message ?? 'Keine Daten vom E-Mail-Provider erhalten',
        };
      }

      this.logger.log(`E-Mail erfolgreich gesendet. Message ID: ${data.id}`);
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unbekannter Fehler beim E-Mail-Versand';
      this.logger.error(
        `E-Mail-Versand fehlgeschlagen: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
