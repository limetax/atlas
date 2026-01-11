/**
 * Script to generate embeddings for tax documents
 * Run with: npx ts-node scripts/generate-embeddings.ts
 *
 * This generates SQL INSERT statements with pre-computed embeddings
 * Copy the output to the migration file for seeding
 */

import { generateEmbedding } from "../lib/infrastructure/embeddings";
import { ALL_TAX_DOCUMENTS } from "../lib/utils/tax-documents";

async function main() {
  console.log("🚀 Generating embeddings for tax documents...\n");
  console.log(`📚 Processing ${ALL_TAX_DOCUMENTS.length} documents\n`);

  const insertStatements: string[] = [];

  for (let i = 0; i < ALL_TAX_DOCUMENTS.length; i++) {
    const doc = ALL_TAX_DOCUMENTS[i];
    console.log(`[${i + 1}/${ALL_TAX_DOCUMENTS.length}] ${doc.citation}...`);

    // Combine title and content for better semantic representation
    const textToEmbed = `${doc.title}: ${doc.content}`;

    try {
      const embedding = await generateEmbedding(textToEmbed);

      // Format embedding as PostgreSQL array literal
      const embeddingStr = `'[${embedding.join(",")}]'`;

      // Escape single quotes in text fields
      const escapedCitation = doc.citation.replace(/'/g, "''");
      const escapedTitle = doc.title.replace(/'/g, "''");
      const escapedContent = doc.content.replace(/'/g, "''");
      const lawType = doc.category || "AO";

      const insertStmt = `INSERT INTO public.tax_documents (citation, title, content, law_type, embedding) VALUES ('${escapedCitation}', '${escapedTitle}', '${escapedContent}', '${lawType}', ${embeddingStr});`;

      insertStatements.push(insertStmt);
      console.log(`   ✅ Generated (${embedding.length} dims)`);
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📋 SQL INSERT STATEMENTS (copy to migration file):");
  console.log("=".repeat(80) + "\n");

  // Print all INSERT statements
  console.log("-- Seed tax documents with pre-computed embeddings");
  console.log("-- Generated on:", new Date().toISOString());
  console.log("");
  insertStatements.forEach((stmt) => console.log(stmt));

  console.log("\n" + "=".repeat(80));
  console.log(`✅ Done! Generated ${insertStatements.length} INSERT statements`);
  console.log("=".repeat(80));
}

main().catch(console.error);
