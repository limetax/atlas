import { Citation } from "@/types";
import { getRAGEngine } from "@/lib/infrastructure/rag.engine";

/**
 * RAG Service - Business logic for document retrieval
 * Orchestrates the RAG engine and formats results
 */
export class RAGService {
  private ragEngine = getRAGEngine();

  /**
   * Search for relevant context based on user query
   * Returns formatted context and citations
   */
  async searchContext(query: string): Promise<{
    context: string;
    citations: Citation[];
  }> {
    const { taxContext, mandantenContext, citations } =
      await this.ragEngine.buildContext(query);

    // Combine contexts
    let combinedContext = "";

    if (taxContext) {
      combinedContext += `=== STEUERRECHTLICHE GRUNDLAGEN ===\n\n${taxContext}\n\n`;
    }

    if (mandantenContext) {
      combinedContext += `=== MANDANTEN-INFORMATIONEN ===\n\n${mandantenContext}\n\n`;
    }

    if (!combinedContext) {
      combinedContext =
        "Keine spezifischen Dokumente oder Mandanten-Daten gefunden.";
    }

    return {
      context: combinedContext,
      citations,
    };
  }

  /**
   * Get all open deadlines across all clients
   */
  getAllDeadlines(): string {
    const { context } = this.ragEngine.searchMandanten("alle mandanten");
    return context;
  }

  /**
   * Search for specific tax law paragraphs
   */
  async searchTaxLaw(
    query: string,
    maxResults: number = 3
  ): Promise<{
    context: string;
    citations: Citation[];
  }> {
    const { documents, citations } = await this.ragEngine.searchTaxLaw(
      query,
      maxResults
    );

    if (documents.length === 0) {
      return {
        context: "Keine relevanten Steuergesetze gefunden.",
        citations: [],
      };
    }

    const context = documents
      .map((doc) => `${doc.citation} - ${doc.title}:\n${doc.content}`)
      .join("\n\n");

    return { context, citations };
  }
}

// Singleton instance
let ragServiceInstance: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService();
  }
  return ragServiceInstance;
}
