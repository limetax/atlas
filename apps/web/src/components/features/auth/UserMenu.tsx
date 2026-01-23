import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { useAuthToken } from '@/hooks/useAuthToken';
import { ROUTES } from '@/constants';
import { getInitials } from '@/utils/formatters';
import { ChevronDown, LogOut, User, Building2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Advisor } from '@atlas/shared';

interface UserMenuProps {
  user: SupabaseUser;
  advisor?: Advisor | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, advisor }) => {
  const navigate = useNavigate({ from: ROUTES.HOME });
  const { removeToken } = useAuthToken();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      navigate({ to: ROUTES.LOGIN });
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get display name
  const displayName = advisor?.full_name || user.email?.split('@')[0] || 'Benutzer';
  const initials = getInitials(displayName);

  return (
    <div className="relative" ref={menuRef}>
      <MenuTrigger
        isOpen={isOpen}
        initials={initials}
        displayName={displayName}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <MenuDropdown
          user={user}
          advisor={advisor}
          initials={initials}
          displayName={displayName}
          onClose={() => setIsOpen(false)}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
        />
      )}
    </div>
  );
};

interface MenuTriggerProps {
  isOpen: boolean;
  initials: string;
  displayName: string;
  onClick: () => void;
}

const MenuTrigger = ({ isOpen, initials, displayName, onClick }: MenuTriggerProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
        {initials}
      </div>

      <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
        {displayName}
      </span>

      <ChevronDown
        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
};

interface MenuDropdownProps {
  user: SupabaseUser;
  advisor?: Advisor | null;
  initials: string;
  displayName: string;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const MenuDropdown = ({
  user,
  advisor,
  initials,
  displayName,
  onClose,
  onLogout,
  isLoggingOut,
}: MenuDropdownProps) => {
  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <UserInfoHeader user={user} initials={initials} displayName={displayName} />

      <div className="py-1">
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
          disabled
        >
          <User className="w-4 h-4 text-gray-400" />
          <span>Profil</span>
          <span className="ml-auto text-xs text-gray-400">Bald</span>
        </button>

        {advisor?.advisory_id && (
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled
          >
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>Kanzlei</span>
            <span className="ml-auto text-xs text-gray-400">Bald</span>
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 pt-1">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Abmelden...' : 'Abmelden'}</span>
        </button>
      </div>
    </div>
  );
};

interface UserInfoHeaderProps {
  user: SupabaseUser;
  initials: string;
  displayName: string;
}

const UserInfoHeader = ({ user, initials, displayName }: UserInfoHeaderProps) => {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
    </div>
  );
};
