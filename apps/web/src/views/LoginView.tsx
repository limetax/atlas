import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Shield, Zap, Users, TrendingUp } from 'lucide-react';

export const LoginView: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo and tagline */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">limetax</h1>
                <p className="text-lime-400 text-sm font-medium">IQ</p>
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

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-lime-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Digitaler Fokus</h3>
                <p className="text-gray-400 text-sm">
                  Modernste KI-Technologie für effiziente Steuerberatung
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-400/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">DSGVO-Konform</h3>
                <p className="text-gray-400 text-sm">
                  Höchste Datenschutzstandards für Ihre Mandantendaten
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Beratung mit Weitblick</h3>
                <p className="text-gray-400 text-sm">
                  Fundierte Antworten mit Quellenangaben aus dem Steuerrecht
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Transparenz</h3>
                <p className="text-gray-400 text-sm">
                  Nachvollziehbare Empfehlungen mit zitierten Paragraphen
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} limetax. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center p-2">
              <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">limetaxIQ</h1>
            </div>
          </div>

          {/* Welcome text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Willkommen bei limetaxIQ</h2>
            <p className="text-gray-500">Melden Sie sich an, um fortzufahren</p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Additional info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Noch kein Zugang?{' '}
              <a
                href="https://www.limetax.de/kontakt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Kontaktieren Sie uns
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
