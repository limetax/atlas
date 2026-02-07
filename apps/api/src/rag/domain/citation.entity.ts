/**
 * Citation Entity - Domain representation of a source citation
 *
 * This represents our business concept of a citation,
 * independent of how it's retrieved or stored
 */
export interface Citation {
  id: string;
  source: string;
  title: string;
  content: string;
}

/**
 * Tax Document Entity - Domain representation of a tax law document
 */
export interface TaxDocument {
  id: string;
  citation: string;
  title: string;
  content: string;
  category: 'AO' | 'UStG' | 'EStG' | 'KStG' | 'GewStG' | 'other';
}

/**
 * Law Publisher Document Entity - Domain representation of legal publisher content
 * Phase TEC-55: Case law, commentaries, and articles
 */
export interface LawPublisherDocument {
  id: string;
  title: string;
  citation: string | null;
  documentType: 'case_law' | 'commentary' | 'article';
  content: string;
  summary: string | null;
  publisher: string | null;
  source: string | null;
  lawReference: string | null;
  court: string | null;
  caseNumber: string | null;
  decisionDate: string | null;
  publicationDate: string | null;
  author: string | null;
  tags: string[] | null;
}
