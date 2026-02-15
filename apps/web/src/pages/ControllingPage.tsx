import { TrendingUp } from 'lucide-react';

import { ComingSoonPage } from '@/components/pages/ComingSoonPage';

export const ControllingPage = () => {
  return (
    <ComingSoonPage
      title="Controlling"
      icon={TrendingUp}
      description="Leistungsstarke Finanzanalysen und KPI-Tracking für fundierte Geschäftsentscheidungen. Behalten Sie die wirtschaftliche Entwicklung im Blick."
      features={[
        'Echtzeit-KPI-Dashboards',
        'Budgetplanung und Forecast',
        'Soll-Ist-Vergleiche',
        'Individuelles Reporting',
      ]}
    />
  );
};
