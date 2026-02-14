import { createFileRoute } from '@tanstack/react-router';
import { WorkflowsPage } from '@/pages/WorkflowsPage';

export const Route = createFileRoute('/_authenticated/workflows')({
  component: WorkflowsPage,
});
