import { Children, isValidElement, useMemo, useState } from 'react';

import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { EmailDraftCard } from '@/components/features/chat/EmailDraftCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useTaxAssessmentReview } from '@/hooks/useTaxAssessmentReview';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { type OpenAssessmentView } from '@atlas/shared';
import { useNavigate } from '@tanstack/react-router';

/**
 * TaxAssessmentReviewPage - Lists open income tax assessments from DATEV DMS
 * Allows advisors to start an AI-powered review for each assessment
 */
export const TaxAssessmentReviewPage = () => {
  const [search, setSearch] = useState('');
  const [startingId, setStartingId] = useState<string | undefined>(undefined);
  const { data: assessments, isLoading, error } = trpc.taxAssessmentReview.getOpen.useQuery();
  const { startReview, clearReview, phase, streamingText, completedChatId } =
    useTaxAssessmentReview();

  const filtered = useMemo(
    () =>
      assessments?.filter(
        (a) =>
          a.clientName.toLowerCase().includes(search.toLowerCase()) ||
          a.year.toString().includes(search)
      ) ?? [],
    [assessments, search]
  );

  const handleStartReview = (documentId: string) => {
    setStartingId(documentId);
    void startReview(documentId);
  };

  const startingAssessment = startingId
    ? assessments?.find((a) => a.documentId === startingId)
    : undefined;

  const showPanel = phase === 'reviewing' || phase === 'completed';

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader />
        {showPanel ? (
          <ReviewProgressPanel
            clientName={startingAssessment?.clientName}
            year={startingAssessment?.year}
            streamingText={streamingText}
            phase={phase}
            completedChatId={completedChatId}
            onBack={clearReview}
          />
        ) : (
          <>
            <SearchBar value={search} onChange={setSearch} />
            <AssessmentOverviewContent
              isLoading={isLoading}
              error={error ?? null}
              assessments={filtered}
              hasSearch={search.length > 0}
              onStartReview={handleStartReview}
            />
          </>
        )}
      </div>
    </main>
  );
};

// Subcomponents colocated below

const PageHeader = () => (
  <div className="mb-8">
    <h1 className="mb-2 text-3xl font-bold text-foreground">Bescheidprüfung</h1>
    <p className="text-muted-foreground">
      Einkommensteuerbescheide automatisch gegen die Erklärung prüfen und Abweichungen analysieren
    </p>
  </div>
);

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="mb-6">
    <Input
      placeholder="Nach Mandant oder Jahr suchen..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-sm"
    />
  </div>
);

type AssessmentOverviewContentProps = {
  isLoading: boolean;
  error: { message: string } | null;
  assessments: OpenAssessmentView[];
  hasSearch: boolean;
  onStartReview: (documentId: string) => void;
};

const AssessmentOverviewContent = ({
  isLoading,
  error,
  assessments,
  hasSearch,
  onStartReview,
}: AssessmentOverviewContentProps) => {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (assessments.length === 0) return <EmptyState hasSearch={hasSearch} />;
  return <AssessmentList assessments={assessments} onStartReview={onStartReview} />;
};

type AssessmentListProps = {
  assessments: OpenAssessmentView[];
  onStartReview: (documentId: string) => void;
};

const AssessmentList = ({ assessments, onStartReview }: AssessmentListProps) => (
  <div className="overflow-hidden rounded-lg border border-border">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mandant</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
            Steuerart
          </th>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Jahr</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Eingang</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {assessments.map((assessment) => (
          <AssessmentRow
            key={assessment.documentId}
            assessment={assessment}
            onStartReview={onStartReview}
          />
        ))}
      </tbody>
    </table>
  </div>
);

type AssessmentRowProps = {
  assessment: OpenAssessmentView;
  onStartReview: (documentId: string) => void;
};

const AssessmentRow = ({ assessment, onStartReview }: AssessmentRowProps) => {
  const formattedDate = assessment.createdAt
    ? new Date(assessment.createdAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <tr className="border-t border-border transition-colors hover:bg-muted/30">
      <td className="px-4 py-4">
        <span className="font-medium text-foreground">{assessment.clientName}</span>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{assessment.taxType}</td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{assessment.year}</td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{formattedDate}</td>
      <td className="px-4 py-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStartReview(assessment.documentId)}
          className="gap-1 text-primary hover:text-primary"
        >
          Prüfung starten
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
};

// Matches the component overrides used in ChatMessage for consistent rendering
const markdownComponents: Components = {
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className ?? '');
    if (match?.[1] === 'email') {
      return <EmailDraftCard content={String(children)} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => {
    const hasEmailBlock = Children.toArray(children).some((child) => {
      if (!isValidElement(child)) return false;
      const childProps = child.props as { className?: string };
      return (
        typeof childProps.className === 'string' && childProps.className.includes('language-email')
      );
    });
    if (hasEmailBlock) return <>{children}</>;
    return <pre {...props}>{children}</pre>;
  },
};

type ReviewProgressPanelProps = {
  clientName: string | undefined;
  year: number | undefined;
  streamingText: string;
  phase: 'reviewing' | 'completed';
  completedChatId: string | undefined;
  onBack: () => void;
};

const ReviewProgressPanel = ({
  clientName,
  year,
  streamingText,
  phase,
  completedChatId,
  onBack,
}: ReviewProgressPanelProps) => {
  const navigate = useNavigate();
  const { scrollContainerRef, handleScroll } = useAutoScroll(streamingText);
  const hasText = streamingText.length > 0;
  const isCompleted = phase === 'completed';
  const title = clientName ? `${clientName}${year ? ` (${year})` : ''}` : 'Bescheid';

  const handleOpenChat = () => {
    if (completedChatId) {
      void navigate({ to: '/chat/$chatId', params: { chatId: completedChatId } });
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              isCompleted ? 'bg-muted-foreground' : 'bg-primary animate-pulse'
            )}
          />
          <span className="text-sm font-medium text-foreground">
            {isCompleted
              ? `Prüfung abgeschlossen – ${title}`
              : hasText
                ? `Prüfung läuft – ${title}`
                : `Dokumente werden geladen – ${title}`}
          </span>
        </div>
        {isCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zur Übersicht
          </Button>
        )}
      </div>

      {hasText ? (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="prose prose-sm max-h-[65vh] max-w-none overflow-y-auto [overflow-anchor:none] [overscroll-behavior-y:contain] px-5 py-4 text-foreground"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {streamingText}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-3 px-5 py-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {isCompleted && completedChatId && (
        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button onClick={handleOpenChat} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat öffnen
          </Button>
        </div>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full rounded-lg" />
    ))}
  </div>
);

type EmptyStateProps = {
  hasSearch: boolean;
};

const EmptyState = ({ hasSearch }: EmptyStateProps) => (
  <div className="py-16 text-center text-muted-foreground">
    {hasSearch ? (
      <>
        <p className="text-lg font-medium">Keine Ergebnisse</p>
        <p className="mt-1 text-sm">Keine Bescheide für diese Suchanfrage gefunden</p>
      </>
    ) : (
      <>
        <p className="text-lg font-medium">Keine offenen Bescheide</p>
        <p className="mt-1 text-sm">
          Aktuell liegen keine zu prüfenden Einkommensteuerbescheide vor
        </p>
      </>
    )}
  </div>
);

type ErrorStateProps = {
  message: string;
};

const ErrorState = ({ message }: ErrorStateProps) => (
  <div className="py-16 text-center">
    <p className="text-lg font-medium text-foreground">Fehler beim Laden</p>
    <p className="mt-1 text-sm text-muted-foreground">{message}</p>
  </div>
);
