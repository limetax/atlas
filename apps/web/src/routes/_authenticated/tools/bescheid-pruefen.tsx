import { createFileRoute } from '@tanstack/react-router';
import { TaxAssessmentReviewPage } from '@/pages/TaxAssessmentReviewPage';

export const Route = createFileRoute('/_authenticated/tools/bescheid-pruefen')({
  component: TaxAssessmentReviewPage,
});
