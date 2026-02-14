import React, { useEffect, useRef, useState } from 'react';

import { ChevronDown, History, MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { RenameDialog } from '@/components/features/chat/RenameDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChatSessions } from '@/pages/useChatSessions';
import { useNavigate, useParams } from '@tanstack/react-router';

type ChatHeaderProps = {
  onDeleteCurrent?: () => void;
  onNewChat?: () => void;
};

export const ChatHeader = ({ onDeleteCurrent, onNewChat }: ChatHeaderProps): React.ReactElement => {
  const {
    sessions,
    updateSessionTitle,
    handleDeleteSession,
    handleNewChat: clearSession,
  } = useChatSessions();
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const chatId = params.chatId;
  const currentSession = sessions.find((s) => s.id === chatId);

  const [renameDialog, setRenameDialog] = useState<{ sessionId: string; title: string } | null>(
    null
  );

  const handleRename = (sessionId: string): void => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setRenameDialog({ sessionId, title: session.title });
    }
  };

  const handleRenameSubmit = (newTitle: string): void => {
    if (renameDialog) {
      updateSessionTitle(renameDialog.sessionId, newTitle);
      setRenameDialog(null);
    }
  };

  const handleDelete = (sessionId: string): void => {
    const isCurrentChat = sessionId === chatId;

    if (isCurrentChat) {
      // Deleting current chat - call parent callback for navigation
      onDeleteCurrent?.();
    } else {
      // Deleting non-current chat - handle directly
      handleDeleteSession(sessionId);
    }
  };

  const handleNewChatClick = (): void => {
    if (onNewChat) {
      // Use parent's handler if provided (clears all state including local)
      onNewChat();
    } else {
      // Fallback: just clear session state and navigate
      clearSession();
      navigate({ to: '/chat' });
    }
  };

  return (
    <>
      <div className="h-10 border-b border-border px-6 py-8 flex items-center justify-between">
        {/* Current chat title with dropdown (Umbenennen, Löschen) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-muted rounded-md px-2 py-1 flex items-center gap-1.5 max-w-md">
              <span className="text-sm font-medium text-foreground truncate">
                {currentSession?.title ?? 'Neuer Chat'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => chatId && handleRename(chatId)}
              disabled={!chatId}
              onPointerDown={(e) => e.preventDefault()}
            >
              <Pencil className="w-4 h-4" />
              Umbenennen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => chatId && handleDelete(chatId)}
              disabled={!chatId}
              className="text-destructive"
              onPointerDown={(e) => e.preventDefault()}
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          {/* Neuer Chat button */}
          <Button variant="outline" size="sm" onClick={handleNewChatClick}>
            <Plus className="w-4 h-4" />
            Neuer Chat
          </Button>

          {/* Chat Verlauf dropdown */}
          <ChatHistoryDropdown
            sessions={sessions}
            currentSessionId={chatId}
            onSessionSelect={(id) => navigate({ to: '/chat/$chatId', params: { chatId: id } })}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={!!renameDialog}
        onClose={() => setRenameDialog(null)}
        currentTitle={renameDialog?.title ?? ''}
        onRename={handleRenameSubmit}
      />
    </>
  );
};

type ChatHistoryDropdownProps = {
  sessions: Array<{ id: string; title: string; updatedAt: Date }>;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onRename: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
};

const ChatHistoryDropdown = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onRename,
  onDelete,
}: ChatHistoryDropdownProps): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when dropdown opens and reset search when closed (with delay)
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else if (!open && searchTerm) {
      const timer = setTimeout(() => setSearchTerm(''), 150);
      return () => clearTimeout(timer);
    }
  }, [open, searchTerm]);

  // Filter sessions by title
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="w-4 h-4" />
          Chat Verlauf
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[320px] p-2" align="end" sideOffset={5}>
        {/* Search input with proper focus management */}
        <div className="px-2 py-1.5 mb-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm h-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Session list */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {searchTerm ? 'Keine Chats gefunden' : 'Noch keine Chats'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onSelect={() => onSessionSelect(session.id)}
                onRename={() => onRename(session.id)}
                onDelete={() => onDelete(session.id)}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type SessionListItemProps = {
  session: { id: string; title: string; updatedAt: Date };
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
};

const SessionListItem = ({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: SessionListItemProps): React.ReactElement => {
  return (
    <div className="group relative">
      <DropdownMenuItem
        onSelect={onSelect}
        onPointerDown={(e) => e.preventDefault()}
        className={cn(
          'transition-colors duration-150 cursor-pointer',
          'flex items-center gap-2 px-3 py-2.5',
          isActive && 'bg-accent'
        )}
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground">
            {session.updatedAt.toLocaleDateString('de-DE')}
          </p>
        </div>

        {/* Ellipsis menu */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuItem onSelect={onRename} onPointerDown={(e) => e.preventDefault()}>
                <Pencil className="w-4 h-4" /> Umbenennen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onDelete}
                onPointerDown={(e) => e.preventDefault()}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" /> Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DropdownMenuItem>
    </div>
  );
};
