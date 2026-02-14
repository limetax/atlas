import React from 'react';

import { ToolCard } from '@/components/features/tools/ToolCard';
import { Sidebar } from '@/components/layouts/Sidebar';
import { TOOLS } from '@/data/tools';
import { useAuth } from '@/hooks/useAuth';

export const ToolsDashboardPage: React.FC = () => {
  const { advisor } = useAuth();

  // Get user name for welcome message
  const userName = advisor?.full_name ?? undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-6xl mx-auto">
            <WelcomeSection userName={userName ?? ''} />
            <ToolsGrid />
          </div>
        </main>
      </div>
    </div>
  );
};

type WelcomeSectionProps = {
  userName: string;
};

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => (
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
