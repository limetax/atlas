import { ToolCard } from '@/components/features/tools/ToolCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { TOOLS } from '@/data/tools';

export const ToolsDashboardPage = () => {
  const { advisor } = useAuthContext();

  const userName = advisor?.full_name ?? undefined;

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <WelcomeSection userName={userName ?? ''} />
        <ToolsGrid />
      </div>
    </main>
  );
};

type WelcomeSectionProps = {
  userName: string;
};

const WelcomeSection = ({ userName }: WelcomeSectionProps) => (
  <div className="mb-8 text-center">
    <h1 className="text-3xl font-bold text-foreground mb-2">Willkommen, {userName}</h1>
    <p className="text-muted-foreground">Wählen Sie ein Tool für den Schnellstart</p>
  </div>
);

const ToolsGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {TOOLS.map((tool) => (
      <ToolCard key={tool.id} tool={tool} />
    ))}
  </div>
);
