import { useAuth } from '@/hooks/useAuth';
import { ComplianceBadge } from '@/components/features/compliance/ComplianceBadge';
import { UserMenu } from '@/components/features/auth/UserMenu';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Advisor } from '@lime-gpt/shared';

export const Header = () => {
  const { user, advisor, isLoading } = useAuth();

  return (
    <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <HeaderLogo />
      <HeaderActions user={user} advisor={advisor} isLoading={isLoading} />
    </header>
  );
};

const HeaderLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
        <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900">limetaxIQ</h1>
        <p className="text-xs text-gray-500">KI-Assistent für Steuerkanzleien</p>
      </div>
    </div>
  );
};

interface HeaderActionsProps {
  user: SupabaseUser | null | undefined;
  advisor: Advisor | null | undefined;
  isLoading: boolean;
}

const HeaderActions = ({ user, advisor, isLoading }: HeaderActionsProps) => {
  return (
    <div className="flex items-center gap-4">
      <ComplianceBadge />

      <Button variant="ghost" size="sm" className="!p-2">
        <Settings className="w-5 h-5" />
      </Button>

      {!isLoading && user && <UserMenu user={user} advisor={advisor} />}
    </div>
  );
};
