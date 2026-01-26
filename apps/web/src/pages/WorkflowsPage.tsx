import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Workflow, Sparkles } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { useChatSessions } from './useChatSessions';

export const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, currentSessionId, handleNewChat, handleSessionSelect, handleDeleteSession } =
    useChatSessions();

  // Handle new chat - navigate to new chat URL
  const handleNewChatWithNavigation = () => {
    const newSessionId = handleNewChat();
    navigate({ to: '/chat/$chatId', params: { chatId: newSessionId } });
  };

  // Handle session select - navigate to chat URL
  const handleSessionSelectWithNavigation = (sessionId: string) => {
    handleSessionSelect(sessionId);
    navigate({ to: '/chat/$chatId', params: { chatId: sessionId } });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelectWithNavigation}
        onNewChat={handleNewChatWithNavigation}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
          <div className="max-w-3xl mx-auto">
            <PageHeader />
            <ComingSoonCard />
          </div>
        </main>
      </div>
    </div>
  );
};

const PageHeader = () => (
  <div className="flex items-center gap-3 mb-8">
    <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
  </div>
);

const ComingSoonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Workflow className="w-10 h-10 text-orange-600" />
    </div>

    <h2 className="text-xl font-semibold text-gray-900 mb-3">Workflows kommen bald</h2>

    <p className="text-gray-600 max-w-lg mx-auto mb-8">
      Automatisieren Sie komplexe Arbeitsabläufe mit verketteten KI-Assistenten. Kombinieren Sie
      mehrere Schritte zu einem einzigen, effizienten Workflow.
    </p>

    <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
      <h3 className="font-medium text-gray-800 mb-4 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-500" />
        Geplante Features
      </h3>
      <ul className="text-sm text-gray-600 space-y-2 text-left">
        <li className="flex items-start gap-2">
          <span className="text-orange-500 mt-1">•</span>
          <span>Mehrere Assistenten in einem Workflow verketten</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-orange-500 mt-1">•</span>
          <span>Automatische Dokumentenverarbeitung</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-orange-500 mt-1">•</span>
          <span>Wiederkehrende Aufgaben automatisieren</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-orange-500 mt-1">•</span>
          <span>Export-Funktionen für Ergebnisse</span>
        </li>
      </ul>
    </div>
  </div>
);
