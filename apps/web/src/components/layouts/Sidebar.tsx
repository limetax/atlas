import React from 'react';

import { FileText, LayoutGrid, MessageSquare, Settings, Workflow } from 'lucide-react';

import { UserMenu } from '@/components/features/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from '@tanstack/react-router';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[260px] bg-card border-r border-border flex flex-col h-full overflow-hidden">
      {/* Top section - Logo */}
      <div className="flex-shrink-0 p-4">
        <SidebarLogo />
      </div>

      {/* Middle section - Navigation (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        <Navigation />
      </div>

      {/* Bottom section - Settings + UserMenu */}
      <div className="flex-shrink-0 p-4">
        <SidebarActions />
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
    <div className="p-3">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActiveCheck(location.pathname);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-accent text-accent-foreground border-accent-foreground/20'
                  : 'text-foreground border-transparent hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-xs text-muted-foreground font-normal">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const SidebarLogo = (): React.ReactElement => {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 transition-colors"
    >
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
        <img src="/icon.png" alt="limetax logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Limetax App</h1>
    </Link>
  );
};

const SidebarActions = (): React.ReactElement => {
  const { user, advisor, isLoading } = useAuth();

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" className="p-2" aria-label="Einstellungen">
        <Settings className="w-5 h-5" />
      </Button>

      {!isLoading && user && <UserMenu user={user} advisor={advisor} />}
    </div>
  );
};
