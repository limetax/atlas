import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Sparkles, Search } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSessions } from './useChatSessions';
import { useAssistants, type Assistant } from '@/hooks/useAssistants';
import { ICON_MAP } from '@/constants/icons';
import { TEMPLATES } from '@/data/templates';
import { TEMPLATE_CATEGORIES, TemplateCategory } from '@/types/template';
import { TemplateCard } from '@/components/features/templates/TemplateCard';
import { CategoryChip } from '@/components/features/templates/CategoryChip';

type TabType = 'assistants' | 'templates';

export const AssistantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<TabType>('assistants');

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

  // Handle template insertion - create new chat and navigate with template ID
  const handleInsertTemplate = (templateId: string) => {
    const newSessionId = handleNewChat();
    // Navigate with templateId as search param
    navigate({
      to: '/chat/$chatId',
      params: { chatId: newSessionId },
      search: { templateId },
    });
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
          <div className="max-w-6xl mx-auto">
            <PageHeader />

            {/* Tabs */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            {activeTab === 'assistants' ? (
              isLoading ? (
                <LoadingState />
              ) : (
                <>
                  <BuiltInAssistants assistants={assistants || []} onStartChat={handleStartChat} />
                  <CustomAssistantsSection />
                </>
              )
            ) : (
              <TemplatesSection onInsertTemplate={handleInsertTemplate} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const PageHeader = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Assistenten & Vorlagen</h1>
    <p className="text-gray-600">
      Nutzen Sie spezialisierte KI-Assistenten und Prompt-Vorlagen für Ihre Steuerkanzlei.
    </p>
  </div>
);

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => (
  <div className="flex gap-1 mb-8 border-b border-gray-200">
    <button
      onClick={() => onTabChange('assistants')}
      className={`
        px-6 py-3 font-medium text-sm transition-all relative
        ${activeTab === 'assistants' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}
      `}
    >
      Assistenten
      {activeTab === 'assistants' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
      )}
    </button>
    <button
      onClick={() => onTabChange('templates')}
      className={`
        px-6 py-3 font-medium text-sm transition-all relative
        ${activeTab === 'templates' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}
      `}
    >
      Vorlagen
      {activeTab === 'templates' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
      )}
    </button>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-6">
        <Skeleton className="w-12 h-12 rounded-xl mb-4" />
        <Skeleton className="h-5 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
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
    <Card
      className="p-6 hover:shadow-lg hover:border-orange-200 transition-all group cursor-pointer"
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
      <p className="text-sm text-gray-600 line-clamp-2">{assistant.description}</p>
    </Card>
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

interface TemplatesSectionProps {
  onInsertTemplate: (templateId: string) => void;
}

const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onInsertTemplate }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<TemplateCategory | null>(null);

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = TEMPLATES;

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (category: TemplateCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <section>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Vorlagen durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((category) => (
            <CategoryChip
              key={category.id}
              category={category.id}
              isActive={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onInsert={onInsertTemplate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Keine Vorlagen gefunden. Versuchen Sie eine andere Suche oder Kategorie.
          </p>
        </div>
      )}
    </section>
  );
};
