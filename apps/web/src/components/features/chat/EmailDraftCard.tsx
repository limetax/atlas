import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Copy, Check, ChevronDown } from 'lucide-react';

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
  let bodyStartIndex = 0;

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

  // Body is everything after the blank line
  const body = lines.slice(bodyStartIndex).join('\n').trim();

  return { to, subject, body };
}

function buildEmailUrl(email: ParsedEmail, client: 'gmail' | 'outlook' | 'mailto'): string {
  const encodedTo = encodeURIComponent(email.to);
  const encodedSubject = encodeURIComponent(email.subject);
  const encodedBody = encodeURIComponent(email.body);

  switch (client) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
    case 'outlook':
      return `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
    case 'mailto':
      return `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
    default:
      return `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
  }
}

export function EmailDraftCard({ content }: EmailDraftCardProps) {
  const [copied, setCopied] = useState(false);
  const email = parseEmailContent(content);

  const handleCopy = async () => {
    const fullEmail = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (client: 'gmail' | 'outlook' | 'mailto') => {
    const url = buildEmailUrl(email, client);
    window.open(url, '_blank');
  };

  return (
    <Card className="border-lime-200 bg-lime-50/50 shadow-sm my-3">
      <div className="p-4 space-y-3">
        {/* Header with label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-lime-600" />
            <span className="text-xs font-semibold text-lime-700 uppercase tracking-wide">
              E-Mail
            </span>
          </div>
        </div>

        {/* Email metadata */}
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">An:</span>{' '}
            <span className="text-gray-900">{email.to}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Betreff:</span>{' '}
            <span className="text-gray-900">{email.subject}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 max-h-64 overflow-y-auto whitespace-pre-wrap">
          {email.body}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
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
              <Button size="sm" className="gap-2 bg-lime-600 hover:bg-lime-700">
                <Mail className="w-4 h-4" />
                Senden
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSend('outlook')}>
                Outlook öffnen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSend('gmail')}>Gmail öffnen</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSend('mailto')}>
                Standard E-Mail-App
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
