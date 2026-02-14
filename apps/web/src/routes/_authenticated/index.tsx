import { createFileRoute } from '@tanstack/react-router';
import { ToolsDashboardPage } from '@/pages/ToolsDashboardPage';

export const Route = createFileRoute('/_authenticated/')({
  component: ToolsDashboardPage,
});
