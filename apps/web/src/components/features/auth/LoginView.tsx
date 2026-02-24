import { type ReactNode } from 'react';

import { Server, Shield } from 'lucide-react';

import { GridBackground } from '@/components/ui/GridBackground';
import { LoginForm } from './LoginForm';

export const LoginView = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--muted)]">
      <GridBackground />
      <LoginCard />
    </div>
  );
};

const LoginCard = () => {
  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-card rounded-xl border border-border shadow-lg p-8">
        <Logo />
        <Subtitle />
        <LoginForm />
        <FooterBadges />
      </div>
      <AdditionalInfo />
    </div>
  );
};

const Logo = () => {
  return (
    <div className="flex items-center justify-center mb-6">
      <img src="/limetax-app-logo.svg" alt="Limetax App logo" className="h-16 object-contain" />
    </div>
  );
};

const Subtitle = () => {
  return (
    <div className="text-center mb-8">
      <p className="text-muted-foreground">Melden Sie sich in Ihrem Konto an</p>
    </div>
  );
};

const FooterBadges = () => {
  return (
    <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
      <Badge icon={<Shield className="w-4 h-4" />} text="DSGVO-konform" />
      <Badge icon={<Server className="w-4 h-4" />} text="Gehostet in Deutschland" />
    </div>
  );
};

type BadgeProps = {
  icon: ReactNode;
  text: string;
};

const Badge = ({ icon, text }: BadgeProps) => {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
};

const AdditionalInfo = () => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-muted-foreground">
        Noch kein Zugang?{' '}
        <a
          href="https://www.limetax.de/kontakt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-[var(--color-orange-600)] font-medium transition-colors"
        >
          Kontaktieren Sie uns
        </a>
      </p>
    </div>
  );
};
