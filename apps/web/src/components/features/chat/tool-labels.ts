export const TOOL_LABELS: Record<string, string> = {
  find_companies_v1_search: 'Suche im Handelsregister nach Unternehmen...',
  autocomplete_companies_v1_search: 'Vervollständige Unternehmensname...',
  get_details_v1_company: 'Rufe Firmendetails aus dem Handelsregister ab...',
  get_owners_v1_company: 'Rufe Gesellschafterinformationen ab...',
  get_financials_v1_company: 'Rufe Finanzdaten aus dem Handelsregister ab...',
};

export function getToolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `Verwende Tool: ${name}...`;
}
