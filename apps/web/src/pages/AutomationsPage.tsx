import { Workflow } from 'lucide-react';

import { ComingSoonPage } from '@/components/pages/ComingSoonPage';

export const AutomationsPage = () => {
  return (
    <ComingSoonPage
      title="Automatisierungen"
      icon={Workflow}
      description="Automatisieren Sie komplexe Arbeitsabläufe mit verketteten KI-Assistenten. Kombinieren Sie mehrere Schritte zu einem einzigen, effizienten Workflow."
      features={[
        'Mehrere Assistenten in einem Workflow verketten',
        'Automatische Dokumentenverarbeitung',
        'Wiederkehrende Aufgaben automatisieren',
        'Export-Funktionen für Ergebnisse',
      ]}
    />
  );
};
