import React, { useState } from 'react';

import { AlertCircle, Check, ChevronDown, Copy, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Constants
const COPY_FEEDBACK_DURATION_MS = 2000;
const MAX_URL_LENGTH = 8000; // Conservative limit for mailto URLs
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailDraftCardProps = {
  content: string;
};

type ParsedEmail = {
  to: string;
  subject: string;
  body: string;
};

function parseEmailContent(content: string): ParsedEmail {
  const lines = content.trim().split('\n');
  let to = '';
  let subject = '';
  let bodyStartIndex = -1;

  // Parse headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('to:')) {
      to = line.substring(3).trim();
    } else if (line.startsWith('subject:')) {
      subject = line.substring(8).trim();
    } else if (line === '') {
      // Empty line marks end of headers
      bodyStartIndex = i + 1;
      break;
    }
  }

  // If no blank line found, assume headers are done after 'subject:' line
  if (bodyStartIndex === -1) {
    const subjectIndex = lines.findIndex((line) => line.trim().startsWith('subject:'));
    bodyStartIndex = subjectIndex >= 0 ? subjectIndex + 1 : 0;
  }

  // Body is everything after the blank line
  const body = bodyStartIndex >= 0 ? lines.slice(bodyStartIndex).join('\n').trim() : '';

  return { to, subject, body };
}

function validateEmail(email: string): boolean {
  return email
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
    .every((e) => EMAIL_REGEX.test(e));
}

function buildEmailUrl(email: ParsedEmail, client: 'gmail' | 'outlook' | 'mailto'): string {
  const encodedTo = encodeURIComponent(email.to);
  const encodedSubject = encodeURIComponent(email.subject);
  const encodedBody = encodeURIComponent(email.body);

  let url: string;
  switch (client) {
    case 'gmail':
      url = `https://mail.google.com/mail/?view=cm&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
      break;
    case 'outlook':
      url = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
      break;
    case 'mailto':
    default:
      url = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
      break;
  }

  // Warn if URL might be too long (conservative check)
  if (url.length > MAX_URL_LENGTH) {
    console.warn(
      `Email URL length (${url.length}) exceeds recommended limit (${MAX_URL_LENGTH}). Some email clients may truncate the content.`
    );
  }

  return url;
}

export function EmailDraftCard({ content }: EmailDraftCardProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Memoize email parsing to avoid recalculation on every render
  const email = React.useMemo(() => parseEmailContent(content), [content]);

  // Validate email fields
  const hasValidRecipient = email.to && validateEmail(email.to);
  const hasSubject = email.subject.length > 0;
  const hasBody = email.body.length > 0;

  const handleCopy = async (): Promise<void> => {
    try {
      const fullEmail = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setCopyError(null);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error('Failed to copy email to clipboard:', error);
      setCopyError('Kopieren fehlgeschlagen');
      setTimeout(() => setCopyError(null), COPY_FEEDBACK_DURATION_MS);
    }
  };

  const handleSend = (client: 'gmail' | 'outlook' | 'mailto'): void => {
    const url = buildEmailUrl(email, client);
    window.open(url, '_blank');
  };

  return (
    <Card className="border-accent-foreground/20 bg-accent/50 shadow-sm my-3">
      <div className="p-4 space-y-3">
        {/* Header with label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-accent-foreground uppercase tracking-wide">
              E-Mail
            </span>
          </div>
        </div>

        {/* Validation warnings */}
        {(!hasValidRecipient || !hasSubject || !hasBody) && (
          <div className="flex items-start gap-2 p-3 bg-warning-bg border border-warning/30 rounded text-sm">
            <AlertCircle className="w-4 h-4 text-warning-text mt-0.5 flex-shrink-0" />
            <div className="text-warning-text">
              <p className="font-medium">Unvollständiger E-Mail-Entwurf:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {!hasValidRecipient && <li>Empfänger fehlt oder ist ungültig</li>}
                {!hasSubject && <li>Betreff fehlt</li>}
                {!hasBody && <li>E-Mail-Text fehlt</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Email metadata */}
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-foreground">An:</span>{' '}
            <span className={hasValidRecipient ? 'text-foreground' : 'text-destructive'}>
              {email.to ?? '(nicht angegeben)'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">Betreff:</span>{' '}
            <span className={hasSubject ? 'text-foreground' : 'text-muted-foreground'}>
              {email.subject ?? '(nicht angegeben)'}
            </span>
          </div>
        </div>

        {/* Email body */}
        <div className="text-sm text-foreground bg-background p-3 rounded border border-border max-h-64 overflow-y-auto whitespace-pre-wrap">
          {email.body ?? '(kein Text)'}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {/* Copy error message */}
          {copyError && (
            <div className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{copyError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopieren
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={!hasValidRecipient}
                  title={
                    !hasValidRecipient
                      ? 'Bitte geben Sie eine gültige E-Mail-Adresse an'
                      : undefined
                  }
                >
                  <Mail className="w-4 h-4" />
                  Senden
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSend('outlook')}>
                  Outlook öffnen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSend('gmail')}>
                  Gmail öffnen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSend('mailto')}>
                  Standard E-Mail-App
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
