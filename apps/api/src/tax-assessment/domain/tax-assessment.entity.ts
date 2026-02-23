/**
 * Domain types for DATEV DMS tax assessment documents
 */

export type DmsDocumentState = {
  id: number;
  name: string;
};

export type DmsDocumentOrder = {
  name: string;
};

export type DmsDocument = {
  id: string;
  correspondence_partner_guid: string;
  description: string;
  application: string;
  year: number;
  state: DmsDocumentState;
  order: DmsDocumentOrder | null;
  number: string;
  change_date_time: string;
};

export type DmsStructureItem = {
  id: string;
  name: string;
  document_file_id: number;
  /** 1 = file, 2 = folder */
  type: 1 | 2;
};
