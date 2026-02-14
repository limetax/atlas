import { createFileRoute } from '@tanstack/react-router';
import { AssistantsPage } from '@/pages/AssistantsPage';

export const Route = createFileRoute('/_authenticated/assistants')({
  component: AssistantsPage,
});
