import React from 'react';

import { Hr, Text } from '@react-email/components';

export const EmailFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Hr
        style={{
          margin: '32px 0',
          borderColor: '#e5e7eb',
        }}
      />
      <table style={{ width: '100%' }}>
        <tr>
          <td>
            <Text
              style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                lineHeight: '16px',
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              © {currentYear} LimetaxOS. Alle Rechte vorbehalten.
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: '12px',
                lineHeight: '16px',
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese
              Nachricht.
            </Text>
          </td>
        </tr>
      </table>
    </>
  );
};
