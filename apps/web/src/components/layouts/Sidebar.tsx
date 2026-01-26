import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { MessageSquare, Plus, Trash2, Bot, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatSession } from '@atlas/shared';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
}) => {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <NewChatButton onNewChat={onNewChat} />

      <Navigation />

      <ChatHistory
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={onSessionSelect}
        onDeleteSession={onDeleteSession}
      />
    </aside>
  );
};

interface NewChatButtonProps {
  onNewChat: () => void;
}

const NewChatButton = ({ onNewChat }: NewChatButtonProps) => {
  return (
    <div className="flex-shrink-0 p-4 border-b border-gray-200">
      <Button variant="accent" className="w-full" onClick={onNewChat}>
        <Plus className="w-4 h-4 mr-2" />
        Neuer Chat
      </Button>
    </div>
  );
};

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Chat',
      icon: MessageSquare,
      badge: null,
      // Active for / and /chat/* routes
      isActiveCheck: (path: string) => path === '/' || path.startsWith('/chat/'),
    },
    {
      to: '/assistants',
      label: 'Assistenten',
      icon: Bot,
      badge: null,
      isActiveCheck: (path: string) => path.startsWith('/assistants'),
    },
    {
      to: '/workflows',
      label: 'Workflows',
      icon: Workflow,
      badge: 'bald',
      isActiveCheck: (path: string) => path.startsWith('/workflows'),
    },
  ];

  return (
    <div className="flex-shrink-0 p-3 border-b border-gray-200">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
        Navigation
      </h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActiveCheck(location.pathname);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-xs text-gray-400 font-normal">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const ChatHistory = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
}: ChatHistoryProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 min-h-0">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
        Verlauf
      </h2>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={onSessionSelect}
          onDeleteSession={onDeleteSession}
        />
      )}
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center py-8 px-4">
      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Noch keine Chats</p>
    </div>
  );
};

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const SessionList = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
}: SessionListProps) => {
  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          isActive={currentSessionId === session.id}
          onSelect={() => onSessionSelect(session.id)}
          onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
        />
      ))}
    </div>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

const SessionItem = ({ session, isActive, onSelect, onDelete }: SessionItemProps) => {
  const hasAssistant = !!session.assistantId;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {hasAssistant ? (
        <Bot className="w-4 h-4 text-orange-500 flex-shrink-0" />
      ) : (
        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{session.title}</p>
        <p className="text-xs text-gray-500">
          {new Date(session.updatedAt).toLocaleDateString('de-DE')}
        </p>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      )}
    </div>
  );
};
