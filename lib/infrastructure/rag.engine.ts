import { TaxDocument, Mandant, Citation } from "@/types";
import { ALL_TAX_DOCUMENTS } from "@/lib/utils/tax-documents";
import { MOCK_MANDANTEN, getAllOpenDeadlines } from "@/lib/utils/mock-data";

/**
 * RAG Engine - Simple keyword-based search for tax documents and client data
 *
 * For a production system, this would use:
 * - Vector embeddings (e.g., OpenAI embeddings)
 * - Vector database (e.g., Pinecone, Weaviate)
 * - Semantic search
 *
 * For this prototype, we use simple keyword matching
 */
export class RAGEngine {
  private taxDocuments: TaxDocument[];
  private mandanten: Mandant[];

  constructor() {
    this.taxDocuments = ALL_TAX_DOCUMENTS;
    this.mandanten = MOCK_MANDANTEN;
  }

  /**
   * Search tax law documents by keywords
   * Returns relevant documents with citations
   */
  searchTaxLaw(
    query: string,
    maxResults: number = 3
  ): {
    documents: TaxDocument[];
    citations: Citation[];
  } {
    const lowerQuery = query.toLowerCase();
    const keywords = this.extractKeywords(lowerQuery);

    // Score each document based on keyword matches
    const scoredDocuments = this.taxDocuments.map((doc) => {
      let score = 0;
      const lowerContent = doc.content.toLowerCase();
      const lowerTitle = doc.title.toLowerCase();

      // Check for exact paragraph references (e.g., "§ 1", "§ 42")
      const paragraphMatch = lowerQuery.match(/§\s*(\d+)/);
      if (paragraphMatch) {
        const paragraphNum = paragraphMatch[1];
        if (doc.citation.includes(`§ ${paragraphNum}`)) {
          score += 100; // High priority for exact paragraph matches
        }
      }

      // Score based on keyword matches
      keywords.forEach((keyword) => {
        if (lowerTitle.includes(keyword)) score += 10;
        if (lowerContent.includes(keyword)) score += 5;
        if (doc.citation.toLowerCase().includes(keyword)) score += 15;
      });

      return { doc, score };
    });

    // Sort by score and take top results
    const topDocuments = scoredDocuments
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.doc);

    // Create citations
    const citations: Citation[] = topDocuments.map((doc) => ({
      id: doc.id,
      source: doc.citation,
      title: doc.title,
      content: doc.content,
    }));

    return { documents: topDocuments, citations };
  }

  /**
   * Search client (Mandanten) data
   * Returns relevant clients and their deadlines
   */
  searchMandanten(query: string): {
    mandanten: Mandant[];
    context: string;
  } {
    const lowerQuery = query.toLowerCase();

    // Check if query is asking for all clients or deadlines
    const isAskingForAll =
      lowerQuery.includes("alle mandanten") ||
      lowerQuery.includes("alle fristen") ||
      lowerQuery.includes("übersicht") ||
      lowerQuery.includes("zusammenfassung");

    if (isAskingForAll) {
      const allDeadlines = getAllOpenDeadlines();
      const context = this.formatAllDeadlinesContext(allDeadlines);
      return { mandanten: this.mandanten, context };
    }

    // Search for specific client by name
    const matchingMandanten = this.mandanten.filter((mandant) =>
      mandant.name.toLowerCase().includes(lowerQuery)
    );

    if (matchingMandanten.length > 0) {
      const context = this.formatMandantenContext(matchingMandanten);
      return { mandanten: matchingMandanten, context };
    }

    // No specific match, return empty
    return { mandanten: [], context: "" };
  }

  /**
   * Build context for RAG-augmented prompt
   */
  buildContext(query: string): {
    taxContext: string;
    mandantenContext: string;
    citations: Citation[];
  } {
    // Search tax law documents
    const { documents: taxDocs, citations } = this.searchTaxLaw(query);
    const taxContext = this.formatTaxContext(taxDocs);

    // Search client data
    const { context: mandantenContext } = this.searchMandanten(query);

    return {
      taxContext,
      mandantenContext,
      citations,
    };
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common German stop words
    const stopWords = [
      "der",
      "die",
      "das",
      "ein",
      "eine",
      "und",
      "oder",
      "ist",
      "sind",
      "wie",
      "was",
      "für",
      "bei",
      "von",
      "zu",
      "mit",
      "auf",
      "in",
      "an",
    ];

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Format tax documents as context string
   */
  private formatTaxContext(documents: TaxDocument[]): string {
    if (documents.length === 0) return "";

    return documents
      .map((doc) => `${doc.citation} - ${doc.title}:\n${doc.content}\n`)
      .join("\n");
  }

  /**
   * Format Mandanten data as context string
   */
  private formatMandantenContext(mandanten: Mandant[]): string {
    if (mandanten.length === 0) return "";

    return mandanten
      .map((mandant) => {
        const openDeadlines = mandant.deadlines.filter(
          (d) => d.status === "open"
        );
        const deadlinesList = openDeadlines
          .map((d) => `  - ${d.date}: ${d.task} (Priorität: ${d.priority})`)
          .join("\n");

        return `Mandant: ${mandant.name} (${mandant.type})\nOffene Fristen:\n${deadlinesList}`;
      })
      .join("\n\n");
  }

  /**
   * Format all deadlines across all clients
   */
  private formatAllDeadlinesContext(
    deadlines: Array<{
      id: string;
      date: string;
      task: string;
      priority: string;
      mandantName: string;
      mandantType: string;
    }>
  ): string {
    if (deadlines.length === 0) {
      return "Keine offenen Fristen gefunden.";
    }

    const grouped = deadlines.reduce((acc, deadline) => {
      if (!acc[deadline.mandantName]) {
        acc[deadline.mandantName] = [];
      }
      acc[deadline.mandantName].push(deadline);
      return acc;
    }, {} as Record<string, typeof deadlines>);

    let context = `Übersicht aller offenen Fristen (${deadlines.length} gesamt):\n\n`;

    Object.entries(grouped).forEach(([mandantName, mandantDeadlines]) => {
      context += `${mandantName}:\n`;
      mandantDeadlines.forEach((d) => {
        context += `  - ${d.date}: ${d.task} (${d.priority})\n`;
      });
      context += "\n";
    });

    return context;
  }
}

// Singleton instance
let ragEngineInstance: RAGEngine | null = null;

export function getRAGEngine(): RAGEngine {
  if (!ragEngineInstance) {
    ragEngineInstance = new RAGEngine();
  }
  return ragEngineInstance;
}
