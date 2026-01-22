import React from "react";
import { ChatSession } from "@/types";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "../elements/Button";

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
      {/* New Chat Button */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <Button variant="accent" className="w-full" onClick={onNewChat}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          Verlauf
        </h2>

        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Noch keine Chats</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === session.id
                    ? "bg-orange-50 border border-orange-200"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
                {onDeleteSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Powered by Claude 4 Sonnet
        </p>
      </div>
    </aside>
  );
};
