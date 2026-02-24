/**
 * Tool Data
 * Static tool definitions for Limetax App dashboard
 * Each tool represents a specialized AI-powered capability
 */

import {
  FileCheck,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Lightbulb,
  type LucideIcon,
  Search,
} from 'lucide-react';

export const TOOL_STATUSES = ['active', 'beta', 'coming-soon', 'offline'] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export const TOOL_CATEGORIES = ['analyse-recherche', 'dokumentenverarbeitung'] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export type CategoryMeta = {
  id: ToolCategory;
  name: string;
  description?: string;
};

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'analyse-recherche',
    name: 'Analyse & Recherche',
  },
  {
    id: 'dokumentenverarbeitung',
    name: 'Dokumentenverarbeitung',
  },
];

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  status: ToolStatus;
  category: ToolCategory;
  featured?: boolean; // For primary button styling
  badge?: string; // Display text for badge (OFFLINE, BETA, etc.)
};

export const TOOLS: Tool[] = [
  {
    id: 'recherche-chat',
    name: 'Recherche-Chat',
    description: 'Komplexe steuerrechtliche Fragen mit Quellenangaben',
    icon: Search,
    route: '/chat', // Opens new chat with template
    status: 'active',
    category: 'analyse-recherche',
    featured: true, // Primary tool with filled button
  },
  {
    id: 'vertrag-zusammenfassen',
    name: 'Vertrag zusammenfassen',
    description: 'Vertragsanalyse mit HGB-Buchhaltungs-Expertise',
    icon: FileText,
    route: '/chat',
    status: 'active',
    category: 'dokumentenverarbeitung',
  },
  {
    id: 'hr-abgleich',
    name: 'HR-Abgleich',
    description: 'Abgleich von Lohnbuchhaltung und Stammdaten',
    icon: GitCompare,
    route: '/tools/hr-abgleich',
    status: 'coming-soon',
    category: 'dokumentenverarbeitung',
    badge: 'BALD',
  },
  {
    id: 'bescheid-pruefen',
    name: 'Bescheid prüfen',
    description: 'Analyse von Steuerbescheiden auf Abweichungen',
    icon: FileCheck,
    route: '/tools/bescheid-pruefen',
    status: 'active',
    category: 'analyse-recherche',
  },
  {
    id: 'gestaltung',
    name: 'Gestaltung',
    description: 'Szenarien für steuerliche Gestaltungsoptionen',
    icon: Lightbulb,
    route: '/tools/gestaltung',
    status: 'coming-soon',
    category: 'analyse-recherche',
    badge: 'BALD',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF → Excel',
    description: 'Automatische Konvertierung von PDF-Tabellen',
    icon: FileSpreadsheet,
    route: '/tools/pdf-to-excel',
    status: 'coming-soon',
    category: 'dokumentenverarbeitung',
    badge: 'BALD',
  },
];
