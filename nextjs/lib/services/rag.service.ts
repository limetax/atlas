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
   * Includes tax law documents and DATEV client/order data from vector search
   */
  async searchContext(query: string): Promise<{
    context: string;
    citations: Citation[];
  }> {
    const { taxContext, datevContext, citations } =
      await this.ragEngine.buildContext(query);

    // Combine contexts
    let combinedContext = "";

    if (taxContext) {
      combinedContext += `=== STEUERRECHTLICHE GRUNDLAGEN ===\n\n${taxContext}\n\n`;
    }

    if (datevContext) {
      combinedContext += `=== DATEV DATEN ===\n\n${datevContext}\n\n`;
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
