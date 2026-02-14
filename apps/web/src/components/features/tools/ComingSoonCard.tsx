import { type ReactElement } from 'react';
import { Sparkles, type LucideIcon } from 'lucide-react';

type ComingSoonCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  plannedFeatures: string[];
};

export const ComingSoonCard = ({
  icon: Icon,
  title,
  description,
  plannedFeatures,
}: ComingSoonCardProps): ReactElement => {
  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>

      <p className="text-muted-foreground max-w-lg mx-auto mb-8">{description}</p>

      <div className="bg-muted rounded-xl p-6 max-w-md mx-auto">
        <h3 className="font-medium text-foreground mb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Geplante Features
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          {plannedFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
