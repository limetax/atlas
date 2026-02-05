/**
 * Law book patterns and URL templates
 * Supports linking to German tax law references
 */

export interface LawBook {
  name: string;
  pattern: RegExp;
  urlTemplate: string;
}

export const LAW_BOOKS = {
  AO: {
    name: 'Abgabenordnung',
    pattern: /§\s*(\d+[a-z]?)\s*AO/i,
    urlTemplate: 'https://www.gesetze-im-internet.de/ao_1977/__${paragraph}.html',
  },
  UStG: {
    name: 'Umsatzsteuergesetz',
    pattern: /§\s*(\d+[a-z]?)\s*UStG/i,
    urlTemplate: 'https://www.gesetze-im-internet.de/ustg_1980/__${paragraph}.html',
  },
  EStG: {
    name: 'Einkommensteuergesetz',
    pattern: /§\s*(\d+[a-z]?)\s*EStG/i,
    urlTemplate: 'https://www.gesetze-im-internet.de/estg/__${paragraph}.html',
  },
} as const;

export type LawBookCode = keyof typeof LAW_BOOKS;
