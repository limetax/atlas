import {
  Search,
  Database,
  FileText,
  Users,
  Settings,
  Calendar,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Bot,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon map for assistant icons
 * Maps icon string names to Lucide React components
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  Database,
  FileText,
  Users,
  Settings,
  Calendar,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Bot,
  Sparkles,
};

interface AssistantWithIcon {
  id: string;
  icon: string;
}

/**
 * Get icon component for an assistant by ID
 * Falls back to Bot icon for assistants, MessageSquare for non-assistant chats
 */
export const getAssistantIcon = (
  assistantId: string | undefined,
  assistants: AssistantWithIcon[] | undefined
): LucideIcon => {
  if (!assistantId) return MessageSquare;

  const assistant = assistants?.find((a) => a.id === assistantId);
  if (!assistant?.icon) return Bot; // Fallback for assistant without icon

  return ICON_MAP[assistant.icon] ?? Bot;
};
