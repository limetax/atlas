import { createFileRoute } from '@tanstack/react-router';
import { BescheidPruefenPage } from '@/pages/BescheidPruefenPage';

export const Route = createFileRoute('/_authenticated/tools/bescheid-pruefen')({
  component: BescheidPruefenPage,
});
