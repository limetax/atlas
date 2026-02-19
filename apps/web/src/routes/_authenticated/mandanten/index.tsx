import { createFileRoute } from '@tanstack/react-router';
import { ClientListPage } from '@/pages/ClientListPage';

export const Route = createFileRoute('/_authenticated/mandanten/')({
  component: ClientListPage,
});
