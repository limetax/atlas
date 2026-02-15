import { type ComponentType } from 'react';

import { Sparkles } from 'lucide-react';

type ComingSoonPageProps = {
  title: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  features: string[];
};

export const ComingSoonPage = ({
  title,
  icon: Icon,
  description,
  features,
}: ComingSoonPageProps) => {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <PageHeader title={title} />
        <ComingSoonCard icon={Icon} description={description} features={features} />
      </div>
    </main>
  );
};

type PageHeaderProps = {
  title: string;
};

const PageHeader = ({ title }: PageHeaderProps) => (
  <div className="flex items-center gap-3 mb-8">
    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
  </div>
);

type ComingSoonCardProps = {
  icon: ComponentType<{ className?: string }>;
  description: string;
  features: string[];
};

const ComingSoonCard = ({ icon: Icon, description, features }: ComingSoonCardProps) => (
  <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
    <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Icon className="w-10 h-10 text-primary" />
    </div>

    <h2 className="text-xl font-semibold text-foreground mb-3">Bald verfügbar</h2>

    <p className="text-muted-foreground max-w-lg mx-auto mb-8">{description}</p>

    <div className="bg-muted rounded-xl p-6 max-w-md mx-auto">
      <h3 className="font-medium text-foreground mb-4 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Geplante Features
      </h3>
      <ul className="text-sm text-muted-foreground space-y-2 text-left">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
