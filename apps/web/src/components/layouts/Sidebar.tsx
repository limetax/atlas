import React from 'react';

import {
  Building2,
  FileText,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Workflow,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAuthToken } from '@/hooks/useAuthToken';
import { trpc } from '@/lib/trpc';
import { getInitials } from '@/utils/formatters';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[260px] bg-sidebar border-r border-border flex flex-col h-full overflow-hidden">
      {/* Top section - Logo */}
      <div className="flex-shrink-0 p-6">
        <SidebarLogo />
      </div>

      {/* Middle section - Navigation (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4">
        <Navigation />
      </div>

      {/* Bottom section - Settings + User Card */}
      <div className="flex-shrink-0 p-4 space-y-2">
        {/* Settings item */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] text-muted-foreground font-medium hover:bg-card hover:shadow-sm transition-all cursor-not-allowed opacity-60">
          <Settings className="w-5 h-5" />
          <span className="flex-1">Einstellungen</span>
          <span className="text-xs text-muted-foreground font-normal">Bald</span>
        </div>
        <UserCard />
      </div>
    </aside>
  );
};

const Navigation = (): React.ReactElement => {
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: null,
      // Active for / and /tools/* routes
      isActiveCheck: (path: string): boolean => path === '/' || path.startsWith('/tools/'),
    },
    {
      to: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      badge: null,
      // Active for /chat and /chat/* routes
      isActiveCheck: (path: string): boolean => path === '/chat' || path.startsWith('/chat/'),
    },
    {
      to: '/assistants',
      label: 'Vorlagen',
      icon: FileText,
      badge: null,
      isActiveCheck: (path: string): boolean => path.startsWith('/assistants'),
    },
    {
      to: '/workflows',
      label: 'Workflows',
      icon: Workflow,
      badge: 'bald',
      isActiveCheck: (path: string): boolean => path.startsWith('/workflows'),
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActiveCheck(location.pathname);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-all ${
              isActive
                ? 'bg-card text-foreground font-semibold shadow-sm'
                : 'text-muted-foreground font-medium hover:bg-card hover:shadow-sm'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-xs text-muted-foreground font-normal">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

const SidebarLogo = (): React.ReactElement => {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-lg p-2">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
        <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Limetax App</h1>
    </Link>
  );
};

const UserCard = (): React.ReactElement => {
  const { user, advisor, isLoading } = useAuth();
  const navigate = useNavigate({ from: ROUTES.HOME });
  const { removeToken } = useAuthToken();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      navigate({ to: ROUTES.LOGIN });
    },
  });

  // Don't show card while loading or if no user
  if (isLoading || !user) {
    return <div className="h-[72px]" />; // Placeholder to prevent layout shift
  }

  // Get display values
  const displayName = advisor?.full_name || user.email?.split('@')[0] || 'Benutzer';
  const displayRole = advisor?.role === 'admin' ? 'Administrator' : 'Benutzer';
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full bg-card border border-border rounded-lg shadow-sm p-3 hover:bg-muted transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {advisor?.image_url && <AvatarImage src={advisor.image_url} alt={displayName} />}
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayRole}</p>
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" className="w-64">
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
