import React from 'react';
import { LoginForm } from './LoginForm';
import { Shield, Zap, Users, TrendingUp } from 'lucide-react';

export const LoginView: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      <BrandingPanel />
      <LoginPanel />
    </div>
  );
};

const BrandingPanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <BrandingHeader />
        <FeaturesList />
        <BrandingFooter />
      </div>
    </div>
  );
};

const BrandingHeader = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
          <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">limetax</h1>
          <p className="text-orange-400 text-sm font-medium">IQ</p>
        </div>
      </div>

      <h2 className="text-4xl font-bold text-white leading-tight mb-4">
        Die Kanzleigruppe
        <br />
        der neuen Generation
      </h2>
      <p className="text-gray-400 text-lg max-w-md">
        Ihr intelligenter KI-Assistent für steuerrechtliche Fragen, Mandantenvorbereitung und
        Fristenverwaltung.
      </p>
    </div>
  );
};

const FeaturesList = () => {
  return (
    <div className="space-y-6">
      <FeatureItem
        icon={<Zap className="w-5 h-5 text-orange-400" />}
        bgColor="bg-orange-400/20"
        title="Digitaler Fokus"
        description="Modernste KI-Technologie für effiziente Steuerberatung"
      />
      <FeatureItem
        icon={<Shield className="w-5 h-5 text-orange-400" />}
        bgColor="bg-orange-400/20"
        title="DSGVO-Konform"
        description="Höchste Datenschutzstandards für Ihre Mandantendaten"
      />
      <FeatureItem
        icon={<Users className="w-5 h-5 text-gray-400" />}
        bgColor="bg-gray-400/20"
        title="Beratung mit Weitblick"
        description="Fundierte Antworten mit Quellenangaben aus dem Steuerrecht"
      />
      <FeatureItem
        icon={<TrendingUp className="w-5 h-5 text-gray-400" />}
        bgColor="bg-gray-400/20"
        title="Transparenz"
        description="Nachvollziehbare Empfehlungen mit zitierten Paragraphen"
      />
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, bgColor, title, description }: FeatureItemProps) => {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

const BrandingFooter = () => {
  return (
    <div className="text-muted-foreground text-sm">
      <p>© {new Date().getFullYear()} limetax. Alle Rechte vorbehalten.</p>
    </div>
  );
};

const LoginPanel = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <MobileLogo />
        <WelcomeText />
        <LoginForm />
        <AdditionalInfo />
      </div>
    </div>
  );
};

const MobileLogo = () => {
  return (
    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
      <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center p-2">
        <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">limetaxIQ</h1>
      </div>
    </div>
  );
};

const WelcomeText = () => {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Willkommen bei limetaxIQ</h2>
      <p className="text-muted-foreground">Melden Sie sich an, um fortzufahren</p>
    </div>
  );
};

const AdditionalInfo = () => {
  return (
    <div className="mt-8 pt-8 border-t border-border">
      <p className="text-center text-sm text-muted-foreground">
        Noch kein Zugang?{' '}
        <a
          href="https://www.limetax.de/kontakt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 font-medium"
        >
          Kontaktieren Sie uns
        </a>
      </p>
    </div>
  );
};
