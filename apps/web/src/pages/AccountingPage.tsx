import { Calculator } from 'lucide-react';

import { ComingSoonPage } from '@/components/pages/ComingSoonPage';

export const AccountingPage = () => {
  return (
    <ComingSoonPage
      title="Buchhaltung"
      icon={Calculator}
      description="Zentrale Buchungserfassung und -verwaltung mit automatischer DATEV-Synchronisation. Vereinfachen Sie Ihre laufende Buchhaltung mit intelligenter Kategorisierung."
      features={[
        'DATEV-Integration für Buchungsdaten',
        'Automatische Kontenzuordnung',
        'Buchungsstapel-Verarbeitung',
        'Belegerfassung und -verwaltung',
      ]}
    />
  );
};
