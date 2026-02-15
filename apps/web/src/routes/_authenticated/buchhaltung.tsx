import { AccountingPage } from '@/pages/AccountingPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/buchhaltung')({
  component: AccountingPage,
});
