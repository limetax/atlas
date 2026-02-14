/**
 * Tool Data
 * Static tool definitions for LimetaxOS dashboard
 * Each tool represents a specialized AI-powered capability
 */

import {
  Search,
  GitCompare,
  FileCheck,
  Lightbulb,
  FileText,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';

export const TOOL_STATUSES = ['active', 'beta', 'coming-soon', 'offline'] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  status: ToolStatus;
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
    featured: true, // Primary tool with filled button
  },
  {
    id: 'hr-abgleich',
    name: 'HR-Abgleich',
    description: 'Abgleich von Lohnbuchhaltung und Stammdaten',
    icon: GitCompare,
    route: '/tools/hr-abgleich',
    status: 'coming-soon',
    badge: 'BALD',
  },
  {
    id: 'bescheid-pruefen',
    name: 'Bescheid prüfen',
    description: 'Analyse von Steuerbescheiden auf Abweichungen',
    icon: FileCheck,
    route: '/tools/bescheid-pruefen',
    status: 'coming-soon',
    badge: 'BALD',
  },
  {
    id: 'gestaltung',
    name: 'Gestaltung',
    description: 'Szenarien für steuerliche Gestaltungsoptionen',
    icon: Lightbulb,
    route: '/tools/gestaltung',
    status: 'coming-soon',
    badge: 'BALD',
  },
  {
    id: 'dokument-zusammenfassen',
    name: 'Dokument zusammenfassen',
    description: 'Schnelle Zusammenfassung langer Steuerdokumente',
    icon: FileText,
    route: '/tools/dokument-zusammenfassen',
    status: 'coming-soon',
    badge: 'BALD',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF → Excel',
    description: 'Automatische Konvertierung von PDF-Tabellen',
    icon: FileSpreadsheet,
    route: '/tools/pdf-to-excel',
    status: 'coming-soon',
    badge: 'BALD',
  },
];
