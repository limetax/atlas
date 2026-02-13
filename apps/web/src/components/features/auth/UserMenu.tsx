import React from 'react';

import { Building2, ChevronDown, LogOut, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants';
import { useAuthToken } from '@/hooks/useAuthToken';
import { trpc } from '@/lib/trpc';
import { getInitials } from '@/utils/formatters';
import type { Advisor } from '@atlas/shared';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from '@tanstack/react-router';

interface UserMenuProps {
  user: SupabaseUser;
  advisor?: Advisor | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, advisor }) => {
  const navigate = useNavigate({ from: ROUTES.HOME });
  const { removeToken } = useAuthToken();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      navigate({ to: ROUTES.LOGIN });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get display name
  const displayName = advisor?.full_name || user.email?.split('@')[0] || 'Benutzer';
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
          <Avatar className="w-8 h-8">
            {advisor?.image_url && <AvatarImage src={advisor.image_url} alt={displayName} />}
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
            {displayName}
          </span>

          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* User Info Header */}
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {advisor?.image_url && <AvatarImage src={advisor.image_url} alt={displayName} />}
              <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem disabled>
          <User className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1">Profil</span>
          <span className="text-xs text-muted-foreground">Bald</span>
        </DropdownMenuItem>

        {advisor?.advisory_id && (
          <DropdownMenuItem disabled>
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1">Kanzlei</span>
            <span className="text-xs text-muted-foreground">Bald</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="text-destructive focus:text-destructive focus:bg-error-bg"
        >
          <LogOut className="w-5 h-5" />
          <span>{logoutMutation.isPending ? 'Abmelden...' : 'Abmelden'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
