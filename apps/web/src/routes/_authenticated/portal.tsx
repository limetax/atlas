import { PortalPage } from '@/pages/PortalPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/portal')({
  component: PortalPage,
});
