/**
 * Reusable prompt templates for chat context
 * Centralizes prompt engineering logic to avoid duplication
 */
export const CONTEXT_PROMPTS = {
  LAW_PUBLISHERS: `

RECHTSVERLAGE-ZUGRIFF:
- Es wurde eine Suche in der Rechtsprechungs-Datenbank durchgeführt
- Prüfe den Kontext-Abschnitt "RECHTSPRECHUNG & KOMMENTARE" für Verfügbarkeit und Ergebnisse
- Wenn Dokumente verfügbar sind, enthalten sie:
  1. Rechtsprechung: Gerichtsurteile (BFH, BVerfG, Finanzgerichte)
  2. Kommentare: Fachkommentare zu Steuergesetzen
  3. Fachartikel: Aktuelle Fachartikel aus Steuerfachzeitschriften

WICHTIG - Verwendung wenn Dokumente gefunden wurden:
- Zitiere Rechtsprechung mit Gericht und Aktenzeichen (z.B., "BFH IV R 10/20")
- Bei Kommentaren nenne den Autor und die Fundstelle
- Bevorzuge aktuelle Rechtsprechung bei rechtlichen Fragestellungen
- Nutze Kommentare für vertiefende Erklärungen
- Kennzeichne deutlich, aus welcher Quelle die Information stammt

WICHTIG - Wenn Datenbank leer ist:
- Informiere den Nutzer transparent, dass die Datenbank aktuell noch keine Dokumente enthält
- Biete an, mit allgemeinem Wissen (nicht verifiziert) zu helfen
- Weise auf externe Quellen hin (BFH-Urteile, Fachkommentare, Zeitschriften)

ZITIERWEISE:
- Rechtsprechung: "Nach BFH-Urteil vom 15.03.2023 (IV R 10/20) gilt..."
- Kommentare: "Laut Kommentar von [Autor] zu § 15 EStG..."
- Fachartikel: "Ein aktueller Beitrag in [Quelle] erläutert..."`,

  /**
   * Efficiency guardrails for tool-calling agents (MCP, handelsregister, etc.)
   * Limits excessive tool iterations and prevents runaway loops
   */
  EFFICIENCY: `

WICHTIG - EFFIZIENZ:
- Verwende maximal 2-3 Tool-Aufrufe pro Anfrage
- Suche zuerst das Unternehmen, dann rufe die benötigten Details ab
- Fasse die Ergebnisse sofort zusammen, anstatt weitere Tools aufzurufen
- Wenn ein Suchergebnis nicht das gewünschte Unternehmen enthält, teile dies dem Benutzer mit, anstatt weitere Suchen durchzuführen`,
  EMAIL: `

E-MAIL-ENTWURF:
- Du kannst E-Mail-Entwürfe direkt im Chat erstellen
- Verwende folgendes Format für E-Mail-Entwürfe:

\`\`\`email
to: empfaenger@beispiel.de
subject: Betreffzeile

Hallo [Name],

Der eigentliche E-Mail-Text...

Mit freundlichen Grüßen
[Absender]
\`\`\`

WICHTIG - Wann E-Mail-Entwürfe erstellen:
- Wenn der Nutzer explizit um eine E-Mail bittet
- Wenn die Antwort als E-Mail-Kommunikation sinnvoll ist
- Für formelle Korrespondenz mit Mandanten oder Behörden

WICHTIG - Format einhalten:
- Erste Zeile: "to: " gefolgt von E-Mail-Adresse(n) (kommagetrennt)
- Zweite Zeile: "subject: " gefolgt von der Betreffzeile
- Dann eine Leerzeile
- Danach der E-Mail-Body-Text
- Nutze professionelle Anrede und Grußformel
- KEIN Markdown im E-Mail-Body: Verwende normalen Text ohne **fett**, _kursiv_ oder andere Markdown-Formatierung`,
} as const;

/**
 * System prompt for generating concise chat titles from the first user message.
 * Used as a fire-and-forget call after chat creation.
 */
export const TITLE_GENERATION_PROMPT =
  'Generate a concise, descriptive title (max 6 words) for a chat conversation that starts with the following user message. Reply with ONLY the title text — no quotes, no punctuation at the end, no explanation. Use the same language as the message.';
