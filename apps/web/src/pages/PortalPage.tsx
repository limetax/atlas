import { Folder } from 'lucide-react';

import { ComingSoonPage } from '@/components/pages/ComingSoonPage';

export const PortalPage = () => {
  return (
    <ComingSoonPage
      title="Mandantenportal"
      icon={Folder}
      description="Sicherer Dokumentenaustausch und direkte Kommunikation mit Ihren Mandanten. Optimieren Sie die Zusammenarbeit mit digitalem Workflow."
      features={[
        'Mandantenfreigaben verwalten',
        'Dokumenten-Upload und -Download',
        'Nachrichtenzentrale',
        'Statusverfolgung für Aufträge',
      ]}
    />
  );
};
