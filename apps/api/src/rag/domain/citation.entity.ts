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
