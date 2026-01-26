/**
 * Template System Types
 * Frontend-only template system for prompt management
 */

export type TemplateCategory =
  | 'mandantenkommunikation'
  | 'mitarbeitersuche'
  | 'interne-infos'
  | 'aussenauftritt'
  | 'fachliche-unterstuetzung'
  | 'prozessautomatisierung';

export interface Template {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  content: string;
}

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  label: string;
  description?: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  {
    id: 'mandantenkommunikation',
    label: 'Mandantenkommunikation',
    description: 'E-Mails, Briefe und Kommunikation mit Mandanten',
  },
  {
    id: 'mitarbeitersuche',
    label: 'Mitarbeitersuche',
    description: 'Stellenanzeigen und Recruiting',
  },
  {
    id: 'interne-infos',
    label: 'Interne Infos',
    description: 'Checklisten, Memos und interne Kommunikation',
  },
  {
    id: 'aussenauftritt',
    label: 'Außenauftritt',
    description: 'Social Media, Website und PR',
  },
  {
    id: 'fachliche-unterstuetzung',
    label: 'Fachliche Unterstützung',
    description: 'Erklärungen und fachliche Hilfestellungen',
  },
  {
    id: 'prozessautomatisierung',
    label: 'Prozessautomatisierung',
    description: 'FAQs, Vorlagen und Prozessdokumentation',
  },
];
