import { Head, Heading } from '@react-email/components';

type EmailHeaderProps = {
  title?: string;
};

export const EmailHeader = ({ title }: EmailHeaderProps) => {
  return (
    <>
      <Head>
        <title>{title ?? 'LimetaxOS'}</title>
      </Head>
      <table
        style={{
          width: '100%',
          padding: '32px 24px',
          backgroundColor: '#f97316',
        }}
      >
        <tr>
          <td>
            <Heading
              style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
              }}
            >
              LimetaxOS
            </Heading>
          </td>
        </tr>
      </table>
    </>
  );
};
