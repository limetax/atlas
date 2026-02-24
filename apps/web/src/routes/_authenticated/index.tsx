import { createFileRoute } from '@tanstack/react-router';
import { ToolsCatalogPage } from '@/pages/ToolsCatalogPage';

export const Route = createFileRoute('/_authenticated/')({
  component: ToolsCatalogPage,
});
