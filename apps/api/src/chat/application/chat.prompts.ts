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
} as const;
