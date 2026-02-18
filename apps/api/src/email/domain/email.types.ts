/**
 * Email domain types
 * Pure TypeScript types with no external dependencies
 */

/**
 * Email address with optional name
 */
export type EmailAddress = {
  email: string;
  name?: string;
};

/**
 * Parameters for sending an email
 */
export type SendEmailParams = {
  /** Sender email address */
  from: string;
  /** Recipient email address(es) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** HTML content of the email */
  html: string;
  /** Plain text content (optional fallback) */
  text?: string;
  /** Reply-to address */
  replyTo?: string;
  /** CC recipients */
  cc?: string | string[];
  /** BCC recipients */
  bcc?: string | string[];
};

/**
 * Result from sending an email
 * Uses Result pattern (success/error) instead of throwing exceptions
 */
export type SendEmailResult = {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Provider-specific message ID (if successful) */
  messageId?: string;
  /** Error message (if failed) */
  error?: string;
};
