import { TaxDocument, Mandant, Citation } from "@/types";
import { TaxDocumentMatch } from "@/types/database";
import { MOCK_MANDANTEN, getAllOpenDeadlines } from "@/lib/utils/mock-data";
import { generateEmbedding } from "@/lib/infrastructure/embeddings";
import { createSupabaseAdminClient } from "@/lib/infrastructure/supabase.server";

/**
 * RAG Engine - Semantic search for tax documents using pgvector
 *
 * Uses Supabase pgvector for semantic similarity search on tax law documents.
 * Mandanten (client) data uses keyword matching as it's structured data.
 */
export class RAGEngine {
  private mandanten: Mandant[];

  constructor() {
    this.mandanten = MOCK_MANDANTEN;
  }

  /**
   * Search tax law documents using semantic vector search (pgvector)
   * Errors propagate to caller - proper error handling via TEC-13
   */
  async searchTaxLaw(
    query: string,
    maxResults: number = 3
  ): Promise<{
    documents: TaxDocument[];
    citations: Citation[];
  }> {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Query Supabase using the match_tax_documents function
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("match_tax_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for German legal text
      match_count: maxResults,
    });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { documents: [], citations: [] };
    }

    // Convert database results to TaxDocument format
    const documents: TaxDocument[] = (data as TaxDocumentMatch[]).map(
      (match) => ({
        id: match.id,
        citation: match.citation,
        title: match.title,
        content: match.content,
        category: match.law_type as TaxDocument["category"],
      })
    );

    // Create citations with similarity scores
    const citations: Citation[] = (data as TaxDocumentMatch[]).map((match) => ({
      id: match.id,
      source: match.citation,
      title: `${match.title} (${Math.round(match.similarity * 100)}% relevant)`,
      content: match.content,
    }));

    return { documents, citations };
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
  async buildContext(query: string): Promise<{
    taxContext: string;
    mandantenContext: string;
    citations: Citation[];
  }> {
    // Search tax law documents (now async due to vector search)
    const { documents: taxDocs, citations } = await this.searchTaxLaw(query);
    const taxContext = this.formatTaxContext(taxDocs);

    // Search client data (still synchronous)
    const { context: mandantenContext } = this.searchMandanten(query);

    return {
      taxContext,
      mandantenContext,
      citations,
    };
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
