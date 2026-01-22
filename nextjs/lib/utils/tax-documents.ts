import { TaxDocument } from "@/types";

/**
 * Sample German Tax Law Documents
 * Source: https://www.gesetze-im-internet.de/ao_1977/
 *
 * These are real excerpts from the Abgabenordnung (AO)
 * for demonstration purposes in the RAG system
 */
export const TAX_DOCUMENTS: TaxDocument[] = [
  {
    id: "ao_1",
    citation: "§ 1 AO",
    title: "Anwendungsbereich",
    content: `Die Abgabenordnung gilt für alle Steuern einschließlich der Steuervergütungen, die durch Bundesrecht oder Recht der Europäischen Union geregelt sind, soweit sie durch Bundesfinanzbehörden oder durch Landesfinanzbehörden verwaltet werden. Sie gilt auch für die Realsteuern, soweit gesetzlich nichts anderes bestimmt ist.`,
    category: "AO",
  },
  {
    id: "ao_38",
    citation: "§ 38 AO",
    title: "Steuerschuldner",
    content: `Steuerschuldner ist, wer die Steuer schuldet oder für die Steuer haftet. Steuerschuldner kann auch sein, wer kraft Gesetzes verpflichtet ist, Steuern einzubehalten und abzuführen (Steuerabzugsverpflichteter).`,
    category: "AO",
  },
  {
    id: "ao_42",
    citation: "§ 42 AO",
    title: "Entstehung der Steuer",
    content: `Die Steuer entsteht, sobald der Tatbestand verwirklicht ist, an den das Gesetz die Leistungspflicht knüpft. Die Steuerfestsetzung ist nicht konstitutiv, sondern deklaratorisch. Die Steuer entsteht unabhängig davon, ob und wann sie festgesetzt wird.`,
    category: "AO",
  },
  {
    id: "ao_108",
    citation: "§ 108 AO",
    title: "Abgabefristen",
    content: `Steuererklärungen sind nach amtlich vorgeschriebenem Vordruck abzugeben. Sie sind eigenhändig zu unterschreiben. Die Finanzbehörde kann Ausnahmen zulassen. Steuererklärungen sind grundsätzlich bis zum 31. Juli des Folgejahres abzugeben, soweit nicht durch Rechtsverordnung eine andere Frist bestimmt ist.`,
    category: "AO",
  },
  {
    id: "ao_149",
    citation: "§ 149 AO",
    title: "Abgabe der Steuererklärungen",
    content: `Steuerpflichtige haben ihre Steuererklärungen nach amtlich vorgeschriebenem Datensatz durch Datenfernübertragung zu übermitteln. Auf Antrag kann die Finanzbehörde zur Vermeidung unbilliger Härten auf eine elektronische Übermittlung verzichten.`,
    category: "AO",
  },
  {
    id: "ao_152",
    citation: "§ 152 AO",
    title: "Besteuerungsverfahren",
    content: `Das Besteuerungsverfahren ist ein amtliches Verfahren. Die Finanzbehörden ermitteln den Sachverhalt von Amts wegen. Sie bestimmen Art und Umfang der Ermittlungen. Der Steuerpflichtige hat an der Ermittlung des Sachverhalts mitzuwirken.`,
    category: "AO",
  },
  {
    id: "ao_169",
    citation: "§ 169 AO",
    title: "Festsetzungsfrist",
    content: `Die Festsetzungsfrist beträgt vier Jahre. Sie beginnt mit Ablauf des Kalenderjahrs, in dem die Steuer entstanden ist. Abweichend hiervon beginnt die Festsetzungsfrist bei Steuern, die nach einem Kalenderjahr oder einem Wirtschaftsjahr bemessen werden, erst mit Ablauf des dritten Kalenderjahrs, das auf das Kalenderjahr oder Wirtschaftsjahr folgt.`,
    category: "AO",
  },
  {
    id: "ao_233",
    citation: "§ 233a AO",
    title: "Verzinsung von Steuernachforderungen und Steuererstattungen",
    content: `Führt die Festsetzung der Einkommen-, Körperschaft-, Vermögen-, Umsatz- oder Gewerbesteuer zu einem Unterschiedsbetrag im Sinne des Absatzes 3, ist dieser zu verzinsen. Dies gilt nicht für die Festsetzung von Vorauszahlungen und Steuerabzugsbeträgen. Der Zinslauf beginnt 15 Monate nach Ablauf des Kalenderjahrs, in dem die Steuer entstanden ist.`,
    category: "AO",
  },
  {
    id: "ao_238",
    citation: "§ 238 AO",
    title: "Buchführungspflicht",
    content: `Gewerbliche Unternehmer sowie Land- und Forstwirte, die nach den Feststellungen der Finanzbehörde für den einzelnen Betrieb bestimmte Größenmerkmale überschreiten, sind verpflichtet, für diesen Betrieb Bücher zu führen und auf Grund jährlicher Bestandsaufnahmen Abschlüsse zu machen.`,
    category: "AO",
  },
  {
    id: "ao_370",
    citation: "§ 370 AO",
    title: "Steuerhinterziehung",
    content: `Mit Freiheitsstrafe bis zu fünf Jahren oder mit Geldstrafe wird bestraft, wer den Finanzbehörden oder anderen Behörden über steuerlich erhebliche Tatsachen unrichtige oder unvollständige Angaben macht, die Finanzbehörden pflichtwidrig über steuerlich erhebliche Tatsachen in Unkenntnis lässt oder pflichtwidrig die Verwendung von Steuerzeichen oder Steuerstemplern unterlässt und dadurch Steuern verkürzt oder nicht gerechtfertigte Steuervorteile erlangt.`,
    category: "AO",
  },
  {
    id: "ao_146a",
    citation: "§ 146a AO",
    title:
      "Ordnungsvorschriften für die Buchführung und für Aufzeichnungen mittels elektronischer Aufzeichnungssysteme",
    content: `Wer aufzeichnungspflichtige Geschäftsvorfälle oder andere Vorgänge mit Hilfe eines elektronischen Aufzeichnungssystems erfasst, hat ein elektronisches Aufzeichnungssystem zu verwenden, das jeden aufzeichnungspflichtigen Geschäftsvorfall einzeln, vollständig, richtig, zeitgerecht und geordnet aufzeichnet. Das elektronische Aufzeichnungssystem muss mit einer zertifizierten technischen Sicherheitseinrichtung ausgestattet sein (TSE - Technische Sicherheitseinrichtung). Die Anforderungen gelten insbesondere für elektronische Registrierkassen.`,
    category: "AO",
  },
  {
    id: "ao_162",
    citation: "§ 162 AO",
    title: "Schätzung von Besteuerungsgrundlagen",
    content: `Soweit die Finanzbehörde die Besteuerungsgrundlagen nicht ermitteln oder berechnen kann, hat sie diese zu schätzen. Dabei sind alle Umstände zu berücksichtigen, die für die Schätzung von Bedeutung sind. Geschätzt werden kann insbesondere dann, wenn der Steuerpflichtige über seine Angaben keine ausreichenden Aufklärungen zu geben vermag oder weitere Auskunft oder eine Versicherung an Eides statt verweigert oder seine Mitwirkungspflicht nach § 90 Abs. 2 verletzt.`,
    category: "AO",
  },
  {
    id: "ao_152",
    citation: "§ 152 AO",
    title: "Verspätungszuschlag",
    content: `Gegen denjenigen, der seiner Verpflichtung zur Abgabe einer Steuererklärung nicht oder nicht fristgemäß nachkommt, kann ein Verspätungszuschlag festgesetzt werden. Der Verspätungszuschlag beträgt mindestens 25 Euro für jeden angefangenen Monat der eingetretenen Verspätung. Bei einer Steuererklärung, die durch Datenfernübertragung zu übermitteln ist, beträgt der Verspätungszuschlag 0,25 Prozent der festgesetzten Steuer, mindestens jedoch 25 Euro für jeden angefangenen Monat der eingetretenen Verspätung.`,
    category: "AO",
  },
];

/**
 * Additional tax law references for context
 */
/**
 * Additional UStG (Umsatzsteuergesetz) documents
 */
export const USTG_DOCUMENTS: TaxDocument[] = [
  {
    id: "ustg_18",
    citation: "§ 18 UStG",
    title: "Besteuerungsverfahren",
    content: `Der Unternehmer hat bis zum 10. Tag nach Ablauf jedes Voranmeldungszeitraums eine Voranmeldung nach amtlich vorgeschriebenem Datensatz durch Datenfernübertragung zu übermitteln, in der er die Steuer für den Voranmeldungszeitraum (Vorauszahlung) selbst zu berechnen hat. Voranmeldungszeitraum ist das Kalendervierteljahr. Beträgt die Steuer für das vorangegangene Kalenderjahr mehr als 7.500 Euro, ist der Kalendermonat Voranmeldungszeitraum.`,
    category: "UStG",
  },
  {
    id: "ustg_14",
    citation: "§ 14 UStG",
    title: "Ausstellung von Rechnungen",
    content: `Rechnung ist jedes Dokument, mit dem über eine Lieferung oder sonstige Leistung abgerechnet wird. Eine Rechnung muss folgende Angaben enthalten: vollständiger Name und Anschrift des leistenden Unternehmers und des Leistungsempfängers, Steuernummer oder Umsatzsteuer-Identifikationsnummer, Ausstellungsdatum, fortlaufende Rechnungsnummer, Menge und Art der gelieferten Gegenstände oder Umfang und Art der sonstigen Leistung, Zeitpunkt der Lieferung oder sonstigen Leistung, Entgelt und gesondert ausgewiesene Umsatzsteuer.`,
    category: "UStG",
  },
  {
    id: "ustg_13b",
    citation: "§ 13b UStG",
    title: "Leistungsempfänger als Steuerschuldner (Reverse-Charge)",
    content: `Die Steuer entsteht in den Fällen des Absatzes 2 mit Ausstellung der Rechnung, spätestens jedoch mit Ablauf des der Leistung folgenden Kalendermonats. Steuerschuldner ist der Leistungsempfänger bei Bauleistungen, bei der Lieferung von Schrott und anderen Abfallstoffen, bei der Übertragung von Emissionszertifikaten und bei Lieferungen sicherungsübereigneter Gegenstände.`,
    category: "UStG",
  },
];

// Combine all tax documents
export const ALL_TAX_DOCUMENTS = [...TAX_DOCUMENTS, ...USTG_DOCUMENTS];

export const TAX_LAW_REFERENCES = {
  EStG: "Einkommensteuergesetz",
  UStG: "Umsatzsteuergesetz",
  AO: "Abgabenordnung",
  GewStG: "Gewerbesteuergesetz",
  KStG: "Körperschaftsteuergesetz",
  BewG: "Bewertungsgesetz",
};

/**
 * Common tax deadlines (German tax calendar)
 */
export const COMMON_TAX_DEADLINES = [
  {
    task: "Umsatzsteuer-Voranmeldung",
    frequency: "Monatlich oder vierteljährlich",
    deadline: "10. des Folgemonats",
  },
  {
    task: "Lohnsteuer-Anmeldung",
    frequency: "Monatlich",
    deadline: "10. des Folgemonats",
  },
  {
    task: "Einkommensteuererklärung",
    frequency: "Jährlich",
    deadline: "31. Juli des Folgejahres",
  },
  {
    task: "Körperschaftsteuererklärung",
    frequency: "Jährlich",
    deadline: "31. Juli des Folgejahres",
  },
  {
    task: "Gewerbesteuererklärung",
    frequency: "Jährlich",
    deadline: "31. Juli des Folgejahres",
  },
];
