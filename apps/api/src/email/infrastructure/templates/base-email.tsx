import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Body, Container, Html, Preview, Section, Text } from '@react-email/components';
import { EmailFooter } from './_components/EmailFooter';
import { EmailHeader } from './_components/EmailHeader';

type BaseEmailProps = {
  preview?: string;
  children: ReactNode;
};

export const BaseEmail = ({ preview, children }: BaseEmailProps): ReactElement => {
  return (
    <Html lang="de">
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        style={{
          margin: '0',
          padding: '0',
          backgroundColor: '#f3f4f6',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <table
          style={{
            width: '100%',
            backgroundColor: '#f3f4f6',
          }}
        >
          <tr>
            <td style={{ padding: '40px 0' }}>
              <Container
                style={{
                  maxWidth: '600px',
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
              >
                <EmailHeader />
                <Section
                  style={{
                    padding: '32px 24px',
                  }}
                >
                  <table style={{ width: '100%' }}>
                    <tr>
                      <td>
                        <Text
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#374151',
                          }}
                        >
                          {children}
                        </Text>
                      </td>
                    </tr>
                  </table>
                </Section>
                <Section style={{ padding: '0 24px 32px 24px' }}>
                  <EmailFooter />
                </Section>
              </Container>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
};
