import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MessageSquare, Plus, Sparkles } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useChatSessions } from './useChatSessions';
import { useAssistants, type Assistant } from '@/hooks/useAssistants';
import { ICON_MAP } from '@/constants/icons';

export const AssistantsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    handleNewChat,
    handleNewChatWithAssistant,
    handleSessionSelect,
    handleDeleteSession,
  } = useChatSessions();

  // Fetch assistants from shared hook
  const { assistants, isLoading } = useAssistants();

  // Start chat with assistant - creates session with assistantId and navigates
  const handleStartChat = (assistantId: string) => {
    const newSessionId = handleNewChatWithAssistant(assistantId);
    navigate({ to: '/chat/$chatId', params: { chatId: newSessionId } });
  };

  // Handle new chat without assistant - navigates to new chat
  const handleNewChatWithNavigation = () => {
    const newSessionId = handleNewChat();
    navigate({ to: '/chat/$chatId', params: { chatId: newSessionId } });
  };

  // Handle session select - navigates to chat
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
          <div className="max-w-5xl mx-auto">
            <PageHeader />

            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <BuiltInAssistants assistants={assistants || []} onStartChat={handleStartChat} />
                <CustomAssistantsSection />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const PageHeader = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Assistenten</h1>
    <p className="text-gray-600">
      Nutzen Sie spezialisierte KI-Assistenten für verschiedene Aufgaben in Ihrer Steuerkanzlei.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
    ))}
  </div>
);

interface BuiltInAssistantsProps {
  assistants: Assistant[];
  onStartChat: (id: string) => void;
}

const BuiltInAssistants = ({ assistants, onStartChat }: BuiltInAssistantsProps) => (
  <section className="mb-10">
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
      Vorgefertigte Assistenten
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assistants.map((assistant) => (
        <AssistantCard
          key={assistant.id}
          assistant={assistant}
          onStartChat={() => onStartChat(assistant.id)}
        />
      ))}
    </div>
  </section>
);

interface AssistantCardProps {
  assistant: Assistant;
  onStartChat: () => void;
}

const AssistantCard = ({ assistant, onStartChat }: AssistantCardProps) => {
  const Icon = ICON_MAP[assistant.icon] ?? Sparkles;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-200 transition-all group cursor-pointer"
      onClick={onStartChat}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
          <Icon className="w-6 h-6 text-orange-600" />
        </div>
        {assistant.isBuiltIn && (
          <Badge variant="neutral" className="!text-[10px]">
            Standard
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{assistant.name}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assistant.description}</p>
      <Button variant="secondary" className="w-full !py-2 pointer-events-none">
        <MessageSquare className="w-4 h-4 mr-2" />
        Chat starten
      </Button>
    </div>
  );
};

const CustomAssistantsSection = () => (
  <section>
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Eigene Assistenten
      </h2>
      <span className="text-xs text-gray-400">Bald</span>
    </div>
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-700 mb-2">Eigene Assistenten erstellen</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Erstellen Sie bald eigene Assistenten mit individuellen Anweisungen für Ihre spezifischen
        Anforderungen in der Steuerkanzlei.
      </p>
      <Button variant="secondary" className="mt-4" disabled>
        <Plus className="w-4 h-4 mr-2" />
        Assistent erstellen
      </Button>
    </div>
  </section>
);
