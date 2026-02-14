import { type ReactElement } from 'react';

import { Sparkles, Workflow } from 'lucide-react';

export const WorkflowsPage = (): ReactElement => {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <PageHeader />
        <ComingSoonCard />
      </div>
    </main>
  );
};

const PageHeader = (): ReactElement => (
  <div className="flex items-center gap-3 mb-8">
    <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
  </div>
);

const ComingSoonCard = (): ReactElement => (
  <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
    <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Workflow className="w-10 h-10 text-primary" />
    </div>

    <h2 className="text-xl font-semibold text-foreground mb-3">Workflows kommen bald</h2>

    <p className="text-muted-foreground max-w-lg mx-auto mb-8">
      Automatisieren Sie komplexe Arbeitsabläufe mit verketteten KI-Assistenten. Kombinieren Sie
      mehrere Schritte zu einem einzigen, effizienten Workflow.
    </p>

    <div className="bg-muted rounded-xl p-6 max-w-md mx-auto">
      <h3 className="font-medium text-foreground mb-4 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Geplante Features
      </h3>
      <ul className="text-sm text-muted-foreground space-y-2 text-left">
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>Mehrere Assistenten in einem Workflow verketten</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>Automatische Dokumentenverarbeitung</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>Wiederkehrende Aufgaben automatisieren</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>Export-Funktionen für Ergebnisse</span>
        </li>
      </ul>
    </div>
  </div>
);
