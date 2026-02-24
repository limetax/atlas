/**
 * Status labels emitted during chat streaming to provide user feedback.
 * These are transient UI labels — not persisted in the database.
 */
export const CHAT_STATUS = {
  SEARCHING_KNOWLEDGE: 'Durchsuche Wissensdatenbank...',
  THINKING: 'Analysiere Anfrage...',
} as const;
