import type { PropsWithChildren } from 'react';
import { Button } from '@react-email/components';

type EmailButtonProps = {
  href: string;
};

export const EmailButton = ({ href, children }: PropsWithChildren<EmailButtonProps>) => {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#f97316',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
        textAlign: 'center',
        borderRadius: '6px',
        cursor: 'pointer',
      }}
    >
      {children}
    </Button>
  );
};
