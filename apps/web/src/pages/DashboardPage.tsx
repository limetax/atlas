import { type JSX } from 'react';

import { ArrowRight, MessageSquare, Plus } from 'lucide-react';

import { ToolCard } from '@/components/features/tools/ToolCard';
import { GridBackground } from '@/components/ui/GridBackground';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Tool } from '@/data/tools';
import { TOOLS } from '@/data/tools';
import { Link, useNavigate } from '@tanstack/react-router';

import { useChatSessions } from './useChatSessions';

export const DashboardPage = (): JSX.Element => {
  const { advisor } = useAuthContext();
  const userName = advisor?.full_name ?? 'Benutzer';
  const featuredTools = TOOLS.slice(0, 4);
  const { sessions, handleNewChat } = useChatSessions();
  const recentChats = sessions.slice(0, 5);

  return (
    <main className="relative flex-1 overflow-y-auto bg-background">
      <GridBackground />
      <div className="relative z-10 min-h-full px-8 pt-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <WelcomeSection userName={userName} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <FeaturedToolsSection tools={featuredTools} />
            </div>
            <div className="xl:col-span-1">
              <RecentChatsSection chats={recentChats} onNewChat={handleNewChat} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// Subcomponents colocated below

type WelcomeSectionProps = {
  userName: string;
};

const WelcomeSection = ({ userName }: WelcomeSectionProps): JSX.Element => (
  <div className="mb-12">
    <h1 className="text-5xl font-bold text-foreground mb-3">Willkommen, {userName}</h1>
    <p className="text-lg text-muted-foreground">
      Wählen Sie ein Tool oder setzen Sie eine Unterhaltung fort
    </p>
  </div>
);

type FeaturedToolsSectionProps = {
  tools: Tool[];
};

const FeaturedToolsSection = ({ tools }: FeaturedToolsSectionProps): JSX.Element => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-foreground">Schnellstart</h2>
      <Link
        to="/tools"
        className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
      >
        <span>Alle Tools</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  </div>
);

type RecentChatsSectionProps = {
  chats: Array<{
    id: string;
    title: string;
    updatedAt: Date;
  }>;
  onNewChat: () => void;
};

const RecentChatsSection = ({ chats, onNewChat }: RecentChatsSectionProps): JSX.Element => {
  const navigate = useNavigate();

  const handleChatClick = (chatId: string) => {
    navigate({ to: '/chat/$chatId', params: { chatId } });
  };

  const handleNewChatClick = () => {
    onNewChat();
    navigate({ to: '/chat' });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Letzte Unterhaltungen</h2>
        <MessageSquare className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
      </div>

      {chats.length > 0 ? (
        <div className="space-y-2 mb-4">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {chat.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(chat.updatedAt)}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-4">
          <MessageSquare
            className="w-12 h-12 text-muted-foreground mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">Noch keine Unterhaltungen</p>
        </div>
      )}

      <button
        onClick={handleNewChatClick}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors mx-auto"
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
        <span>Neue Unterhaltung</span>
      </button>
    </div>
  );
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Gerade eben';
  if (diffInSeconds < 3600) return `Vor ${Math.floor(diffInSeconds / 60)} Min.`;
  if (diffInSeconds < 86400) return `Vor ${Math.floor(diffInSeconds / 3600)} Std.`;
  if (diffInSeconds < 604800) return `Vor ${Math.floor(diffInSeconds / 86400)} Tagen`;

  return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}
