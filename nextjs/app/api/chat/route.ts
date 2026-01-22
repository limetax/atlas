import { NextRequest } from "next/server";
import { getChatService } from "@/lib/services/chat.service";
import { Message, Citation } from "@/types";

/**
 * POST /api/chat
 *
 * Streaming chat endpoint using Server-Sent Events (SSE)
 * Accepts a user message and conversation history
 * Returns streaming response with text chunks and citations
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history: Message[];
    };

    // Validate input
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatService = getChatService();

          // Process message and stream response
          for await (const chunk of chatService.processMessage(
            message,
            history || []
          )) {
            if (chunk.type === "text") {
              // Send text chunk
              const data = JSON.stringify({
                type: "text",
                content: chunk.content,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === "citations") {
              // Send citations
              const data = JSON.stringify({
                type: "citations",
                citations: chunk.citations,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send done signal
          const doneData = JSON.stringify({ type: "done" });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);

          // Send error to client
          const errorData = JSON.stringify({
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Ein Fehler ist aufgetreten",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/chat
 * Health check endpoint
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "limetaxIQ Chat API is running",
      version: "1.0.0",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
