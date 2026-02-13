/**
 * Template Data
 * Static templates for prompt management (MVP)
 * Extracted from research/Atikon_Prompts.md
 */

import { Template } from '@/types/template';

export const TEMPLATES: Template[] = [
  // Recherche & Gestaltung - 1 template
  {
    id: 'steuerrechtliche-recherche',
    title: 'Steuerrechtliche Recherche',
    description: 'Recherchiere komplexe steuerrechtliche Fragen mit Quellenangaben',
    category: 'fachliche-unterstuetzung',
    content: `Ich habe eine steuerrechtliche Frage und benötige eine fundierte Recherche mit Quellenangaben.

**Meine Frage:**
[Ihre steuerrechtliche Frage hier einfügen]

**Kontext/Sachverhalt:**
[Relevante Details zum Fall, z.B. Mandantentyp, Rechtsform, besondere Umstände]

Bitte prüfe relevante Gesetzestexte, Rechtsprechung und Verwaltungsanweisungen. Gib klare Handlungsempfehlungen mit Quellenangaben.`,
  },
  // Mandantenkommunikation (Client Communication) - 4 templates
  {
    id: 'mandanten-email',
    title: 'Mandanten-E-Mail',
    description: 'Formuliere eine Mandanten-E-Mail mit klarer Struktur und verständlicher Sprache',
    category: 'mandantenkommunikation',
    content: `Du bist mein Kommunikationsassistent. Schreibe eine E-Mail an Mandanten zur Erinnerung an [Thema einsetzen].

Formuliere sachlich, beruhigend und leicht verständlich. Verwende kurze Sätze und erkläre den Ablauf Schritt für Schritt, ohne komplizierte Fachbegriffe. Achte darauf, dass die Mandanten sich gut betreut fühlen.

Zielgruppe: [Mandantengruppe, z. B. Gewerbetreibende / Privatpersonen]
Tonfall: sachlich, beruhigend, leicht verständlich
Struktur: klare Gliederung, kurze Absätze, ggf. Bulletpoints`,
  },
  {
    id: 'social-media-mandanten',
    title: 'Social-Media-Post für Mandanten',
    description: 'Erstelle einen kurzen Social-Media-Post für Mandanteninformation',
    category: 'mandantenkommunikation',
    content: `Du bist mein Kommunikationsassistent. Erstelle einen Social-Media-Post, der meine Mandanten über das Thema [Thema einsetzen] informiert.

Verwende eine klare, leicht verständliche Sprache. Starte mit einer kurzen Einleitung, liste die wichtigsten Punkte oder Schritte übersichtlich auf und schließe mit einem Call-to-Action, damit die Mandanten rechtzeitig aktiv werden.

Zielgruppe: Mandanten (z. B. Gewerbetreibende / Privatpersonen)
Ton: sachlich, verständlich, vertrauensbildend
Struktur: kurze Einleitung – 3-4 zentrale Infos oder Tipps – Abschluss mit Call-to-Action`,
  },
  {
    id: 'mandanten-infobrief',
    title: 'Mandanten-Informationsbrief',
    description: 'Schreibe einen verständlichen Informationsbrief zu steuerlichen Themen',
    category: 'mandantenkommunikation',
    content: `Du bist mein Fachassistent für Steuerrecht. Erstelle einen Mandanten-Informationsbrief zum Thema: [Thema einsetzen].

Erkläre den Sachverhalt in einfacher Sprache, gib klare Handlungsempfehlungen und führe die relevanten Fristen auf. Vermeide Fachjargon und halte den Text seriös und verständlich.

Ziel: Mandanten sollen den Sachverhalt leicht verstehen und wissen, was sie tun müssen
Stil: Seriös, verständlich, ohne Fachjargon
Struktur: 
1. Kurze Einleitung (Warum ist das Thema wichtig?)
2. Erklärung in Alltagssprache
3. Konkrete Handlungsempfehlung
4. Fristen / nächste Schritte`,
  },
  {
    id: 'mandanten-feedback',
    title: 'Mandanten-Feedback-Anfrage',
    description: 'Formuliere eine wertschätzende E-Mail zur Feedback-Anfrage',
    category: 'mandantenkommunikation',
    content: `Du bist mein Kommunikationsassistent. Schreibe eine kurze, freundliche E-Mail an unsere Mandanten, in der wir uns für die Zusammenarbeit bedanken und um Feedback zu unserer Kanzlei bitten.

Der Ton soll wertschätzend und vertrauensvoll sein. Bitte hebe hervor, dass wir durch die Rückmeldungen unseren Service verbessern wollen und dass alle Antworten selbstverständlich vertraulich behandelt werden.

Zielgruppe: Bestehende Mandanten
Ton: wertschätzend, offen, vertrauensvoll
Struktur: kurze Einleitung – Dank für Zusammenarbeit – Bitte um ehrliches Feedback – Hinweis auf Vertraulichkeit – freundlicher Abschluss`,
  },

  // Mitarbeitersuche (Employee Recruiting) - 3 templates
  {
    id: 'stellenanzeige',
    title: 'Stellenanzeige für eine Fachkraft',
    description: 'Erstelle eine professionelle und einladende Stellenanzeige',
    category: 'mitarbeitersuche',
    content: `Du bist mein Recruiting-Assistent. Erstelle eine Stellenanzeige für die Position [Position einsetzen, z. B. "Steuerfachangestellte/r"] in unserer Kanzlei.

Verwende eine einladende Sprache, die unser Team positiv darstellt. Gliedere den Text in Aufgaben, Anforderungen, Vorteile sowie einen klaren Aufruf zur Bewerbung. Betone unsere moderne Arbeitsweise und die Benefits für Mitarbeiter.

Zielgruppe: Qualifizierte Fachkräfte mit Berufserfahrung
Ton: professionell, einladend, vertrauensbildend
Struktur: Einleitung – Aufgaben – Anforderungen – Vorteile/Kanzlei-Angebot – Call-to-Action`,
  },
  {
    id: 'social-media-recruiting',
    title: 'Social-Media-Post zur Mitarbeitersuche',
    description: 'Schreibe einen authentischen LinkedIn-Post für Recruiting',
    category: 'mitarbeitersuche',
    content: `Du bist mein Social-Media-Manager. Schreibe einen kurzen LinkedIn-Post, um eine/n [Position einsetzen] für unsere Kanzlei zu finden.

Betone Teamgeist, moderne Arbeitsweise und Weiterentwicklungsmöglichkeiten. Verwende eine sympathische Sprache und schließe mit einem Call-to-Action, der zur Bewerbung motiviert.

Zielgruppe: potenzielle Bewerber und Multiplikatoren
Ton: authentisch, motivierend, sympathisch
Format: kurze Einleitung, 3-4 Benefits, klarer Bewerbungsaufruf`,
  },
  {
    id: 'bewerber-email',
    title: 'Kurze E-Mail an potenzielle Bewerber',
    description: 'Formuliere eine persönliche und wertschätzende E-Mail an Bewerber',
    category: 'mitarbeitersuche',
    content: `Du bist mein Kommunikationsassistent. Schreibe eine freundliche E-Mail, mit der ich potenzielle Bewerber für unsere Kanzlei anspreche.

Halte die Nachricht kurz und wertschätzend, stelle unsere Kanzlei positiv vor, hebe ein bis zwei Vorteile hervor (z. B. flexible Arbeitszeiten, modernes Arbeitsumfeld) und lade die Person zu einem unverbindlichen Kennenlernen ein.

Ziel: Interesse wecken und zu einem Kennenlern-gespräch einladen
Ton: freundlich, wertschätzend, unkompliziert`,
  },

  // Interne Infos (Internal Staff Info) - 4 templates
  {
    id: 'mitarbeiter-checkliste',
    title: 'Checkliste für Mitarbeiter',
    description: 'Erstelle eine praxisnahe Checkliste für interne Prozesse',
    category: 'interne-infos',
    content: `Du bist mein Kanzlei-Assistent. Erstelle eine Checkliste für Mitarbeiter mit dem Thema: [z. B. "Vorgehen bei Eingang neuer Mandantenunterlagen"].

Formuliere eine nummerierte Liste mit kurzen, klaren Handlungsschritten, die Mitarbeiter sofort umsetzen können.

Thema: [Thema einsetzen]
Form: nummerierte Liste, kurze und klare Handlungsschritte`,
  },
  {
    id: 'internes-memo',
    title: 'Internes Memo',
    description: 'Entwirf ein knappes und strukturiertes internes Memo',
    category: 'interne-infos',
    content: `Du bist mein interner Organisationsassistent. Erstelle ein kurzes Memo für meine Mitarbeiter zum Thema [z. B. 'Neue Vorgehensweise bei E-Mails an Mandanten'].

Verwende eine klare, strukturierte Sprache. Sei direkt, sachlich und stelle die wichtigsten Punkte in einer übersichtlichen Liste dar.

Thema: [Thema einsetzen]
Ton: direkt, klar, knapp
Format: Bullet Points`,
  },
  {
    id: 'wochenuebersicht',
    title: 'Interner Wochenüberblick für Mitarbeiter',
    description: 'Erstelle einen übersichtlichen Wochenüberblick mit Terminen und Aufgaben',
    category: 'interne-infos',
    content: `Du bist mein interner Kommunikationsassistent. Erstelle einen Wochenüberblick für meine Mitarbeiter.

Fasse die wichtigsten Termine, Fristen und Aufgaben für die kommende Woche in einer strukturierten Liste zusammen. Verwende klare Sprache, motiviere das Team kurz und schließe mit einem Hinweis auf die zuständige Ansprechperson für Rückfragen.

Zielgruppe: Mitarbeiter der Kanzlei
Ton: sachlich, übersichtlich, motivierend
Struktur: Einleitung – wichtigste Termine / Fristen – To-dos – Hinweis auf Unterstützung / Ansprechperson`,
  },
  {
    id: 'team-update',
    title: 'Team-Update für Mitarbeiter',
    description: 'Erstelle eine kurze Zusammenfassung wichtiger Neuigkeiten für das Team',
    category: 'interne-infos',
    content: `Du bist mein interner Kommunikationsassistent. Erstelle ein kurzes Team-Update für meine Mitarbeiter.

Fasse die wichtigsten Neuigkeiten, Änderungen oder Erfolge der letzten Woche zusammen. Verwende eine positive, motivierende Sprache und halte die Nachricht prägnant.

Zielgruppe: Mitarbeiter der Kanzlei
Ton: positiv, motivierend, informativ
Struktur: kurze Einleitung – wichtigste Updates (3-5 Punkte) – Ausblick`,
  },

  // Außenauftritt (Public Relations) - 4 templates
  {
    id: 'social-media-linkedin',
    title: 'Social-Media-Post für LinkedIn',
    description: 'Schreibe einen professionellen LinkedIn-Post mit Mehrwert',
    category: 'aussenauftritt',
    content: `Du bist mein Social-Media-Manager. Schreibe einen kurzen Social-Media-Post für unsere Steuerkanzlei auf LinkedIn zum Thema [Thema einsetzen].

Der Ton soll professionell, aber nahbar sein. Verwende eine positive, zukunftsorientierte Sprache und runde den Beitrag mit einem Call-to-Action ab.

Thema: [z. B. "Tipps für die Umsatzsteuer-Voranmeldung"]
Zielgruppe: Mandanten + potenzielle Neukunden
Ton: professionell, leicht verständlich, Mehrwert bieten
Format: kurze Einleitung, 3-5 Tipps, Abschluss mit Call-to-Action`,
  },
  {
    id: 'website-text',
    title: 'Text für die Website',
    description: 'Formuliere einen serviceorientierten Website-Text',
    category: 'aussenauftritt',
    content: `Du bist mein Assistent für Marketingtexte. Erstelle einen Website-Text zum Thema [z. B. 'Digitale Buchhaltung – so profitieren Sie'].

Formuliere eine Einleitung, liste die Vorteile klar auf, beschreibe unser Angebot verständlich und schließe mit einem Call-to-Action zur Kontaktaufnahme.

Thema: [Thema einsetzen]
Zielgruppe: Selbstständige und KMU
Ton: seriös, serviceorientiert, vertrauensbildend
Struktur: Einleitung – Vorteile – unser Angebot – Kontaktmöglichkeit`,
  },
  {
    id: 'pressemitteilung',
    title: 'Text für eine Pressemitteilung',
    description: 'Erstelle eine professionelle Pressemitteilung oder News-Artikel',
    category: 'aussenauftritt',
    content: `Du bist mein PR-Assistent. Erstelle eine Pressemitteilung zu [Thema einsetzen].

Schreibe seriös, positiv und professionell.

Zielgruppe: regionale Medien, Geschäftspartner, Mandanten
Ton: seriös, professionell, positiv
Struktur: Einleitung mit Anlass – kurze Erklärung/Details – Zitat (optional) – Ausblick oder Call-to-Action`,
  },
  {
    id: 'vortrag-praesentation',
    title: 'Vortrag/Präsentation (z. B. für Infoabende)',
    description: 'Erstelle eine Gliederung für einen informativen Vortrag',
    category: 'aussenauftritt',
    content: `Du bist mein Präsentationsassistent. Erstelle eine Gliederung für einen 10-minütigen Vortrag zum Thema [Thema einsetzen].

Starte mit Begrüßung und Problemstellung, präsentiere 3-4 praxisnahe Tipps und schließe mit einem motivierenden Ausblick und Einladung zu Fragen.

Zielgruppe: Mandanten, potenzielle Neukunden, Fachpublikum
Ton: informativ, praxisnah, verständlich
Struktur: Begrüßung – Problemstellung – Tipps / Lösungen – Nutzen – Abschluss mit Einladung zu Fragen`,
  },

  // Fachliche Unterstützung (Technical Support) - 1 template
  {
    id: 'gesetzesaenderung-erklaert',
    title: 'Gesetzesänderung einfach erklärt',
    description: 'Erkläre komplexe Gesetzesänderungen in Alltagssprache',
    category: 'fachliche-unterstuetzung',
    content: `Du bist mein Fachassistent für Steuerrecht. Erkläre die folgende Gesetzesänderung für meine Mandanten in Alltagssprache: [Text einfügen].

Schreibe eine kurze Einleitung, fasse die wichtigsten Punkte in Bullet Points zusammen und gib ein anschauliches Beispiel.

Stil: Alltagssprache, Beispiele verwenden
Ziel: Mandanten verstehen, was sich ändert und ob sie betroffen sind
Format: Kurze Einleitung + klare Aufzählungspunkte + Beispiel`,
  },

  // Prozessautomatisierung (Process Automation) - 5 templates
  {
    id: 'faq-mandanten',
    title: 'FAQ für Mandanten',
    description: 'Erstelle eine FAQ-Liste zu häufigen Mandantenfragen',
    category: 'prozessautomatisierung',
    content: `Du bist mein Assistent für Mandantenkommunikation. Erstelle eine FAQ-Liste zum Thema [Thema einsetzen, z. B. 'Homeoffice-Pauschale'].

Formuliere einfache Fragen und beantworte sie in kurzen, klaren Sätzen, die auch für Laien verständlich sind.

Stil: einfache Fragen + kurze, klare Antworten
Ziel: Mandanten können die wichtigsten Infos schnell nachlesen`,
  },
  {
    id: 'vergleich-ueberblick',
    title: 'Kurzer Vergleich / Überblick',
    description: 'Erstelle eine übersichtliche Gegenüberstellung von Regelungen',
    category: 'prozessautomatisierung',
    content: `Du bist mein Fachassistent für Steuerrecht. Erstelle eine übersichtliche Darstellung der Unterschiede zwischen [Option A] und [Option B].

Verwende einfache Sprache, stelle die Unterschiede in einer Tabelle dar und schließe mit einer kurzen Empfehlung, für wen welche Regelung sinnvoll ist.

Ziel: Mandanten sollen schnell die Unterschiede verstehen
Stil: einfache Sprache, tabellarisch oder stichpunktartig`,
  },
  {
    id: 'dokument-zusammenfassung',
    title: 'Zusammenfassung von Dokumenten',
    description: 'Fasse lange Texte in prägnante Bulletpoints zusammen',
    category: 'prozessautomatisierung',
    content: `Du bist mein Kanzleiassistent. Fasse den folgenden Text in maximal 10 Bulletpoints zusammen.

Achte auf neutrale, klare und strukturierte Sprache. Ziel ist, dass ich den Inhalt in einer Minute erfassen kann: [Text einfügen].

Stil: neutral, klar, strukturiert
Ziel: Ich möchte den Inhalt in einer Minute erfassen`,
  },
  {
    id: 'todo-aus-meeting',
    title: 'To-do-Liste aus Meeting-Notizen',
    description: 'Verwandle Meeting-Notizen in eine strukturierte To-do-Liste',
    category: 'prozessautomatisierung',
    content: `Du bist mein Organisationsassistent. Verwandle die folgenden Meeting-Notizen in eine To-do-Liste.

Stelle die Ergebnisse in einer Tabelle mit den Spalten Aufgabe | Zuständig | Termin dar: [Notizen einfügen].

Struktur: Aufgabe | Zuständiger | Termin (Tabelle)`,
  },
  {
    id: 'email-vorlagen-generator',
    title: 'E-Mail-Vorlagen-Generator',
    description: 'Erstelle standardisierte E-Mail-Vorlagen für wiederkehrende Situationen',
    category: 'prozessautomatisierung',
    content: `Du bist mein Kanzleiassistent. Erstelle drei kurze E-Mail-Vorlagen:
1) Erinnerung an eine Frist
2) Terminbestätigung für ein Beratungsgespräch
3) Nachforderung fehlender Unterlagen

Formuliere die Vorlagen sachlich, klar und so, dass Mitarbeiter sie direkt verwenden und bei Bedarf mit individuellen Daten ergänzen können.

Ziel: Mitarbeiter sparen Zeit, indem sie fertige Vorlagen nutzen
Stil: neutral, klar, anpassbar
Struktur: Betreff – Textbausteine – optionale Platzhalter`,
  },
];
