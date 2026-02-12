import { Settings } from 'lucide-react';

import { UserMenu } from '@/components/features/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { Advisor } from '@atlas/shared';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const Header = () => {
  const { user, advisor, isLoading } = useAuth();

  return (
    <header className="flex-shrink-0 h-16 bg-card border-b border-border px-6 flex items-center justify-between">
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
      <h1 className="text-lg font-bold text-foreground">limetaxIQ</h1>
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
      <Button variant="ghost" size="sm" className="p-2">
        <Settings className="w-5 h-5" />
      </Button>

      {!isLoading && user && <UserMenu user={user} advisor={advisor} />}
    </div>
  );
};
