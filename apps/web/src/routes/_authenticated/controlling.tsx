import { ControllingPage } from '@/pages/ControllingPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/controlling')({
  component: ControllingPage,
});
