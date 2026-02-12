import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  Workflow,
  EllipsisVertical,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChatSession } from '@atlas/shared';

type SidebarProps = {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
}) => {
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <NewChatButton onNewChat={onNewChat} />

      <Navigation />

      <ChatHistory
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={onSessionSelect}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
      />
    </aside>
  );
};

type NewChatButtonProps = {
  onNewChat: () => void;
};

const NewChatButton = ({ onNewChat }: NewChatButtonProps) => {
  return (
    <div className="flex-shrink-0 p-4 border-b border-border">
      <Button variant="default" className="w-full" onClick={onNewChat}>
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
      label: 'Vorlagen',
      icon: FileText,
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
    <div className="flex-shrink-0 p-3 border-b border-border">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-accent text-accent-foreground border-orange-200'
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

type ChatHistoryProps = {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void;
};

const ChatHistory = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
}: ChatHistoryProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 min-h-0">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
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
          onRenameSession={onRenameSession}
        />
      )}
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center py-8 px-4">
      <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Noch keine Chats</p>
    </div>
  );
};

type SessionListProps = {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void;
};

const SessionList = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
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
          onRename={onRenameSession ? () => onRenameSession(session.id) : undefined}
        />
      ))}
    </div>
  );
};

type SessionItemProps = {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onRename?: () => void;
};

const SessionItem = ({ session, isActive, onSelect, onDelete, onRename }: SessionItemProps) => {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
        isActive ? 'bg-accent border-orange-200' : 'border-transparent hover:bg-muted'
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(session.updatedAt).toLocaleDateString('de-DE')}
        </p>
      </div>
      {(onDelete ?? onRename) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 p-1 hover:bg-muted rounded transition-all"
            >
              <EllipsisVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="w-4 h-4" />
                Umbenennen
              </DropdownMenuItem>
            )}
            {onRename && onDelete && <DropdownMenuSeparator />}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4" />
                Löschen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
