import React from 'react';
import { trpc } from '../lib/trpc';
import { ComplianceBadge } from '../components/components/ComplianceBadge';
import { UserMenu } from '../components/components/UserMenu';
import { Settings } from 'lucide-react';
import { Button } from '../components/elements/Button';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  const { data: user, isLoading: userLoading } = trpc.auth.getUser.useQuery();
  const { data: advisor } = trpc.auth.getAdvisor.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
          <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">limetaxIQ</h1>
          <p className="text-xs text-gray-500">KI-Assistent für Steuerkanzleien</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ComplianceBadge />
        {onSettingsClick && (
          <Button variant="ghost" size="sm" onClick={onSettingsClick} className="!p-2">
            <Settings className="w-5 h-5" />
          </Button>
        )}

        {/* User menu */}
        {!userLoading && user && <UserMenu user={user} advisor={advisor} />}
      </div>
    </header>
  );
};
