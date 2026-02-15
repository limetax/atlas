import { AutomationsPage } from '@/pages/AutomationsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/automatisierungen')({
  component: AutomationsPage,
});
