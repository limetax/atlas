import { createFileRoute } from '@tanstack/react-router';
import { DocumentsPage } from '@/pages/DocumentsPage';

export const Route = createFileRoute('/_authenticated/dokumente')({
  component: DocumentsPage,
});
